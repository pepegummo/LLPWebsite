"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore, useTeamStore } from "@/store";
import { useDisplayName } from "@/lib/useDisplayName";
import { GroupSwitcher } from "./GroupSwitcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  KanbanSquare,
  Calendar,
  Video,
  MessageCircle,
  Users,
  Paperclip,
  ClipboardCheck,
  LifeBuoy,
  LogOut,
  X,
  Settings,
  Layers,
  Shield,
  UserCircle,
  Library,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  leaderOnly?: boolean;
  requiresTeam?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "ภาพรวม",
    items: [
      { label: "แดชบอร์ด", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "งาน", href: "/tasks", icon: <KanbanSquare className="w-4 h-4" />, requiresTeam: true },
      { label: "ปฏิทิน", href: "/calendar", icon: <Calendar className="w-4 h-4" />, requiresTeam: true },
    ],
  },
  {
    title: "ทีมงาน",
    items: [
      { label: "ประชุม", href: "/meeting", icon: <Video className="w-4 h-4" />, requiresTeam: true },
      { label: "แชท", href: "/chat", icon: <MessageCircle className="w-4 h-4" />, requiresTeam: true },
      { label: "ทีม", href: "/team", icon: <Users className="w-4 h-4" />, requiresTeam: true },
      { label: "ลิงก์", href: "/links", icon: <Paperclip className="w-4 h-4" />, requiresTeam: true },
    ],
  },
  {
    title: "อื่นๆ",
    items: [
      { label: "ประเมินผล", href: "/evaluation", icon: <ClipboardCheck className="w-4 h-4" />, requiresTeam: true },
      { label: "แจ้งปัญหา", href: "/ticket", icon: <LifeBuoy className="w-4 h-4" />, requiresTeam: true },
    ],
  },
  {
    title: "จัดการ",
    items: [
      { label: "Workspace", href: "/workspace", icon: <Layers className="w-4 h-4" /> },
      { label: "Template Library", href: "/templates", icon: <Library className="w-4 h-4" />, leaderOnly: true, requiresTeam: true },
      { label: "ตั้งค่าทีม", href: "/setup", icon: <Shield className="w-4 h-4" />, leaderOnly: true, requiresTeam: true },
    ],
  },
  {
    title: "บัญชี",
    items: [
      { label: "ข้อมูลส่วนตัว", href: "/profile", icon: <UserCircle className="w-4 h-4" /> },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();
  const { getUserRole } = useTeamStore();

  const resolveDisplayName = useDisplayName();
  const activeTeamId = currentUser?.activeTeamId ?? null;
  const userRole = activeTeamId && currentUser
    ? getUserRole(activeTeamId, currentUser.id)
    : null;
  const isLeaderOrAssistant = userRole === "team_leader" || userRole === "assistant_leader";

  const handleLogout = () => {
    logout();
    toast.success("ออกจากระบบแล้ว");
    router.replace("/login");
  };

  const isActive = (href: string) => {
    if (
      href === "/dashboard" ||
      href === "/workspace" ||
      href === "/setup" ||
      href === "/profile" ||
      href === "/templates"
    ) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const roleLabel = () => {
    if (userRole === "team_leader") return "Team Leader";
    if (userRole === "assistant_leader") return "Assistant Leader";
    if (userRole === "member") return "Member";
    return "ไม่มีทีม";
  };

  return (
    <>
      {/* Backdrop — mobile only */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          "flex flex-col w-64 h-screen bg-card border-r border-border fixed left-0 top-0 z-40 overflow-y-auto",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none">Multi</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Project Manager</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User info */}
        {currentUser && (
          <div className="px-4 py-3 border-b border-border shrink-0">
            <p className="font-medium text-sm truncate leading-none">
            {resolveDisplayName(currentUser.id, currentUser.name)}
          </p>
            <p className="text-xs text-muted-foreground mt-1">{roleLabel()}</p>
          </div>
        )}

        {/* Team switcher */}
        <div className="border-b border-border shrink-0">
          <GroupSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navSections.map((section, si) => {
            const visibleItems = section.items.filter(
              (item) =>
                (!item.leaderOnly || isLeaderOrAssistant) &&
                (!item.requiresTeam || !!activeTeamId)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={si} className={cn(si > 0 && "mt-1")}>
                {section.title && (
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
                    {section.title}
                  </p>
                )}
                <div className="px-2 space-y-0.5">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </Button>
        </div>
      </aside>
    </>
  );
}
