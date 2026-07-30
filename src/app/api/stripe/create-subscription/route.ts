export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);


const allowedPlans = {
  pro_monthly: "STRIPE_PRO_MONTHLY_PRICE_ID",
  pro_annual: "STRIPE_PRO_ANNUAL_PRICE_ID",
  agency_monthly: "STRIPE_AGENCY_MONTHLY_PRICE_ID",
  agency_annual: "STRIPE_AGENCY_ANNUAL_PRICE_ID",
} as const;


export async function POST(req: NextRequest) {

  try {

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          error:"Unauthorized"
        },
        {
          status:401
        }
      );
    }


    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId:string;
    };


    const user = await prisma.user.findUnique({
      where:{
        id:decoded.userId
      }
    });


    if(!user){
      return NextResponse.json(
        {
          error:"User not found"
        },
        {
          status:404
        }
      );
    }


    const body = await req.json();

    const plan =
      body.plan as keyof typeof allowedPlans;


    if(!allowedPlans[plan]){
      return NextResponse.json(
        {
          error:"Invalid subscription plan"
        },
        {
          status:400
        }
      );
    }


    const priceId =
      process.env[
        allowedPlans[plan]
      ];


    if(!priceId){

      return NextResponse.json(
        {
          error:"Stripe price not configured"
        },
        {
          status:500
        }
      );

    }


    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://www.effluxa.com";


    const product =
      plan.startsWith("agency")
      ? "agency_subscription"
      : "pro_subscription";


    const session =
      await stripe.checkout.sessions.create({

        mode:"subscription",

        customer_email:user.email,

        line_items:[
          {
            price:priceId,
            quantity:1
          }
        ],


        metadata:{
          userId:user.id,
          product,
          plan
        },


        subscription_data:{
          metadata:{
            userId:user.id,
            product,
            plan
          }
        },


        success_url:
        `${appUrl}/dashboard?subscription=success`,


        cancel_url:
        `${appUrl}/dashboard?subscription=cancelled`

      });


    return NextResponse.json({
      url:session.url
    });


  } catch(error){

    console.error(
      "SUBSCRIPTION CHECKOUT ERROR",
      error
    );


    return NextResponse.json(
      {
        error:"Subscription checkout failed"
      },
      {
        status:500
      }
    );

  }

}
