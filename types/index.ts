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
  manHours?: number;
  assigneeIds?: string[];
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

export interface EvaluationCriteria {
  contribution: number;   // 1-5
  qualityOfWork: number;  // 1-5
  responsibility: number; // 1-5
  communication: number;  // 1-5
  teamwork: number;       // 1-5
  effort: number;         // 1-5
}

export interface Evaluation {
  id: string;
  groupId: string;
  evaluatorId: string;
  evaluateeId: string;
  score: 1 | 2 | 3 | 4 | 5;
  criteriaScores?: EvaluationCriteria;
  comment: string;
  submittedAt: string;
}

export interface RubricWeights {
  contribution: number;   // percentage, all sum to 100
  qualityOfWork: number;
  responsibility: number;
  communication: number;
  teamwork: number;
  effort: number;
}

export interface MeetingNotificationSetting {
  id: string;
  minutesBefore: number; // e.g. 1440 = 1 day, 180 = 3 hours
  label: string;
}

export interface Meeting {
  id: string;
  groupId: string;
  topic: string;
  description?: string;
  attendeeIds: string[];
  link?: string;
  datetime: string; // ISO string
  notificationSettings: MeetingNotificationSetting[];
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: "invitation" | "task_assigned" | "eval_reminder" | "invite_response" | "mention" | "meeting_reminder";
  message: string;
  read: boolean;
  createdAt: string;
  meta?: Record<string, string>;
}

export interface ChatChannel {
  id: string;
  groupId: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: string;
  mentions: string[];
}
