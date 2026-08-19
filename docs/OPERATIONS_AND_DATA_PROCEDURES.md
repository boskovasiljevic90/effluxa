# Effluxa Operations, Data and Security Procedures

Status: launch-ready operating baseline  
Owner: NeedAIHelp / Effluxa  
Support: support@effluxa.com

This document reflects the current production architecture. It is an operating procedure, not legal advice.

## 1. Daily operating routine

1. Check `support@effluxa.com` for payment, upload, report-access and privacy requests.
2. Check the Effluxa Admin dashboard for new users, audits, tracked errors and contact messages.
3. Check Paddle for completed, failed, past-due, cancelled and refunded transactions.
4. Check Vercel deployment/runtime logs for repeated upload, webhook, AI or database errors.
5. Record any customer-impacting incident in the incident log with date, scope, action and resolution.

## 2. Payment and subscription procedure

Effluxa uses Paddle as Merchant of Record. Effluxa does not store card numbers.

### Checkout completed

1. Confirm the Paddle transaction status is completed/paid.
2. Confirm the transaction contains the Effluxa user ID and selected product in Paddle custom data.
3. Confirm the webhook reached `/api/paddle/webhook` and the user role/access changed.
4. Ask the customer to sign out and back in only if the dashboard has not refreshed.
5. If access is still missing, record the Paddle transaction ID and account email and investigate before changing a role manually.

### Payment failed or subscription is past due

1. Do not grant or extend paid access manually.
2. Ask the customer to retry using the Paddle checkout or Manage Billing portal.
3. Check Paddle status and the latest webhook event.
4. Escalate repeated failures to Paddle support with the transaction/subscription ID.

### Cancellation and refund

1. Subscription cancellation is performed by the customer in Manage Billing or by the operator in Paddle.
2. Cancellation stops future renewals; access follows the subscription status and end date delivered by Paddle.
3. Refund requests are reviewed case by case. Do not promise a refund before checking the transaction and applicable rules.
4. Record the decision, Paddle reference and date in the support thread.

## 3. Upload and report procedure

1. Ask for the account email, file type, approximate file size and exact error message.
2. Do not ask customers to send sensitive financial files by email unless strictly necessary and explicitly approved.
3. Confirm the supported formats: PDF, CSV, XLSX and XLS.
4. Check whether the customer reached the free-audit limit or has an active paid plan.
5. Check the Admin dashboard and runtime logs for `ai_service_unavailable`, `ai_quota_exceeded`, upload validation or database errors.
6. If the report is generated with limited data, explain that the result is a screening report and ask for a broader export only when appropriate.

## 4. Account and data deletion procedure

### Self-service deletion

1. The customer cancels any active Pro or Agency subscription in Manage Billing.
2. The customer opens Dashboard → Settings → Delete Account.
3. The customer enters the account email and confirms the warning.
4. Effluxa permanently deletes the application account, reports, clients, team memberships, support messages, reset tokens and account events.
5. Paddle billing and transaction records remain with Paddle where required for merchant, tax, fraud-prevention or legal obligations.

### Support-assisted deletion

Use this when the customer cannot log in or has a legacy billing record:

1. Verify the request came from the account email or complete reasonable account ownership verification.
2. Check Paddle for an active subscription. Do not delete an account while an active subscription is still renewing.
3. Cancel the subscription in Paddle if the customer explicitly requests cancellation.
4. Run the same application deletion procedure and record completion date, scope and Paddle reference.
5. Reply with the deletion confirmation template.

### Retention schedule

| Data | Current handling | Retention |
| --- | --- | --- |
| Original upload file | Not stored as a separate downloadable archive; filename metadata is stored with the report | While report/account exists |
| Generated report data | Stored to provide report history and downloads | While account is active, until user/report deletion |
| Password-reset tokens | Automatically removed when expired/old | Up to 30 days |
| Operational events | Used for security, support and product diagnostics | Up to 180 days |
| Contact messages | Used to resolve support and business requests | Up to 24 months |
| Paddle transaction records | Held by Paddle as Merchant of Record | According to Paddle/legal requirements |

## 5. Security procedure

1. Never paste API keys, webhook secrets, passwords or customer financial data into support messages or public issues.
2. Keep production secrets in Vercel environment variables; do not commit `.env` files.
3. Use the dedicated operational admin account only for administration; do not use it as a customer test account.
4. Review Vercel and Paddle access whenever a collaborator changes.
5. Rotate a secret immediately if it may have been exposed.
6. Treat any unexpected role change, webhook signature failure spike, login spike or data exposure as a security incident.
7. Preserve only the minimum diagnostic details needed to investigate an incident.

## 6. Incident response

### Severity 1 — payments, authentication or customer data affected

1. Confirm the issue and record the first observed time.
2. Pause marketing claims or paid traffic if customers cannot complete the core workflow.
3. Check Vercel, database, Paddle and email provider status.
4. Protect the affected surface: disable a broken action or rotate a compromised secret.
5. Communicate a short status update to affected customers.
6. Restore service, verify signup → upload → report → billing, and document the root cause.

### Severity 2 — individual upload/report/support issue

1. Acknowledge the customer message.
2. Reproduce with a safe non-sensitive document when possible.
3. Provide a workaround and target a live patch.
4. Confirm resolution with the customer and record the final cause.

## 7. Launch operating rule

Effluxa may be marketed without a separate beta cohort. The first real customers become the live feedback loop. Every live update must still pass the production build, public-route smoke check and a safe upload/report check before deployment.
