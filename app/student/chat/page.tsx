"use client";

import { useState, useRef, useEffect } from "react";
import {
  useAuthStore,
  useGroupStore,
  useChatStore,
  useNotificationStore,
} from "@/store";
import { mockUsers } from "@/lib/mockData";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Hash,
  PlusCircle,
  Trash2,
  Pencil,
  Send,
  MessageCircle,
  Check,
  X,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  let hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yy} ${hours}:${mins} ${ampm}`;
}

function renderContent(content: string) {
  const parts = content.split(/(@\S+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-semibold bg-white/20 rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function renderContentOther(content: string) {
  const parts = content.split(/(@\S+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="text-primary font-semibold bg-primary/10 rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
}

export default function StudentChatPage() {
  const { currentUser } = useAuthStore();
  const { groups } = useGroupStore();
  const {
    addChannel,
    deleteChannel,
    renameChannel,
    sendMessage,
    deleteMessage,
    getChannelsByGroup,
    getMessagesByChannel,
  } = useChatStore();
  const { addNotification } = useNotificationStore();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionAtIndex, setMentionAtIndex] = useState(-1);
  const [newChannelName, setNewChannelName] = useState("");
  const [addingChannel, setAddingChannel] = useState(false);
  const [renamingChannelId, setRenamingChannelId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  if (!currentUser) return null;

  const activeGroupId = currentUser.activeGroupId;
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const groupMembers: User[] = activeGroup
    ? mockUsers.filter((u) => activeGroup.memberIds.includes(u.id))
    : [];

  const groupChannels = activeGroupId ? getChannelsByGroup(activeGroupId) : [];
  const channelMessages = selectedChannelId
    ? getMessagesByChannel(selectedChannelId)
    : [];

  useEffect(() => {
    if (!activeGroupId || !currentUser) return;
    const existing = getChannelsByGroup(activeGroupId);
    if (existing.length === 0) {
      addChannel({
        id: generateId(),
        groupId: activeGroupId,
        name: "general",
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      });
    }
  }, [activeGroupId]);

  useEffect(() => {
    if (!selectedChannelId && groupChannels.length > 0) {
      setSelectedChannelId(groupChannels[0].id);
    }
  }, [groupChannels.length, selectedChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [channelMessages.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([^\s@]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionAtIndex(cursorPos - match[0].length);
    } else {
      setMentionQuery(null);
      setMentionAtIndex(-1);
    }
  };

  const handleSelectMention = (member: User) => {
    if (mentionAtIndex < 0 || mentionQuery === null) return;
    const beforeAt = input.slice(0, mentionAtIndex);
    const afterMention = input.slice(mentionAtIndex + 1 + mentionQuery.length);
    setInput(`${beforeAt}@${member.name} ${afterMention}`);
    setMentionQuery(null);
    setMentionAtIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const mentionSuggestions =
    mentionQuery !== null
      ? groupMembers.filter(
          (m) =>
            m.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
            m.name.includes(mentionQuery)
        )
      : [];

  const handleSend = () => {
    if (!input.trim() || !selectedChannelId || !activeGroupId) return;

    const mentionedIds = groupMembers
      .filter((m) => input.includes(`@${m.name}`))
      .map((m) => m.id)
      .filter((id) => id !== currentUser.id);

    const msgId = generateId();
    sendMessage({
      id: msgId,
      channelId: selectedChannelId,
      groupId: activeGroupId,
      senderId: currentUser.id,
      content: input.trim(),
      createdAt: new Date().toISOString(),
      mentions: mentionedIds,
    });

    const selectedChannel = groupChannels.find((c) => c.id === selectedChannelId);
    mentionedIds.forEach((userId) => {
      addNotification({
        id: generateId(),
        userId,
        type: "mention",
        message: `${currentUser.name} กล่าวถึงคุณใน #${selectedChannel?.name ?? "chat"}: ${input.trim().slice(0, 60)}${input.trim().length > 60 ? "…" : ""}`,
        read: false,
        createdAt: new Date().toISOString(),
        meta: { channelId: selectedChannelId, groupId: activeGroupId },
      });
    });

    setInput("");
    setMentionQuery(null);
  };

  const handleAddChannel = () => {
    if (!newChannelName.trim() || !activeGroupId) return;
    const id = generateId();
    addChannel({
      id,
      groupId: activeGroupId,
      name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    });
    setSelectedChannelId(id);
    setNewChannelName("");
    setAddingChannel(false);
    toast.success("สร้างช่องแชทแล้ว");
  };

  const handleRenameConfirm = () => {
    if (!renamingChannelId || !renameValue.trim()) return;
    renameChannel(
      renamingChannelId,
      renameValue.trim().toLowerCase().replace(/\s+/g, "-")
    );
    setRenamingChannelId(null);
    setRenameValue("");
    toast.success("เปลี่ยนชื่อช่องแชทแล้ว");
  };

  const handleDeleteConfirm = () => {
    if (!deletingChannelId) return;
    if (selectedChannelId === deletingChannelId) setSelectedChannelId(null);
    deleteChannel(deletingChannelId);
    setDeletingChannelId(null);
    toast.success("ลบช่องแชทแล้ว");
  };

  const selectedChannel = groupChannels.find((c) => c.id === selectedChannelId);

  // Group consecutive messages by same sender
  type MsgGroup = { senderId: string; messages: typeof channelMessages };
  const messageGroups: MsgGroup[] = [];
  for (const msg of channelMessages) {
    const last = messageGroups[messageGroups.length - 1];
    if (last && last.senderId === msg.senderId) {
      last.messages.push(msg);
    } else {
      messageGroups.push({ senderId: msg.senderId, messages: [msg] });
    }
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          Group Chat
        </h1>
        {activeGroup && (
          <p className="text-muted-foreground text-sm">กลุ่ม: {activeGroup.name}</p>
        )}
      </div>

      {/* Chat container — subtract topbar (3.5rem) + page header (~4rem) + padding (2rem) */}
      <div className="flex h-[calc(100svh-12rem)] rounded-xl border border-border overflow-hidden bg-card shadow-sm">

        {/* ── Channel sidebar ── */}
        <aside className="w-44 sm:w-52 shrink-0 flex flex-col border-r border-border bg-muted/20">
          {/* Sidebar header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {activeGroup?.name ?? "—"}
            </p>
          </div>

          {/* Channel list */}
          <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
            {groupChannels.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setSelectedChannelId(ch.id)}
                className={cn(
                  "group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 cursor-pointer text-sm select-none",
                  selectedChannelId === ch.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {renamingChannelId === ch.id ? (
                  <div
                    className="flex items-center gap-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameConfirm();
                        if (e.key === "Escape") setRenamingChannelId(null);
                      }}
                      className="h-6 text-xs px-1 flex-1"
                      autoFocus
                    />
                    <button onClick={handleRenameConfirm} className="shrink-0">
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    </button>
                    <button onClick={() => setRenamingChannelId(null)} className="shrink-0">
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Hash className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="flex-1 truncate">{ch.name}</span>
                    <div
                      className="hidden group-hover:flex items-center gap-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={cn(
                          "p-0.5 rounded hover:bg-black/10",
                          selectedChannelId === ch.id && "hover:bg-white/20"
                        )}
                        onClick={() => {
                          setRenamingChannelId(ch.id);
                          setRenameValue(ch.name);
                        }}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        className={cn(
                          "p-0.5 rounded hover:bg-black/10",
                          selectedChannelId === ch.id && "hover:bg-white/20"
                        )}
                        onClick={() => setDeletingChannelId(ch.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add channel */}
          <div className="px-2 py-2.5 border-t border-border">
            {addingChannel ? (
              <div className="flex gap-1">
                <Input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddChannel();
                    if (e.key === "Escape") setAddingChannel(false);
                  }}
                  placeholder="ชื่อช่อง..."
                  className="h-7 text-xs px-2 flex-1"
                  autoFocus
                />
                <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleAddChannel}>
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => setAddingChannel(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setAddingChannel(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                เพิ่มช่อง
              </button>
            )}
          </div>
        </aside>

        {/* ── Message area ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {!selectedChannelId ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <MessageCircle className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-sm">เลือกช่องแชทเพื่อเริ่มสนทนา</p>
              </div>
            </div>
          ) : (
            <>
              {/* Channel header */}
              <div className="px-5 py-3 border-b border-border flex items-center gap-2 shrink-0 bg-card/50">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">{selectedChannel?.name}</span>
                <span className="text-xs text-muted-foreground ml-1">
                  · {channelMessages.length} ข้อความ
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {channelMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                    <Hash className="w-10 h-10 opacity-20" />
                    <div className="text-center">
                      <p className="text-sm font-medium">ยังไม่มีข้อความ</p>
                      <p className="text-xs opacity-70">เริ่มสนทนาใน #{selectedChannel?.name}</p>
                    </div>
                  </div>
                ) : (
                  messageGroups.map((group, gi) => {
                    const isMe = group.senderId === currentUser.id;
                    const sender = mockUsers.find((u) => u.id === group.senderId);
                    return (
                      <div
                        key={gi}
                        className={cn("flex flex-col gap-1", isMe && "items-end")}
                      >
                        {/* Sender name + timestamp (first message of group) */}
                        <div
                          className={cn(
                            "flex items-baseline gap-2 px-1",
                            isMe && "flex-row-reverse"
                          )}
                        >
                          <span className="text-xs font-semibold text-foreground">
                            {isMe ? "คุณ" : sender?.name ?? "?"}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {formatTime(group.messages[0].createdAt)}
                          </span>
                        </div>

                        {/* Bubble stack */}
                        {group.messages.map((msg, mi) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex items-end gap-1.5",
                              isMe && "flex-row-reverse"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[72%] px-3.5 py-2 text-sm break-words leading-relaxed",
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                                  : "bg-muted rounded-2xl rounded-bl-md",
                                // soften corners for consecutive bubbles
                                mi > 0 && isMe && "rounded-tr-md",
                                mi > 0 && !isMe && "rounded-tl-md"
                              )}
                            >
                              {isMe
                                ? renderContent(msg.content)
                                : renderContentOther(msg.content)}
                            </div>

                            {/* Delete button (own messages only) */}
                            {isMe && (
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="opacity-0 hover:opacity-100 group-hover:opacity-100 p-1 rounded-full hover:bg-muted transition-opacity self-center shrink-0"
                                title="ลบ"
                              >
                                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="px-5 py-3.5 border-t border-border shrink-0 bg-card/30">
                <div className="relative">
                  {/* Mention dropdown */}
                  {mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 min-w-52">
                      <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border">
                        สมาชิก
                      </div>
                      {mentionSuggestions.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectMention(m);
                          }}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm w-full text-left hover:bg-muted transition-colors"
                        >
                          <AtSign className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !e.shiftKey &&
                          mentionSuggestions.length === 0
                        ) {
                          e.preventDefault();
                          handleSend();
                        }
                        if (e.key === "Escape") setMentionQuery(null);
                      }}
                      placeholder={`พิมพ์ข้อความ... ใช้ @ เพื่อ mention`}
                      className="flex-1 rounded-xl bg-muted/50 border-muted-foreground/20 focus-visible:ring-1"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      size="icon"
                      className="rounded-xl shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete channel confirmation */}
      <AlertDialog
        open={!!deletingChannelId}
        onOpenChange={(open) => !open && setDeletingChannelId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบช่องแชท</AlertDialogTitle>
            <AlertDialogDescription>
              การลบจะลบข้อความทั้งหมดในช่องนี้ด้วย ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
