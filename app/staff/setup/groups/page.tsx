"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page has been merged into /staff/setup
export default function StaffGroupsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/staff/setup");
  }, [router]);
  return null;
}
