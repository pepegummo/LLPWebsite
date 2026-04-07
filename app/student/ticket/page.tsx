"use client";

import { useState } from "react";
import { useAuthStore, useGroupStore, useTicketStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { TicketType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket, Send, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

const TICKET_TYPE_LABELS: Record<TicketType, string> = {
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

export default function StudentTicketPage() {
  const { currentUser } = useAuthStore();
  const { groups } = useGroupStore();
  const { tickets, addTicket, addMessage } = useTicketStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TicketType>("question");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  if (!currentUser) return null;

  const activeGroupId = currentUser.activeGroupId;
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  const myTickets = tickets
    .filter((t) => t.studentId === currentUser.id)
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) {
      toast.error("กรุณากรอกหัวข้อและรายละเอียด");
      return;
    }
    if (!activeGroupId) {
      toast.error("กรุณาเลือกกลุ่มก่อน");
      return;
    }
    const now = new Date().toISOString();
    addTicket({
      id: generateId(),
      groupId: activeGroupId,
      studentId: currentUser.id,
      title: title.trim(),
      description: description.trim(),
      type,
      status: "open",
      createdAt: now,
      updatedAt: now,
      messages: [],
    });
    setTitle("");
    setDescription("");
    setType("question");
    toast.success("ส่ง Ticket แล้ว");
  };

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

  const getUserName = (userId: string) =>
    mockUsers.find((u) => u.id === userId)?.name ?? userId;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="w-6 h-6" />
          เปิด Ticket
        </h1>
        <p className="text-muted-foreground">
          ส่งคำถาม คำร้อง หรือ feedback ไปยังอาจารย์/TA
        </p>
      </div>

      {!activeGroupId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            กรุณาเลือกกลุ่มก่อน
          </CardContent>
        </Card>
      ) : (
        <>
          {/* New ticket form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">สร้าง Ticket ใหม่</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ticket-title">หัวข้อ *</Label>
                  <Input
                    id="ticket-title"
                    placeholder="หัวข้อ..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>ประเภท</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as TicketType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(TICKET_TYPE_LABELS) as [TicketType, string][]).map(
                        ([val, label]) => (
                          <SelectItem key={val} value={val}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="ticket-desc">รายละเอียด *</Label>
                <Textarea
                  id="ticket-desc"
                  placeholder="อธิบายรายละเอียด..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSubmit}>
                  <Send className="w-4 h-4 mr-2" />
                  ส่ง Ticket
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My tickets */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              Ticket ของฉัน ({myTickets.length})
            </h2>
            {myTickets.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มี Ticket</p>
                </CardContent>
              </Card>
            ) : (
              myTickets.map((ticket) => {
                const isExpanded = expandedId === ticket.id;
                return (
                  <Card
                    key={ticket.id}
                    className={cn(
                      ticket.status === "open" && "border-primary/30"
                    )}
                  >
                    <CardContent className="p-4">
                      {/* Header row */}
                      <button
                        type="button"
                        className="w-full flex items-start gap-3 text-left"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : ticket.id)
                        }
                      >
                        <div className="flex-1 min-w-0">
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
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ticket.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(ticket.createdAt)}
                            {ticket.messages.length > 0 && (
                              <span className="ml-2">
                                · {ticket.messages.length} ข้อความ
                              </span>
                            )}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="mt-4 space-y-3 border-t border-border pt-3">
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

                          {/* Reply box */}
                          {ticket.status !== "resolved" && (
                            <div className="flex gap-2">
                              <Input
                                placeholder="พิมพ์ข้อความ..."
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
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
