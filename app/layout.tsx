import "./globals.css";

export const metadata = {
  title: "Effluxa",
  description: "AI Invoice Reconciliation Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh" }}>
          <header style={{
            background: "white",
            borderBottom: "1px solid #e5e5e5",
            padding: "20px 40px",
            display: "flex",
            justifyContent: "space-between"
          }}>
            <h1 style={{ margin: 0 }}>Effluxa</h1>
            <span style={{ color: "#666" }}>
              AI Invoice Reconciliation
            </span>
          </header>

          <main style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
