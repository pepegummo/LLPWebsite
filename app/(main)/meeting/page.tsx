"use client";

import { useState } from "react";
import {
  useAuthStore,
  useTeamStore,
  useMeetingStore,
  useNotificationStore,
} from "@/store";
import { Meeting, MeetingNotificationSetting } from "@/types";
import { mockUsers } from "@/lib/mockData";
import { useDisplayName } from "@/lib/useDisplayName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  PlusCircle,
  Trash2,
  Pencil,
  Video,
  Calendar,
  Users,
  Bell,
  ExternalLink,
  CheckSquare,
  Square,
} from "lucide-react";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

const PRESET_NOTIFICATIONS: { minutesBefore: number; label: string }[] = [
  { minutesBefore: 10080, label: "1 สัปดาห์ก่อน" },
  { minutesBefore: 1440, label: "1 วันก่อน" },
  { minutesBefore: 180, label: "3 ชั่วโมงก่อน" },
  { minutesBefore: 60, label: "1 ชั่วโมงก่อน" },
  { minutesBefore: 30, label: "30 นาทีก่อน" },
  { minutesBefore: 15, label: "15 นาทีก่อน" },
];

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

interface MeetingFormState {
  topic: string;
  description: string;
  attendeeIds: string[];
  link: string;
  datetime: string;
  notificationSettings: MeetingNotificationSetting[];
}

const EMPTY_FORM: MeetingFormState = {
  topic: "",
  description: "",
  attendeeIds: [],
  link: "",
  datetime: "",
  notificationSettings: [],
};

