import "./globals.css";
import { TenantProvider } from "./tenant-context";

export const metadata = {
  title: "fyntrac",
  description: "Financial Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TenantProvider>{children}</TenantProvider>
      </body>
    </html>
  );
}