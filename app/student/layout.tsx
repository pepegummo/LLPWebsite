"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { Sidebar } from "@/components/layout/Sidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    } else if (currentUser.role !== "student") {
      router.replace("/staff/dashboard");
    }
  }, [hydrated, currentUser, router]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">กำลังโหลด...</div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "student") {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/10">
      <Sidebar />
      <div className="ml-64">
        <main className="min-h-screen">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
