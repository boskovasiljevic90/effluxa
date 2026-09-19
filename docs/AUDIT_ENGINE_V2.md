# Effluxa Audit Engine V2

Audit Engine V2 is implemented as an additive pipeline under `src/lib/audit-v2`:

1. Local PDF text extraction with page markers, followed by multi-pass structured financial extraction by domain (invoice ledger, payments/controls, working capital/KPIs, opex/people/assets, financing/related parties)
2. Normalization of vendors, invoice numbers, dates, and amounts
3. Deterministic control rules
4. Evidence verifier and deduplication
5. Conservative quantified metrics
6. Optional executive reasoning
7. Legacy-compatible report JSON

## Activation

V1 remains the default:

~~~text
EFFLUXA_AUDIT_V2_ENABLED is unset or false
~~~

Enable V2 only in a controlled environment:

~~~text
EFFLUXA_AUDIT_V2_ENABLED=true
~~~

V2 reports are stored in the existing `Upload.parsedData` JSON field with:

~~~text
analysisVersion: "2.0"
extractedData
findings
metrics
~~~

Set `EFFLUXA_AUDIT_V2_ENABLED=false` or remove it to roll back immediately to V1. No Prisma migration is required.

## Optional reasoning layer

The deterministic rules run after extraction. The additional AI reasoning pass is disabled unless explicitly enabled:

~~~text
EFFLUXA_AUDIT_V2_REASONING=true
~~~

This pass receives the structured extracted data and verified findings to create an executive summary and action themes. It is an additional external AI request and should be enabled only when the deployment's data-processing policy allows it.

Optional model overrides:

~~~text
EFFLUXA_AUDIT_V2_MODEL=gpt-4.1
EFFLUXA_AUDIT_V2_REASONING_MODEL=gpt-4.1
~~~

For deployments with a lower token-per-minute limit, tune extraction without changing the rule engine:

~~~text
EFFLUXA_AUDIT_V2_CONCURRENCY=2
EFFLUXA_AUDIT_V2_MAX_OUTPUT_TOKENS=6000
EFFLUXA_AUDIT_V2_TRANSACTION_MAX_OUTPUT_TOKENS=12000
EFFLUXA_AUDIT_V2_REQUEST_TIMEOUT_MS=300000
EFFLUXA_AUDIT_V2_MAX_RETRIES=0
~~~

The extractor uses bounded concurrency, a per-pass output cap, a request timeout, and an explicit retry budget. A lower concurrency reduces rate-limit bursts; keep the output cap high enough to preserve long transaction ledgers.

## Current rule coverage

- Exact AP duplicate
- Near-duplicate AP invoice
- Split invoice below approval threshold
- Vendor bank-account change before payment
- Material vendor price increase
- Overdue receivable or credit-limit exception
- Unused or inactive software license
- Overtime policy exception
- Negative or slow-moving inventory
- Debt covenant, financing fee, or penalty exception
- Weekend payment review
- Recurring round-value professional-services pattern
- Unapplied customer credits and receipts
- Gross-margin and EBITDA budget gaps
- Collaboration-tool overlap and post-go-live legacy-system cost
- Overtime trend escalation and approval exceptions
- Travel/hotel, personal-expense, duplicate-claim, and corporate-card controls
- Inventory provision gap and write-off review
- Unhedged FX commitments
- Related-party price changes and director receivables
- Operating-cost budget growth, AP aging, and customer concentration

Amounts are separated into potential duplicate exposure, working-capital exposure, control-risk exposure, and avoidable-cost run-rate. The legacy `estimated_savings` field is populated only from the conservative avoidable-cost run-rate; duplicate and working-capital exposure are not presented as confirmed savings.

The extractor preserves source page/row references and uses a compact schema for the long invoice ledger, so repeated invoice numbers and later pages fit within production token limits without dropping the rule-relevant evidence fields. For PDFs, the upload route first extracts text locally and labels each page before sending it to the model. Rules are intentionally phrased as review indicators: they do not assert fraud, unsupported duplicates, competitive pricing, or realized savings without source evidence.

## Local verification

Run the repeatable seeded rule-coverage check with:

~~~text
npm run audit:v2:smoke
~~~

The harness compiles the rule engine in a temporary directory and checks that every current rule family produces an evidence-backed finding. It does not call OpenAI and does not require database access.
