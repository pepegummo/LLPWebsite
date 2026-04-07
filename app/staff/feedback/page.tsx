"use client";

import { useState } from "react";
import { useAuthStore, useGroupStore, useTicketStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { TicketStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquareMore,
  Send,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

const TICKET_TYPE_LABELS: Record<string, string> = {
  question: "คำถาม",
  request: "คำร้อง",
  feedback: "ข้อเสนอแนะ",
  issue: "ปัญหา",
};

const STATUS_LABELS: Record<string, string> = {
  open: "เปิด",
  in_progress: "กำลังดำเนินการ",
  resolved: "แก้ไขแล้ว",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
};

export default function StaffFeedbackPage() {
  const { currentUser } = useAuthStore();
  const { groups } = useGroupStore();
  const { tickets, updateTicketStatus, addMessage } = useTicketStore();

  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  // Staff sees tickets for groups they manage
  const managedGroupIds = groups
    .filter(
      (g) =>
        mockUsers.find((u) => u.id === currentUser.id)?.groupIds.includes(g.id) ||
        currentUser.role === "professor"
    )
    .map((g) => g.id);

  const allTickets = tickets.filter((t) => managedGroupIds.includes(t.groupId));

  const filteredTickets = allTickets
    .filter((t) => (groupFilter ? t.groupId === groupFilter : true))
    .filter((t) => (statusFilter ? t.status === statusFilter : true))
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  const activeGroups = groups.filter((g) =>
    [...new Set(allTickets.map((t) => t.groupId))].includes(g.id)
  );

  const openCount = allTickets.filter((t) => t.status === "open").length;

  const handleSendReply = (ticketId: string) => {
    const content = replyContent[ticketId]?.trim();
    if (!content) return;
    addMessage(ticketId, {
      id: generateId(),
      ticketId,
      senderId: currentUser.id,
      content,
      createdAt: new Date().toISOString(),
    });
    setReplyContent((prev) => ({ ...prev, [ticketId]: "" }));
    toast.success("ส่งข้อความแล้ว");
  };

  const handleStatusChange = (ticketId: string, status: string) => {
    updateTicketStatus(ticketId, status as TicketStatus);
    toast.success(`อัปเดตสถานะเป็น "${STATUS_LABELS[status]}"`);
  };

  const getUserName = (userId: string) =>
    mockUsers.find((u) => u.id === userId)?.name ?? userId;

  const getGroupName = (groupId: string) =>
    groups.find((g) => g.id === groupId)?.name ?? groupId;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareMore className="w-6 h-6" />
          Feedback Center
          {openCount > 0 && (
            <Badge variant="destructive">{openCount} รายการใหม่</Badge>
          )}
        </h1>
        <p className="text-muted-foreground">
          Ticket / คำถาม / คำร้อง จากนักศึกษา
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Group filter */}
        {activeGroups.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <Button
              variant={groupFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupFilter(null)}
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              ทุกกลุ่ม
            </Button>
            {activeGroups.map((g) => (
              <Button
                key={g.id}
                variant={groupFilter === g.id ? "default" : "outline"}
                size="sm"
                onClick={() => setGroupFilter(g.id)}
              >
                {g.name}
              </Button>
            ))}
          </div>
        )}

        {/* Status filter */}
        <Select
          value={statusFilter ?? "all"}
          onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue placeholder="สถานะทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">สถานะทั้งหมด</SelectItem>
            <SelectItem value="open">เปิด</SelectItem>
            <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
            <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MessageSquareMore className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>ไม่มี Ticket</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            return (
              <Card
                key={ticket.id}
                className={cn(
                  ticket.status === "open" && "border-primary/30 bg-primary/5"
                )}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : ticket.id)
                      }
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {ticket.title}
                        </span>
                        <Badge
                          variant={STATUS_VARIANTS[ticket.status]}
                          className="text-xs"
                        >
                          {STATUS_LABELS[ticket.status]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {TICKET_TYPE_LABELS[ticket.type]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getUserName(ticket.studentId)} ·{" "}
                        {getGroupName(ticket.groupId)} ·{" "}
                        {formatDate(ticket.createdAt)}
                        {ticket.messages.length > 0 && (
                          <span className="ml-2">
                            · {ticket.messages.length} ข้อความ
                          </span>
                        )}
                      </p>
                    </button>

                    {/* Status changer */}
                    <Select
                      value={ticket.status}
                      onValueChange={(v) => v && handleStatusChange(ticket.id, v)}
                    >
                      <SelectTrigger className="w-40 h-7 text-xs shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">เปิด</SelectItem>
                        <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                        <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
                      </SelectContent>
                    </Select>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : ticket.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="mt-4 border-t border-border pt-3 space-y-3">
                      <p className="text-sm">{ticket.description}</p>

                      {/* Messages */}
                      {ticket.messages.length > 0 && (
                        <div className="space-y-2">
                          {ticket.messages.map((msg) => {
                            const isMe = msg.senderId === currentUser.id;
                            return (
                              <div
                                key={msg.id}
                                className={cn(
                                  "flex gap-2",
                                  isMe ? "flex-row-reverse" : "flex-row"
                                )}
                              >
                                <div
                                  className={cn(
                                    "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                                    isMe
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted"
                                  )}
                                >
                                  {!isMe && (
                                    <p className="text-xs font-medium mb-0.5 opacity-70">
                                      {getUserName(msg.senderId)}
                                    </p>
                                  )}
                                  <p>{msg.content}</p>
                                  <p
                                    className={cn(
                                      "text-[10px] mt-0.5",
                                      isMe
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {formatDate(msg.createdAt)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Reply */}
                      {ticket.status !== "resolved" && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="ตอบกลับ..."
                            value={replyContent[ticket.id] ?? ""}
                            onChange={(e) =>
                              setReplyContent((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply(ticket.id);
                              }
                            }}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSendReply(ticket.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
