import type { Metadata } from "next";
import Link from "next/link";
import PublicFooter from "@/components/PublicFooter";
import PublicHeader from "@/components/PublicHeader";
import styles from "./sample.module.css";

const title = "Sample accounts payable audit | Effluxa";
const description =
  "Trace one potential $480 duplicate to two entries in a fictional accounts payable export. " +
  "Download the source CSV and a one-page report.";
const canonical = "https://www.effluxa.com/sample-audit";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { title, description, url: canonical, siteName: "Effluxa", type: "article" },
};

export default function SampleAuditPage() {
  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <PublicHeader />
        <main className={styles.report}>
          <header className={styles.intro}>
            <p className={styles.kicker}>Month-end close / Sample report</p>
            <h1>Did Alder Studio get paid twice?</h1>
            <p className={styles.lead}>
              Two rows list the same $480 invoice. Both say “paid,” but they carry different
              payment references. Here’s the evidence a bookkeeper can take to reconciliation.
            </p>
            <p className={styles.note}>All eight rows are fictional. Amounts are in US dollars.</p>
          </header>

          <dl className={styles.totals}>
            <div>
              <dt>Rows in the export</dt>
              <dd>8</dd>
            </div>
            <div>
              <dt>Potential duplicate amount</dt>
              <dd>$480</dd>
            </div>
            <div>
              <dt>Confirmed recovery</dt>
              <dd>$0</dd>
            </div>
          </dl>

          <section className={styles.section} aria-labelledby="evidence-heading">
            <h2 id="evidence-heading">The two entries behind the flag</h2>
            <p>
              Both entries name Alder Studio, invoice AS-1042, dated September 8, 2026. The
              row IDs below match the downloadable export.
            </p>
            <div className={styles.tableFrame}>
              <table className={styles.evidence}>
                <caption>Alder Studio · Invoice AS-1042</caption>
                <thead>
                  <tr>
                    <th scope="col">Row ID</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Payment ref.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">R01</th>
                    <td>$480.00</td>
                    <td>Paid</td>
                    <td>P-201</td>
                  </tr>
                  <tr>
                    <th scope="row">R02</th>
                    <td>$480.00</td>
                    <td>Paid</td>
                    <td>P-224</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              The entries total $960. One $480 invoice was expected, so only the additional
              $480 is under review.
            </p>
          </section>

          <section className={styles.section} aria-labelledby="other-rows-heading">
            <h2 id="other-rows-heading">Why the other pairs clear</h2>
            <div className={styles.pairs}>
              <div>
                <h3>Harbor Hosting · R03 and R04</h3>
                <p>
                  Two $120 fees cover September and October. Each has its own invoice number,
                  HH-SEP and HH-OCT.
                </p>
              </div>
              <div>
                <h3>Juniper Supply · R05 and R06</h3>
                <p>
                  The $240 invoice JS-330 is offset by a −$240 credit note, CR-330. Together
                  they net to $0 in the export.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="reconcile-heading">
            <h2 id="reconcile-heading">What to check before contacting the vendor</h2>
            <ol className={styles.steps}>
              <li>Find P-201 and P-224 in the payment register and match each to a settled bank debit.</li>
              <li>Check the vendor statement for a reversal, refund, credit or second valid invoice.</li>
              <li>Record the outcome. Count cash recovered only after you can trace a refund or applied credit.</li>
            </ol>
            <div className={styles.downloads}>
              <a href="/samples/month-end-payables.csv" download>Download the eight-row CSV</a>
              <a href="/samples/month-end-payables.pdf" download>Download the one-page PDF</a>
            </div>
            <p className={styles.note}>Try it on a copy. Remove R02 and the exact duplicate disappears.</p>
          </section>

          <section className={styles.pilot} aria-labelledby="pilot-heading">
            <h2 id="pilot-heading">Would this help with your next close?</h2>
            <p>
              If you handle bill pay for clients, tell us how you check for duplicates today.
              You can ask about a one-file pilot without sharing client records.
            </p>
            <Link
              className={styles.primary}
              href="/contact?subject=Partner%20pilot&source=partner_pilot&utm_source=sample_audit&utm_medium=owned&utm_campaign=payables_pilot"
            >
              Ask about the pilot
            </Link>
            <a className={styles.direct} href="mailto:support@effluxa.com?subject=Month-end%20payables%20pilot">Email support@effluxa.com</a>
          </section>
        </main>
      </div>
      <PublicFooter />
    </div>
  );
}
