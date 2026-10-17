"use client";

import { useState, type ReactNode } from "react";
import { SplashScreen } from "@/components/layout/SplashScreen";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash ? <SplashScreen onDone={() => setShowSplash(false)} /> : null}
      {children}
    </>
  );
}
