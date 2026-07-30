export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/events";
import { trackError } from "@/lib/errorTracking";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);



function subscriptionRole(product?: string) {

  if (product === "pro_subscription") {
    return "PRO";
  }


  if (product === "agency_subscription") {
    return "BUSINESS";
  }


  if (product === "business_subscription") {
    return "BUSINESS";
  }


  return null;
}



export async function POST(req: NextRequest) {

  const signature =
    req.headers.get("stripe-signature");


  if (!signature) {
    return NextResponse.json(
      {
        error:"Missing signature"
      },
      {
        status:400
      }
    );
  }


  const body = await req.text();



  let event: Stripe.Event;


  try {

    event =
      stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );


  } catch(error){

    console.error(
      "STRIPE SIGNATURE ERROR",
      error
    );


    await trackError({
      type:"stripe_signature_error",
      error
    });


    return NextResponse.json(
      {
        error:"Webhook signature invalid"
      },
      {
        status:400
      }
    );

  }



  try {


    if (
      event.type ===
      "checkout.session.completed"
    ) {


      const session =
        event.data.object as Stripe.Checkout.Session;


      const metadata =
        session.metadata || {};


      const userId =
        metadata.userId;


      const product =
        metadata.product;



      if (userId && product) {


        const role =
          subscriptionRole(product);



        if(role){

          await prisma.user.update({
            where:{
              id:userId
            },
            data:{
              role,
              stripeCustomerId:
                typeof session.customer === "string"
                ? session.customer
                : undefined,

              subscriptionId:
                typeof session.subscription === "string"
                ? session.subscription
                : undefined,

              subscriptionStatus:
                "active",

              subscriptionEndDate:
                new Date(
                  Date.now() +
                  30 *
                  24 *
                  60 *
                  60 *
                  1000
                )
            }
          });



          await trackEvent({
            type:
              `${product}_activated`,
            userId,
            metadata:{
              sessionId:session.id,
              plan:metadata.plan || null
            }
          });


        }



        if(
          product ===
          "full_audit_unlock"
          &&
          metadata.reportId
        ){

          await prisma.upload.updateMany({

            where:{
              id:metadata.reportId,
              userId
            },

            data:{
              unlocked:true,
              unlockedAt:new Date(),
              checkoutSessionId:
                session.id
            }

          });


          await trackEvent({

            type:
              "full_audit_unlocked",

            userId,

            reportId:
              metadata.reportId,

            metadata:{
              sessionId:
                session.id
            }

          });

        }

      }

    }




    if(
      event.type ===
      "customer.subscription.updated"
    ){

      const subscription =
        event.data.object as any;


      const user =
        await prisma.user.findFirst({

          where:{
            subscriptionId:
              subscription.id
          }

        });



      if(user){

        const active =
          subscription.status === "active" ||
          subscription.status === "trialing";


        const product =
          subscription.metadata?.product;


        const role =
          active
          ? subscriptionRole(product) || user.role
          : "FREE";


        await prisma.user.update({

          where:{
            id:user.id
          },

          data:{
            role,
            subscriptionStatus:
              subscription.status,

            subscriptionEndDate:
              subscription.current_period_end
              ? new Date(
                  subscription.current_period_end *
                  1000
                )
              : user.subscriptionEndDate
          }

        });


      }

    }




    if(
      event.type ===
      "customer.subscription.deleted"
    ){

      const subscription =
        event.data.object as any;


      const user =
        await prisma.user.findFirst({

          where:{
            subscriptionId:
              subscription.id
          }

        });



      if(user){

        await prisma.user.update({

          where:{
            id:user.id
          },

          data:{
            role:"FREE",
            subscriptionStatus:
              "cancelled",
            subscriptionEndDate:
              new Date()
          }

        });


        await trackEvent({

          type:
            "subscription_cancelled",

          userId:
            user.id

        });

      }

    }





    if(
      event.type ===
      "invoice.payment_failed"
    ){

      const invoice =
        event.data.object as any;


      const subscriptionId =
        typeof invoice.subscription === "string"
        ? invoice.subscription
        : null;



      if(subscriptionId){

        const user =
          await prisma.user.findFirst({

            where:{
              subscriptionId
            }

          });



        if(user){

          await prisma.user.update({

            where:{
              id:user.id
            },

            data:{
              subscriptionStatus:
                "past_due"
            }

          });


        }

      }

    }




    return NextResponse.json({
      received:true
    });


  } catch(error){


    console.error(
      "STRIPE WEBHOOK ERROR",
      error
    );


    await trackError({
      type:"stripe_webhook_error",
      error
    });


    return NextResponse.json(
      {
        error:"Webhook processing failed"
      },
      {
        status:500
      }
    );

  }

}
