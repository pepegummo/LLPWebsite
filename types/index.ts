export type Role = "student" | "ta" | "professor";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface User {
  id: string;
  name: string;
  role: Role;
  groupIds: string[];
  activeGroupId: string | null;
}

export interface Course {
  id: string;
  name: string;
  professorId: string;
  taIds: string[];
}

export interface Group {
  id: string;
  courseId: string;
  name: string;
  memberIds: string[];
  invitedIds: string[];
}

export interface Attachment {
  id: string;
  label: string;
  url: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeIds: string[];
  attachments: Attachment[];
  dueDate: string | null;
  createdAt: string;
  manHours: number | null;
  subTasks: SubTask[];
}

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  groupId: string;
  userId: string;
  action: string;
  timestamp: string;
}

export interface StandaloneLink {
  id: string;
  groupId: string;
  label: string;
  url: string;
  createdAt: string;
  createdBy: string;
}

export interface Evaluation {
  id: string;
  groupId: string;
  evaluatorId: string;
  evaluateeId: string;
  score: 1 | 2 | 3 | 4 | 5;
  comment: string;
  submittedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "invitation" | "task_assigned" | "eval_reminder" | "invite_response";
  message: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, string>;
}
