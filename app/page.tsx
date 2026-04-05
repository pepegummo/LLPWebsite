"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

export default function RootPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) {
      router.replace("/login");
    } else if (currentUser.role === "student") {
      router.replace("/student/dashboard");
    } else {
      router.replace("/staff/dashboard");
    }
  }, [hydrated, currentUser, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-muted-foreground">กำลังโหลด...</div>
    </div>
  );
}