export default function StudentMeetingPage() {
  const { currentUser } = useAuthStore();
  const { teams } = useTeamStore();
  const resolveDisplayName = useDisplayName();
  const { meetings, addMeeting, updateMeeting, deleteMeeting } = useMeetingStore();
  const { addNotification } = useNotificationStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);
  const [form, setForm] = useState<MeetingFormState>(EMPTY_FORM);

  if (!currentUser) return null;

  const activeTeamId = currentUser.activeTeamId ?? null;
  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const memberIds = activeTeam ? activeTeam.members.map((m) => m.userId) : [];
  const members = mockUsers.filter((u) => memberIds.includes(u.id));

  const teamMeetings = meetings
    .filter((m) => m.teamId === activeTeamId)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  const upcomingMeetings = teamMeetings.filter((m) => new Date(m.datetime) >= new Date());
  const pastMeetings = teamMeetings.filter((m) => new Date(m.datetime) < new Date());

  const openCreate = () => {
    setEditingMeeting(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    const localDatetime = new Date(meeting.datetime).toISOString().slice(0, 16);
    setForm({
      topic: meeting.topic,
      description: meeting.description ?? "",
      attendeeIds: meeting.attendeeIds,
      link: meeting.link ?? "",
      datetime: localDatetime,
      notificationSettings: meeting.notificationSettings,
    });
    setFormOpen(true);
  };

  const toggleAttendee = (userId: string) => {
    setForm((prev) => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(userId)
        ? prev.attendeeIds.filter((id) => id !== userId)
        : [...prev.attendeeIds, userId],
    }));
  };

  const toggleNotification = (preset: { minutesBefore: number; label: string }) => {
    setForm((prev) => {
      const exists = prev.notificationSettings.some((n) => n.minutesBefore === preset.minutesBefore);
      if (exists) {
        return { ...prev, notificationSettings: prev.notificationSettings.filter((n) => n.minutesBefore !== preset.minutesBefore) };
      } else {
        return { ...prev, notificationSettings: [...prev.notificationSettings, { id: generateId(), minutesBefore: preset.minutesBefore, label: preset.label }] };
      }
    });
  };

  const handleSave = () => {
    if (!form.topic.trim()) { toast.error("กรุณากรอกหัวข้อการประชุม"); return; }
    if (!form.datetime) { toast.error("กรุณาเลือกวันและเวลาการประชุม"); return; }
    if (!activeTeamId) return;

    if (editingMeeting) {
      const updated: Meeting = {
        ...editingMeeting,
        topic: form.topic.trim(),
        description: form.description.trim() || undefined,
        attendeeIds: form.attendeeIds,
        link: form.link.trim() ? normalizeUrl(form.link.trim()) : undefined,
        datetime: new Date(form.datetime).toISOString(),
        notificationSettings: form.notificationSettings,
      };
      updateMeeting(updated.id, updated as unknown as Record<string, unknown>);
      toast.success("แก้ไขการประชุมแล้ว");
    } else {
      const meeting: Meeting = {
        id: generateId(),
        teamId: activeTeamId,
        topic: form.topic.trim(),
        description: form.description.trim() || undefined,
        attendeeIds: form.attendeeIds,
        link: form.link.trim() ? normalizeUrl(form.link.trim()) : undefined,
        datetime: new Date(form.datetime).toISOString(),
        notificationSettings: form.notificationSettings,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      addMeeting(meeting as unknown as Record<string, unknown>);

      form.attendeeIds.forEach((userId) => {
        if (userId === currentUser.id) return;
        addNotification({
          id: generateId(),
          userId,
          type: "meeting_reminder",
          message: `คุณถูกเพิ่มเข้าการประชุม: ${form.topic.trim()}`,
          read: false,
          createdAt: new Date().toISOString(),
          meta: { teamId: activeTeamId, meetingId: meeting.id },
        });
      });

      toast.success("สร้างการประชุมแล้ว");
    }

    setFormOpen(false);
    setEditingMeeting(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (meeting: Meeting) => {
    deleteMeeting(meeting.id);
    toast.success("ลบการประชุมแล้ว");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="w-6 h-6" />
            การประชุม
          </h1>
          {activeTeam && (
            <p className="text-muted-foreground">ทีม: {activeTeam.name}</p>
          )}
        </div>
        {activeTeam && (
          <Button size="sm" onClick={openCreate}>
            <PlusCircle className="w-4 h-4 mr-2" />
            สร้างการประชุม
          </Button>
        )}
      </div>

      {!activeTeam ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            กรุณาเลือกทีมก่อน
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="font-semibold">การประชุมที่กำลังจะมาถึง ({upcomingMeetings.length})</h2>
            {upcomingMeetings.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">ไม่มีการประชุมที่กำลังจะมาถึง</CardContent></Card>
            ) : (
              upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} onEdit={openEdit} onDelete={(m) => setDeleteTarget(m)} />
              ))
            )}
          </div>

          {pastMeetings.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-muted-foreground">การประชุมที่ผ่านมา ({pastMeetings.length})</h2>
              {pastMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} onEdit={openEdit} onDelete={(m) => setDeleteTarget(m)} past />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={formOpen} onOpenChange={(v) => { if (!v) { setFormOpen(false); setForm(EMPTY_FORM); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? "แก้ไขการประชุม" : "สร้างการประชุมใหม่"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>หัวข้อการประชุม *</Label>
              <Input value={form.topic} onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))} placeholder="หัวข้อ..." />
            </div>
            <div className="space-y-1">
              <Label>รายละเอียด</Label>
              <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="รายละเอียดการประชุม..." rows={2} />
            </div>
            <div className="space-y-1">
              <Label>วันและเวลา *</Label>
              <Input type="datetime-local" value={form.datetime} onChange={(e) => setForm((p) => ({ ...p, datetime: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>ลิงก์การประชุม</Label>
              <Input value={form.link} onChange={(e) => setForm((p) => ({ ...p, link: e.target.value }))} placeholder="เช่น meet.google.com/abc หรือ zoom.us/j/..." />
            </div>
            <div className="space-y-2">
              <Label>ผู้เข้าร่วม</Label>
              <div className="grid grid-cols-1 gap-1">
                {members.map((m) => {
                  const checked = form.attendeeIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAttendee(m.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${checked ? "bg-primary/10 border border-primary/30" : "hover:bg-muted border border-transparent"}`}
                    >
                      {checked ? <CheckSquare className="w-4 h-4 text-primary shrink-0" /> : <Square className="w-4 h-4 text-muted-foreground shrink-0" />}
                      <span>{resolveDisplayName(m.id, m.name, activeTeamId ?? "")}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" />
                การแจ้งเตือน
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_NOTIFICATIONS.map((preset) => {
                  const active = form.notificationSettings.some((n) => n.minutesBefore === preset.minutesBefore);
                  return (
                    <button
                      key={preset.minutesBefore}
                      type="button"
                      onClick={() => toggleNotification(preset)}
                      className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              {form.notificationSettings.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  จะส่งแจ้งเตือน: {form.notificationSettings.sort((a, b) => b.minutesBefore - a.minutesBefore).map((n) => n.label).join(", ")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); setForm(EMPTY_FORM); }}>ยกเลิก</Button>
            <Button onClick={handleSave}>{editingMeeting ? "บันทึก" : "สร้าง"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการลบการประชุม &quot;{deleteTarget?.topic}&quot; หรือไม่?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  past = false,
}: {
  meeting: Meeting;
  onEdit: (m: Meeting) => void;
  onDelete: (m: Meeting) => void;
  past?: boolean;
}) {
  const resolveDisplayName = useDisplayName();
  const attendees = meeting.attendeeIds.map((id) => mockUsers.find((u) => u.id === id)).filter(Boolean) as (typeof mockUsers)[0][];
  const createdBy = mockUsers.find((u) => u.id === meeting.createdBy);

  return (
    <Card className={past ? "opacity-70" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{meeting.topic}</CardTitle>
            {past && <Badge variant="secondary" className="text-xs mt-1">ผ่านมาแล้ว</Badge>}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(meeting)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(meeting)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {meeting.description && <p className="text-muted-foreground text-sm">{meeting.description}</p>}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{new Date(meeting.datetime).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>
        {attendees.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm">{attendees.map((a) => resolveDisplayName(a.id, a.name, meeting.teamId)).join(", ")}</span>
          </div>
        )}
        {meeting.link && (
          <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm">
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {meeting.link}
          </a>
        )}
        {meeting.notificationSettings.length > 0 && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">แจ้งเตือน: {meeting.notificationSettings.sort((a, b) => b.minutesBefore - a.minutesBefore).map((n) => n.label).join(", ")}</span>
          </div>
        )}
        {createdBy && <p className="text-xs text-muted-foreground">สร้างโดย: {resolveDisplayName(createdBy.id, createdBy.name, meeting.teamId)}</p>}
      </CardContent>
    </Card>
  );
}
