"use client";

import { useEffect, useState } from "react";
import { useAuthStore, useTaskStore, useTeamStore, useLinkStore, useTagStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, PlusCircle, Trash2, Link2, KanbanSquare, Tag, X } from "lucide-react";
import { toast } from "sonner";

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export default function StudentLinksPage() {
  const { currentUser } = useAuthStore();
  const { tasks } = useTaskStore();
  const { teams } = useTeamStore();
  const { links, fetchLinks, addLink, removeLink } = useLinkStore();
  const { fetchTags, addTag, removeTag, getTagsByTeam, getNextColor } = useTagStore();

  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);

  const activeTeamId = currentUser?.activeTeamId ?? null;

  useEffect(() => {
    if (!activeTeamId) return;
    fetchLinks(activeTeamId).catch(() => {});
    fetchTags(activeTeamId).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeamId]);

  if (!currentUser) return null;
  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const teamTags = activeTeamId ? getTagsByTeam(activeTeamId) : [];

  // Links from tasks
  const teamTasks = tasks.filter((t) => t.teamId === activeTeamId);
  const taskLinks = teamTasks.flatMap((task) =>
    task.attachments.map((att) => ({
      id: `task-${att.id}`,
      label: att.label,
      url: att.url,
      taskTitle: task.title,
      isFromTask: true,
      tags: task.tags ?? [],
    }))
  );

  // Standalone links for this team
  const standaloneLinks = links
    .filter((l) => l.teamId === activeTeamId)
    .map((l) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      taskTitle: null,
      isFromTask: false,
      createdBy: l.createdBy,
      createdAt: l.createdAt,
      tags: l.tags ?? [],
    }));

  const allLinks = [...taskLinks, ...standaloneLinks];

  const filteredLinks = filterTagId
    ? allLinks.filter((l) => l.tags.includes(filterTagId))
    : allLinks;

  const toggleLinkTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleAddLink = () => {
    if (!newLabel.trim() || !newUrl.trim()) {
      toast.error("กรุณากรอกชื่อและ URL");
      return;
    }
    if (!activeTeamId) {
      toast.error("กรุณาเลือกทีมก่อน");
      return;
    }
    addLink({
      teamId: activeTeamId,
      label: newLabel.trim(),
      url: normalizeUrl(newUrl.trim()),
      createdBy: currentUser.id,
      tags: selectedTagIds,
    }).then(() => {
      setNewLabel("");
      setNewUrl("");
      setSelectedTagIds([]);
      toast.success("เพิ่มลิงก์แล้ว");
    }).catch(() => {
      toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่");
    });
  };

  const handleAddTag = () => {
    if (!newTagName.trim() || !activeTeamId) return;
    const exists = teamTags.some(
      (t) => t.name.toLowerCase() === newTagName.trim().toLowerCase()
    );
    if (exists) {
      toast.error("มี tag นี้แล้ว");
      return;
    }
    addTag(activeTeamId, newTagName.trim(), getNextColor(activeTeamId));
    setNewTagName("");
    toast.success("เพิ่ม tag แล้ว");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Link2 className="w-6 h-6" />
            ลิงก์
          </h1>
          {activeTeam && (
            <p className="text-muted-foreground">ทีม: {activeTeam.name}</p>
          )}
        </div>
        {activeTeamId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTagManager((v) => !v)}
          >
            <Tag className="w-3.5 h-3.5 mr-1.5" />
            จัดการ Tag
          </Button>
        )}
      </div>

      {!activeTeamId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            กรุณาเลือกทีมก่อน
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tag Manager */}
          {showTagManager && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  จัดการ Tag
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="ชื่อ tag ใหม่..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleAddTag(); }
                    }}
                    className="max-w-xs"
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    <PlusCircle className="w-4 h-4 mr-1.5" />
                    เพิ่ม
                  </Button>
                </div>
                {teamTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {teamTags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-1 rounded-full px-3 py-1 text-xs text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                        <button
                          onClick={() => { removeTag(tag.id); toast.success("ลบ tag แล้ว"); }}
                          className="ml-1 hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add new link */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">เพิ่มลิงก์ใหม่</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="link-label" className="text-xs">ชื่อลิงก์</Label>
                  <Input
                    id="link-label"
                    placeholder="ชื่อลิงก์..."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="link-url" className="text-xs">URL</Label>
                  <Input
                    id="link-url"
                    placeholder="เช่น google.com หรือ https://..."
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); handleAddLink(); }
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
              {teamTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">เลือก Tag:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {teamTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleLinkTag(tag.id)}
                        className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-opacity"
                        style={{
                          backgroundColor: tag.color,
                          color: "white",
                          opacity: selectedTagIds.includes(tag.id) ? 1 : 0.4,
                        }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filter by tag */}
          {teamTags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Filter:</span>
              <Button variant={filterTagId === null ? "default" : "outline"} size="sm" onClick={() => setFilterTagId(null)}>
                ทั้งหมด
              </Button>
              {teamTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setFilterTagId(filterTagId === tag.id ? null : tag.id)}
                  className="rounded-full px-3 py-1 text-xs text-white transition-opacity"
                  style={{
                    backgroundColor: tag.color,
                    opacity: filterTagId === tag.id || filterTagId === null ? 1 : 0.5,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Links list */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">ลิงก์ทั้งหมด ({filteredLinks.length})</h2>

            {filteredLinks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>ยังไม่มีลิงก์</p>
                  <p className="text-xs mt-1">เพิ่มลิงก์ใหม่หรือแนบลิงก์ในงานเพื่อแสดงที่นี่</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredLinks.map((link) => {
                  const linkTags = teamTags.filter((t) => link.tags.includes(t.id));
                  return (
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
                                <Badge variant="outline" className="text-xs h-5">{link.taskTitle}</Badge>
                              </div>
                            )}
                            {linkTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {linkTags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="rounded-full px-2 py-0.5 text-[10px] text-white"
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {!link.isFromTask && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => { removeLink(link.id); toast.success("ลบลิงก์แล้ว"); }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
