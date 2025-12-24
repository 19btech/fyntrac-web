import "./globals.css";
import { TenantProvider } from "./tenant-context";
import ThemeRegistry from './theme/theme-registry';
export const metadata = {
  title: "fyntrac",
  description: "Financial Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <TenantProvider>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </TenantProvider>
      </body>
    </html>
  );
}