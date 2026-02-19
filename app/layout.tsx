import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Effluxa",
  description: "AI invoice reconciliation platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ fontFamily: "Arial, sans-serif", margin: 0 }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
