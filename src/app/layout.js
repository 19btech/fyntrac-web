import "./globals.css";
import { TenantProvider } from "./tenant-context";
import ThemeRegistry from './theme/theme-registry';
import ChunkErrorHandler from './chunk-error-handler';

export const metadata = {
  title: "fyntrac",
  description: "Financial Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ChunkErrorHandler />
        <TenantProvider>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </TenantProvider>
      </body>
    </html>
  );
}