# Paddle setup checklist

Configure these values in local development and Vercel. Never commit API keys or webhook secrets.

```text
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_ENVIRONMENT=sandbox
PADDLE_CHECKOUT_URL=https://www.effluxa.com/checkout
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
PADDLE_FULL_AUDIT_PRICE_ID=pri_
PADDLE_PRO_MONTHLY_PRICE_ID=pri_
PADDLE_PRO_ANNUAL_PRICE_ID=pri_
PADDLE_AGENCY_MONTHLY_PRICE_ID=pri_
PADDLE_AGENCY_ANNUAL_PRICE_ID=pri_
```

Set the Paddle default payment link to `https://www.effluxa.com/checkout` and verify the domain in Paddle Checkout settings. Add this webhook endpoint:

```text
https://www.effluxa.com/api/paddle/webhook
```

Subscribe the endpoint to transaction completed/payment failed and all subscription lifecycle events used by `src/app/api/paddle/webhook/route.ts`.

For sandbox validation, use Paddle's sandbox credentials and a Paddle test card. The backend uses the Paddle Node SDK; the browser checkout uses Paddle.js.
