"use client";

import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold">Loading...</h2>
        <p className="text-muted-foreground">Please wait while we load your session</p>
      </div>
    </div>
  );
} 