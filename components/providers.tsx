"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { LoadingScreen } from "@/components/ui/loading-screen";

function SessionWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionWrapper>{children}</SessionWrapper>
    </SessionProvider>
  );
} 