

import "./globals.css";
import { TenantProvider } from "./tenant-context";

import localFont from "next/font/local";

const geistSans = localFont({
  src: [
    { path: "../../public/fonts/geist/Geist-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/geist/Geist-Medium.woff2", weight: "500" },
    { path: "../../public/fonts/geist/Geist-Bold.woff2", weight: "700" },
  ],
});

const geistMono = localFont({
  src: [
    { path: "../../public/fonts/geist-mono/GeistMono-Regular.woff2", weight: "400" },
    { path: "../../public/fonts/geist-mono/GeistMono-Medium.woff2", weight: "500" },
  ],
});


export const metadata = {
  title: "fyntrac",
  description: "Financial Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TenantProvider>{children}</TenantProvider>

      </body>
    </html>
  );
}
