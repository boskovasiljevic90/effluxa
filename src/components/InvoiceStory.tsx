import styles from "./InvoiceStory.module.css";

const stages = [
  {
    name: "Source",
    key: "source",
    caption: "Alder Studio invoice AS-1042 appears on two source rows for $480.00 each.",
  },
  {
    name: "Match",
    key: "match",
    caption: "The vendor, invoice, currency and amount match. The payment references are P-201 and P-224.",
  },
  {
    name: "Review",
    key: "review",
    caption: "A potential $480.00 duplicate. Check both references against settled bank debits before acting.",
  },
] as const;

export default function InvoiceStory() {
  return (
    <figure className={styles.story} aria-labelledby="invoice-trail-heading">
      <div className={styles.storyHeading}>
        <h2 id="invoice-trail-heading">Invoice trail</h2>
        <span>Fictional example</span>
      </div>

      <div className={styles.scene} aria-hidden="true">
        <div className={styles.contours} />
        <div className={styles.backSheet} />
        <div className={styles.sheet}>
          <div className={styles.paperTop}>
            <span className={styles.fileMark}>E</span>
            <span>Payables register</span>
            <span className={styles.currency}>USD</span>
          </div>
          <div className={styles.vendor}>Alder Studio</div>
          <div className={styles.columnLabels}><span>Invoice / payment</span><span>Amount</span></div>
          <div className={styles.rows}>
            {["P-201", "P-224"].map((payment, index) => (
              <div className={styles.row} key={payment}>
                <div><b>AS-1042</b><small>R0{index + 1} · {payment}</small></div>
                <b>$480.00</b>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.finding}>
          <div className={styles.findingHeader}><i />Review finding</div>
          <div className={styles.amount}>$480<span>.00</span></div>
          <div className={styles.findingTitle}>Potential duplicate</div>
          <div className={styles.findingSource}>AS-1042 <span>R01 + R02</span></div>
        </div>
      </div>

      <fieldset className={styles.controls}>
        <legend className={styles.srOnly}>Explore the invoice trail</legend>
        {stages.map((stage, index) => (
          <label className={styles.control} key={stage.key}>
            <input
              type="radio"
              name="effluxa-invoice-stage"
              value={stage.key}
              defaultChecked={index === 0}
              aria-describedby={`invoice-caption-${stage.key}`}
            />
            <span>{stage.name}</span>
          </label>
        ))}
      </fieldset>
      <figcaption className={styles.caption}>
        {stages.map(stage => (
          <span key={stage.key} id={`invoice-caption-${stage.key}`} data-caption={stage.key}>
            {stage.caption}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
