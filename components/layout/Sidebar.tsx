"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
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
  Users2,
  ListChecks,
  BarChart3,
  TrendingUp,
  MessageSquareMore,
  Layers,
  LogOut,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const studentNavSections: NavSection[] = [
  {
    title: "ภาพรวม",
    items: [
      { label: "แดชบอร์ด", href: "/student/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { label: "งาน", href: "/student/tasks", icon: <KanbanSquare className="w-4 h-4" /> },
      { label: "ปฏิทิน", href: "/student/calendar", icon: <Calendar className="w-4 h-4" /> },
    ],
  },
  {
    title: "ทีมงาน",
    items: [
      { label: "ประชุม", href: "/student/meeting", icon: <Video className="w-4 h-4" /> },
      { label: "แชท", href: "/student/chat", icon: <MessageCircle className="w-4 h-4" /> },
      { label: "ทีม", href: "/student/team", icon: <Users className="w-4 h-4" /> },
      { label: "ลิงก์", href: "/student/links", icon: <Paperclip className="w-4 h-4" /> },
    ],
  },
  {
    title: "อื่นๆ",
    items: [
      { label: "ประเมินผล", href: "/student/evaluation", icon: <ClipboardCheck className="w-4 h-4" /> },
      { label: "แจ้งปัญหา", href: "/student/ticket", icon: <LifeBuoy className="w-4 h-4" /> },
    ],
  },
];

const staffNavSections: NavSection[] = [
  {
    items: [
      { label: "แดชบอร์ด", href: "/staff/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    title: "จัดการ",
    items: [
      { label: "กลุ่มโปรเจกต์", href: "/staff/setup", icon: <Users2 className="w-4 h-4" /> },
      { label: "Rubric", href: "/staff/setup/rubric", icon: <ListChecks className="w-4 h-4" /> },
      { label: "ผลประเมิน", href: "/staff/setup/eval-results", icon: <BarChart3 className="w-4 h-4" /> },
      { label: "รายงาน", href: "/staff/setup/progress", icon: <TrendingUp className="w-4 h-4" /> },
      { label: "Feedback", href: "/staff/feedback", icon: <MessageSquareMore className="w-4 h-4" /> },
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

  const isStudent = currentUser?.role === "student";
  const navSections = isStudent ? studentNavSections : staffNavSections;

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
            <p className="font-medium text-sm truncate leading-none">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{roleLabel()}</p>
          </div>
        )}

        {/* Group switcher (students only) */}
        {isStudent && (
          <div className="border-b border-border shrink-0">
            <GroupSwitcher />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si} className={cn(si > 0 && "mt-1")}>
              {section.title && (
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
                  {section.title}
                </p>
              )}
              <div className="px-2 space-y-0.5">
                {section.items.map((item) => (
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
          ))}
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
