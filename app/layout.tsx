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
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-primary">
                Effluxa
              </h1>
              <span className="text-sm text-gray-500">
                AI Invoice Reconciliation
              </span>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-6 py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
