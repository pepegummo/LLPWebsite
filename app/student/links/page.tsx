"use client";

import { useState } from "react";
import { useAuthStore, useTaskStore, useGroupStore, useLinkStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, PlusCircle, Trash2, Link2, KanbanSquare } from "lucide-react";
import { toast } from "sonner";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export default function StudentLinksPage() {
  const { currentUser } = useAuthStore();
  const { tasks } = useTaskStore();
  const { groups } = useGroupStore();
  const { links, addLink, removeLink } = useLinkStore();

  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  if (!currentUser) return null;

  const activeGroupId = currentUser.activeGroupId;
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  // Links from tasks
  const groupTasks = tasks.filter((t) => t.groupId === activeGroupId);
  const taskLinks = groupTasks.flatMap((task) =>
    task.attachments.map((att) => ({
      id: `task-${att.id}`,
      label: att.label,
      url: att.url,
      taskTitle: task.title,
      isFromTask: true,
    }))
  );

  // Standalone links for this group
  const standaloneLinks = links
    .filter((l) => l.groupId === activeGroupId)
    .map((l) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      taskTitle: null,
      isFromTask: false,
      createdBy: l.createdBy,
      createdAt: l.createdAt,
    }));

  const allLinks = [...taskLinks, ...standaloneLinks];

  const handleAddLink = () => {
    if (!newLabel.trim() || !newUrl.trim()) {
      toast.error("กรุณากรอกชื่อและ URL");
      return;
    }
    if (!activeGroupId) {
      toast.error("กรุณาเลือกกลุ่มก่อน");
      return;
    }
    addLink({
      id: generateId(),
      groupId: activeGroupId,
      label: newLabel.trim(),
      url: normalizeUrl(newUrl.trim()),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
    });
    setNewLabel("");
    setNewUrl("");
    toast.success("เพิ่มลิงก์แล้ว");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="w-6 h-6" />
          ลิงก์
        </h1>
        {activeGroup && (
          <p className="text-muted-foreground">กลุ่ม: {activeGroup.name}</p>
        )}
      </div>

      {!activeGroupId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            กรุณาเลือกกลุ่มก่อน
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Add new link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">เพิ่มลิงก์ใหม่</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="link-label" className="text-xs">
                    ชื่อลิงก์
                  </Label>
                  <Input
                    id="link-label"
                    placeholder="ชื่อลิงก์..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="link-url" className="text-xs">
                    URL
                  </Label>
                  <Input
                    id="link-url"
                    placeholder="เช่น google.com หรือ https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLink();
                      }
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddLink} size="sm">
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    เพิ่ม
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                ลิงก์ทั้งหมด ({allLinks.length})
              </h2>
            </div>

            {allLinks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มีลิงก์</p>
                  <p className="text-xs mt-1">
                    เพิ่มลิงก์ใหม่หรือแนบลิงก์ในงานเพื่อแสดงที่นี่
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allLinks.map((link) => (
                  <Card key={link.id} className="group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <ExternalLink className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={normalizeUrl(link.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sm hover:underline text-primary line-clamp-1"
                          >
                            {link.label}
                          </a>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {normalizeUrl(link.url)}
                          </p>
                          {link.isFromTask && link.taskTitle && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <KanbanSquare className="w-3 h-3 text-muted-foreground" />
                              <Badge variant="outline" className="text-xs h-5">
                                {link.taskTitle}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {!link.isFromTask && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              removeLink(link.id);
                              toast.success("ลบลิงก์แล้ว");
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
