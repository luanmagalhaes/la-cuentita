"use client";

import { useRouter } from "next/navigation";
import { HistoryScreen } from "@/components/history/HistoryScreen";

export default function Page() {
  const router = useRouter();

  return <HistoryScreen onBack={() => router.push("/")} />;
}
