"use client";

import { useState } from "react";

type Props = {
  plan:
    | "pro_monthly"
    | "pro_annual"
    | "agency_monthly"
    | "agency_annual";
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


      const response =
        await fetch(
          "/api/stripe/create-subscription",
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
