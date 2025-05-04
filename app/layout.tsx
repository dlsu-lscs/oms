import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { validateDatabaseConnection } from "@/lib/db";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LSCS OMS",
  description: "La Salle Computer Society Operations Management System",
};

async function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const isConnected = await validateDatabaseConnection();

  if (!isConnected) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-destructive">Database Connection Error</h1>
              <p className="mt-2 text-muted-foreground">
                Unable to connect to the database. Please check your connection settings and try again.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default RootLayoutContent;
