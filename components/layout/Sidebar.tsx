"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { GroupSwitcher } from "./GroupSwitcher";
import { NotificationBadge } from "./NotificationBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Star,
  LogOut,
  Settings,
  BarChart3,
  ClipboardList,
  Link2,
  CalendarDays,
  MessageCircle,
  Video,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  notification?: boolean;
}

const studentNavItems: NavItem[] = [
  { label: "แดชบอร์ด", href: "/student/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "งาน (Kanban)", href: "/student/tasks", icon: <KanbanSquare className="w-4 h-4" /> },
  { label: "ปฏิทิน / Timeline", href: "/student/calendar", icon: <CalendarDays className="w-4 h-4" /> },
  { label: "การประชุม", href: "/student/meeting", icon: <Video className="w-4 h-4" /> },
  { label: "ลิงก์", href: "/student/links", icon: <Link2 className="w-4 h-4" /> },
  { label: "Group Chat", href: "/student/chat", icon: <MessageCircle className="w-4 h-4" /> },
  { label: "ทีม", href: "/student/team", icon: <Users className="w-4 h-4" /> },
  { label: "ประเมินผล", href: "/student/evaluation", icon: <Star className="w-4 h-4" /> },
  { label: "การแจ้งเตือน", href: "/student/notifications", icon: <NotificationBadge />, notification: true },
];

const staffNavItems: NavItem[] = [
  { label: "แดชบอร์ด", href: "/staff/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "จัดการกลุ่ม", href: "/staff/setup", icon: <Settings className="w-4 h-4" /> },
  { label: "Rubric & Evaluation", href: "/staff/setup/rubric", icon: <SlidersHorizontal className="w-4 h-4" /> },
  { label: "ผลการประเมิน", href: "/staff/setup/eval-results", icon: <Star className="w-4 h-4" /> },
  { label: "รายงานความคืบหน้า", href: "/staff/setup/progress", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "การแจ้งเตือน", href: "/staff/notifications", icon: <NotificationBadge />, notification: true },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();

  const isStudent = currentUser?.role === "student";
  const navItems = isStudent ? studentNavItems : staffNavItems;

  const handleLogout = () => {
    logout();
    toast.success("ออกจากระบบแล้ว");
    router.replace("/login");
  };

  const roleLabel = () => {
    if (currentUser?.role === "professor") return "อาจารย์";
    if (currentUser?.role === "ta") return "TA";
    return "นักศึกษา";
  };

  const isActive = (href: string) => {
    if (
      href === "/student/dashboard" ||
      href === "/staff/dashboard" ||
      href === "/staff/setup"
    ) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Backdrop — mobile only (desktop uses push mode so no overlay needed) */}
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
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-bold text-sm">Multi</p>
                <p className="text-xs text-muted-foreground">ระบบจัดการโปรเจกต์</p>
              </div>
            </div>
            {/* Close button — mobile only */}
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Info */}
        {currentUser && (
          <div className="px-4 py-3 border-b border-border shrink-0">
            <p className="font-medium text-sm truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{roleLabel()}</p>
          </div>
        )}

        {/* Group Switcher (students only) */}
        {isStudent && (
          <div className="border-b border-border shrink-0">
            <GroupSwitcher />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
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
