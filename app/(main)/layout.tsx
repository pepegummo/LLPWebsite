"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useProjectStore } from "@/store/projectStore";
import { useTeamStore } from "@/store/teamStore";
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
  const { fetchWorkspaces, workspaces } = useWorkspaceStore();
  const { fetchProjects } = useProjectStore();
  const { fetchMyTeams } = useTeamStore();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setHydrated(true);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) {
      router.replace("/login");
    }
  }, [hydrated, currentUser, router]);

  // Fetch core data once when authenticated
  useEffect(() => {
    if (!currentUser) return;
    fetchWorkspaces();
    fetchMyTeams();
  }, [currentUser?.id]);

  // Fetch projects for each workspace when workspaces load
  useEffect(() => {
    workspaces.forEach((ws) => fetchProjects(ws.id));
  }, [workspaces.length]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">กำลังโหลด...</div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/10">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
