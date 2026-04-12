/**
 * Map raw snake_case Supabase rows → camelCase frontend types.
 * All fields from the backend are snake_case; the frontend types use camelCase.
 */

import type {
  Workspace, Project, Team, Task, SubTask, Attachment,
  Evaluation, Meeting, MeetingNotificationSetting,
  Notification, ChatChannel, ChatMessage,
  Ticket, TicketMessage, StandaloneLink, Tag,
  RubricWeights, UserProfile, TeamMember,
} from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

export function mapWorkspace(r: Raw): Workspace {
  return {
    id: r.id,
    name: r.name,
    ownerId: r.owner_id,
    adminIds: (r.workspace_admins ?? []).map((a: Raw) => a.user_id),
    createdAt: r.created_at,
  };
}

export function mapProject(r: Raw): Project {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    name: r.name,
    description: r.description,
    createdAt: r.created_at,
  };
}

export function mapTeam(r: Raw): Team {
  return {
    id: r.id,
    projectId: r.project_id,
    workspaceId: r.workspace_id,
    name: r.name,
    members: (r.team_members ?? []).map(
      (m: Raw): TeamMember => ({ userId: m.user_id, role: m.role })
    ),
    invitedIds: (r.team_invitations ?? []).map((i: Raw) => i.user_id),
    createdAt: r.created_at,
  };
}

export function mapTask(r: Raw): Task {
  return {
    id: r.id,
    teamId: r.team_id,
    title: r.title,
    description: r.description,
    status: r.status,
    assigneeIds: (r.task_assignees ?? []).map((a: Raw) => a.user_id),
    attachments: (r.task_attachments ?? []).map(
      (a: Raw): Attachment => ({ id: a.id, label: a.label, url: a.url })
    ),
    tags: (r.task_tags ?? []).map((t: Raw) => t.tag_id),
    startDate: r.start_date ?? null,
    dueDate: r.due_date ?? null,
    manHours: r.man_hours ?? null,
    createdAt: r.created_at,
    subTasks: (r.subtasks ?? []).map(
      (s: Raw): SubTask => ({
        id: s.id,
        title: s.title,
        completed: s.completed,
        manHours: s.man_hours ?? undefined,
        assigneeIds: (s.subtask_assignees ?? []).map((a: Raw) => a.user_id),
        startDate: s.start_date ?? null,
      })
    ),
  };
}

export function mapEvaluation(r: Raw): Evaluation {
  return {
    id: r.id,
    teamId: r.team_id,
    evaluatorId: r.evaluator_id,
    evaluateeId: r.evaluatee_id,
    score: r.score,
    criteriaScores:
      r.contribution != null
        ? {
            contribution: r.contribution,
            qualityOfWork: r.quality_of_work,
            responsibility: r.responsibility,
            communication: r.communication,
            teamwork: r.teamwork,
            effort: r.effort,
          }
        : undefined,
    comment: r.comment ?? "",
    submittedAt: r.submitted_at,
  };
}

export function mapMeeting(r: Raw): Meeting {
  return {
    id: r.id,
    teamId: r.team_id,
    topic: r.topic,
    description: r.description,
    attendeeIds: (r.meeting_attendees ?? []).map((a: Raw) => a.user_id),
    link: r.link,
    datetime: r.datetime,
    notificationSettings: (r.meeting_notifications ?? []).map(
      (n: Raw): MeetingNotificationSetting => ({
        id: n.id,
        minutesBefore: n.minutes_before,
        label: n.label,
      })
    ),
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

export function mapNotification(r: Raw): Notification {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type,
    message: r.message,
    read: r.read,
    createdAt: r.created_at,
    meta: r.meta,
  };
}

export function mapChannel(r: Raw): ChatChannel {
  return {
    id: r.id,
    teamId: r.team_id,
    name: r.name,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

export function mapMessage(r: Raw): ChatMessage {
  return {
    id: r.id,
    channelId: r.channel_id,
    teamId: r.team_id,
    senderId: r.sender_id,
    content: r.content,
    createdAt: r.created_at,
    mentions: r.mentions ?? [],
  };
}

export function mapTicket(r: Raw): Ticket {
  return {
    id: r.id,
    teamId: r.team_id,
    studentId: r.student_id,
    title: r.title,
    description: r.description,
    type: r.type,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    messages: (r.ticket_messages ?? []).map(
      (m: Raw): TicketMessage => ({
        id: m.id,
        ticketId: r.id,
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
      })
    ),
  };
}

export function mapLink(r: Raw): StandaloneLink {
  return {
    id: r.id,
    teamId: r.team_id,
    label: r.label,
    url: r.url,
    createdAt: r.created_at,
    createdBy: r.created_by,
    tags: (r.link_tags ?? []).map((t: Raw) => t.tag_id),
  };
}

export function mapTag(r: Raw): Tag {
  return { id: r.id, teamId: r.team_id, name: r.name, color: r.color };
}

export function mapRubric(r: Raw): RubricWeights {
  return {
    contribution: r.contribution,
    qualityOfWork: r.quality_of_work,
    responsibility: r.responsibility,
    communication: r.communication,
    teamwork: r.teamwork,
    effort: r.effort,
  };
}

export function mapProfile(r: Raw): UserProfile {
  return {
    userId: r.id,
    firstName: r.first_name ?? "",
    lastName: r.last_name ?? "",
    bio: r.bio,
    contacts: (r.contacts ?? []).map((c: Raw) => ({ type: c.type, value: c.value })),
    displayNames: {},
  };
}
