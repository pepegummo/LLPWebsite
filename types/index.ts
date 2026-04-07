export type TaskStatus = "todo" | "in_progress" | "done";
export type TeamRole = "team_leader" | "assistant_leader" | "member";

export interface User {
  id: string;
  name: string;
  email?: string;
  activeTeamId?: string | null;
}

export interface TeamMember {
  userId: string;
  role: TeamRole;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  projectId: string;
  workspaceId: string;
  name: string;
  members: TeamMember[];
  invitedIds: string[];
  createdAt: string;
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
  teamId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assigneeIds: string[];
  attachments: Attachment[];
  dueDate: string | null;
  createdAt: string;
  manHours: number | null;
  subTasks: SubTask[];
  tags?: string[];
}

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  teamId: string;
  userId: string;
  action: string;
  timestamp: string;
}

export interface StandaloneLink {
  id: string;
  teamId: string;
  label: string;
  url: string;
  createdAt: string;
  createdBy: string;
  tags?: string[];
}

export interface Tag {
  id: string;
  teamId: string;
  name: string;
  color: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export type TicketType = "question" | "request" | "feedback" | "issue";
export type TicketStatus = "open" | "in_progress" | "resolved";

export interface Ticket {
  id: string;
  teamId: string;
  studentId: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
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
  teamId: string;
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
  teamId: string;
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
  teamId: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  teamId: string;
  senderId: string;
  content: string;
  createdAt: string;
  mentions: string[];
}

export type ContactType = "Email" | "Facebook" | "IG" | "Line" | "Discord" | "Phone";

export interface Contact {
  type: ContactType;
  value: string;
}

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  bio?: string;
  contacts: Contact[];
  displayNames: Record<string, string>; // teamId -> displayName
}

// ─── Template Library ────────────────────────────────────────────────────────

export type TemplateCategory = "project" | "rubric" | "task_structure" | "peer_evaluation";

export interface ProjectTemplate {
  name: string;
  description: string;
  defaultTaskTitles: string[];
}

export interface RubricTemplate {
  weights: RubricWeights;
}

export interface TaskStructureTemplate {
  title: string;
  description?: string;
  subTasks: { title: string; manHours?: number }[];
  manHours?: number;
  tags?: string[];
}

export interface PeerEvaluationTemplate {
  criteriaLabels: { key: keyof RubricWeights; customLabel: string }[];
  notes?: string;
}

export interface Template {
  id: string;
  category: TemplateCategory;
  name: string;
  description?: string;
  createdBy: string; // userId
  createdAt: string;
  data: ProjectTemplate | RubricTemplate | TaskStructureTemplate | PeerEvaluationTemplate;
}
