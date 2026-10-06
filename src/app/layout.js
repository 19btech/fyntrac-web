import "./globals.css";
import { TenantProvider } from "./tenant-context";
import ThemeRegistry from './theme/theme-registry';
import ChunkErrorHandler from './chunk-error-handler';
import { RUNTIME_CONFIG_GLOBAL, readServerRuntimeConfig } from './services/runtime-config';

// Render per request so the service URLs come from the running container's env, not the build.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Fyntrac | Home",
  description: "Financial Platform",
};

export default function RootLayout({ children }) {
  const runtimeConfig = JSON.stringify(readServerRuntimeConfig()).replace(/</g, '\\u003c');
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `window.${RUNTIME_CONFIG_GLOBAL}=${runtimeConfig};` }} />
      </head>
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