import { TeamRole, TaskStatus, WorkspaceRole } from "@/types";

// Role badge colors — ใช้ร่วมกันทุกที่ที่แสดง role ของ member
export const ROLE_COLORS: Record<TeamRole, string> = {
  team_leader: "bg-amber-100 text-amber-700",
  assistant_leader: "bg-blue-100 text-blue-700",
  member: "bg-slate-100 text-slate-600",
};

export const ROLE_LABELS: Record<TeamRole, string> = {
  team_leader: "Team Leader",
  assistant_leader: "Assistant Leader",
  member: "Member",
};

// Task status badge colors — ใช้ร่วมกันทุกที่ที่แสดง status ของ task
// หมายเหตุ: "overdue" ไม่ใช่ TaskStatus แต่เป็น computed state จาก dueDate → ใช้ OVERDUE_COLOR แยก
export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "รอดำเนินการ",
  in_progress: "กำลังดำเนินการ",
  done: "เสร็จสิ้น",
};

export const OVERDUE_COLOR = "bg-red-100 text-red-700";
export const OVERDUE_LABEL = "เกินกำหนด";

// Workspace role badge colors
export const WORKSPACE_ROLE_COLORS: Record<WorkspaceRole, string> = {
  owner: "bg-amber-100 text-amber-700",
  admin: "bg-violet-100 text-violet-700",
  member: "bg-slate-100 text-slate-600",
};

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Workspace Owner",
  admin: "Workspace Admin",
  member: "Member",
};

// Kanban column background colors
export const COLUMN_COLORS: Record<TaskStatus, string> = {
  todo: "bg-slate-100",
  in_progress: "bg-blue-50",
  done: "bg-green-50",
};
