"use client";

import { useState } from "react";
import { trackClientEvent } from "@/lib/clientAnalytics";

export type SubscriptionPlan =
  | "pro_monthly"
  | "pro_annual"
  | "agency_monthly"
  | "agency_annual";

type Props = {
  plan: SubscriptionPlan;
  label: string;
};


export default function SubscriptionButton({
  plan,
  label,
}: Props) {

  const [loading,setLoading] = useState(false);


  async function subscribe(){

    try {

      setLoading(true);
      trackClientEvent("subscription_checkout_started", { plan });


      const response =
        await fetch(
          "/api/paddle/create-subscription",
          {
            method:"POST",
            headers:{
              "Content-Type":"application/json"
            },
            body:JSON.stringify({
              plan
            })
          }
        );


      const data =
        await response.json();


      if (data.transactionId) {
        window.location.href = `/checkout?_ptxn=${encodeURIComponent(data.transactionId)}`;
        return;
      }

      if(data.url){

        window.location.href = data.url;
        return;

      }


      alert(
        data.error ||
        "Unable to start subscription"
      );


    } catch(error){

      alert(
        "Subscription error. Please try again."
      );

    } finally {

      setLoading(false);

    }

  }


  return (

    <button
      className="primary-button"
      disabled={loading}
      onClick={subscribe}
    >

      {loading
        ? "Redirecting..."
        : label}

    </button>

  );

}
