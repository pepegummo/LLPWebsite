"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  // Default open on desktop, closed on mobile — set after mount to avoid SSR mismatch
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setHydrated(true);
    // On mobile start with sidebar closed
    if (window.innerWidth < 768) setSidebarOpen(false);
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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Content shifts on desktop (push mode), stays full-width on mobile (overlay mode) */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-[margin] duration-300 ease-in-out",
          sidebarOpen ? "md:ml-64" : "md:ml-0"
        )}
      >
        <TopBar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
