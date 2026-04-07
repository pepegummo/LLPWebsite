"use client";

import { useState } from "react";
import { useAuthStore, useTaskStore, useTeamStore, useMeetingStore } from "@/store";
import { Task, Meeting } from "@/types";
import { mockUsers } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Video,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function statusColor(status: string) {
  if (status === "done") return "bg-green-500";
  if (status === "in_progress") return "bg-blue-500";
  return "bg-slate-400";
}

function statusLabel(status: string) {
  if (status === "done") return "เสร็จสิ้น";
  if (status === "in_progress") return "กำลังทำ";
  return "รอดำเนินการ";
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export default function StudentCalendarPage() {
  const { currentUser } = useAuthStore();
  const { tasks } = useTaskStore();
  const { teams } = useTeamStore();
  const { getMeetingsByTeam } = useMeetingStore();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tab, setTab] = useState<"calendar" | "timeline">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  if (!currentUser) return null;

  const activeTeamId = currentUser.activeTeamId ?? null;
  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const teamTasks = tasks.filter((t) => t.teamId === activeTeamId);
  const teamMeetings = activeTeamId ? getMeetingsByTeam(activeTeamId) : [];

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); } else { setMonth((m) => m - 1); }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); } else { setMonth((m) => m + 1); }
    setSelectedDay(null);
  };

  const tasksThisMonth = teamTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const meetingsThisMonth = teamMeetings.filter((m) => {
    const d = new Date(m.datetime);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const tasksByDay: Record<number, Task[]> = {};
  tasksThisMonth.forEach((t) => {
    const day = new Date(t.dueDate!).getDate();
    if (!tasksByDay[day]) tasksByDay[day] = [];
    tasksByDay[day].push(t);
  });

  const meetingsByDay: Record<number, Meeting[]> = {};
  meetingsThisMonth.forEach((m) => {
    const day = new Date(m.datetime).getDate();
    if (!meetingsByDay[day]) meetingsByDay[day] = [];
    meetingsByDay[day].push(m);
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const selectedDayTasks = selectedDay ? (tasksByDay[selectedDay] ?? []) : [];
  const selectedDayMeetings = selectedDay ? (meetingsByDay[selectedDay] ?? []) : [];

  const timelineStart = new Date(year, month, 1);
  const timelineEnd = new Date(year, month + 1, 0);
  const totalDays = timelineEnd.getDate();

  function getBarStyle(task: Task) {
    const start = new Date(task.createdAt);
    const end = task.dueDate ? new Date(task.dueDate) : start;
    const clampedStart = start < timelineStart ? timelineStart : start;
    const clampedEnd = end > timelineEnd ? timelineEnd : end;
    if (clampedStart > timelineEnd || clampedEnd < timelineStart) return null;
    const leftPct = ((clampedStart.getDate() - 1) / totalDays) * 100;
    const rightPct = ((timelineEnd.getDate() - clampedEnd.getDate()) / totalDays) * 100;
    const widthPct = 100 - leftPct - rightPct;
    return { left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%` };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="w-6 h-6" />
          ปฏิทิน / Timeline
        </h1>
        {activeTeam && (
          <p className="text-muted-foreground">ทีม: {activeTeam.name}</p>
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
          <div className="flex gap-2">
            <Button variant={tab === "calendar" ? "default" : "outline"} size="sm" onClick={() => setTab("calendar")}>ปฏิทิน</Button>
            <Button variant={tab === "timeline" ? "default" : "outline"} size="sm" onClick={() => setTab("timeline")}>Timeline</Button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[160px] text-center">
              {MONTHS_TH[month]} {year + 543}
            </h2>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {tab === "calendar" && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-7 mb-2">
                    {DAYS_TH.map((d) => (
                      <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-16" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayTasks = tasksByDay[day] ?? [];
                      const dayMeetings = meetingsByDay[day] ?? [];
                      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                      const isSelected = selectedDay === day;
                      return (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(isSelected ? null : day)}
                          className={cn(
                            "h-16 rounded-md border text-left p-1 transition-colors",
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50",
                            isToday && !isSelected && "border-primary/60 bg-primary/5"
                          )}
                        >
                          <span className={cn("text-xs font-medium block", isToday && "text-primary font-bold")}>{day}</span>
                          <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                            {dayTasks.slice(0, 1).map((t) => (
                              <span key={t.id} className={cn("text-[10px] px-1 rounded truncate text-white", statusColor(t.status))}>{t.title}</span>
                            ))}
                            {dayMeetings.slice(0, 1).map((m) => (
                              <span key={m.id} className="text-[10px] px-1 rounded truncate text-white bg-violet-500">📹 {m.topic}</span>
                            ))}
                            {(dayTasks.length + dayMeetings.length) > 2 && (
                              <span className="text-[10px] text-muted-foreground">+{dayTasks.length + dayMeetings.length - 2} อื่นๆ</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {selectedDay !== null && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">
                    {selectedDay} {MONTHS_TH[month]} {year + 543}
                    {" "}({selectedDayTasks.length} งาน, {selectedDayMeetings.length} ประชุม)
                  </h3>
                  {selectedDayTasks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">งานครบกำหนด</p>
                      {selectedDayTasks.map((task) => {
                        const assignees = task.assigneeIds.map((id) => mockUsers.find((u) => u.id === id)).filter(Boolean);
                        return (
                          <Card key={task.id}>
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm">{task.title}</p>
                                  {assignees.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {assignees.map((a) => a!.name).join(", ")}
                                    </p>
                                  )}
                                  {task.manHours != null && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {task.manHours} ชม.
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  variant={task.status === "done" ? "default" : task.status === "in_progress" ? "secondary" : "outline"}
                                  className="text-xs shrink-0"
                                >
                                  {statusLabel(task.status)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  {selectedDayMeetings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">การประชุม</p>
                      {selectedDayMeetings.map((meeting) => {
                        const attendees = meeting.attendeeIds.map((id) => mockUsers.find((u) => u.id === id)).filter(Boolean);
                        const time = new Date(meeting.datetime).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <Card key={meeting.id} className="border-violet-200 bg-violet-50">
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <Video className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{meeting.topic}</p>
                                  <p className="text-xs text-muted-foreground">{time}</p>
                                  {attendees.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {attendees.map((a) => a!.name).join(", ")}
                                    </p>
                                  )}
                                  {meeting.link && (
                                    <a href={normalizeUrl(meeting.link)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                                      <ExternalLink className="w-3 h-3" />
                                      เข้าร่วมประชุม
                                    </a>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  {selectedDayTasks.length === 0 && selectedDayMeetings.length === 0 && (
                    <p className="text-sm text-muted-foreground">ไม่มีกิจกรรมในวันนี้</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block" />รอดำเนินการ</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />กำลังทำ</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500 inline-block" />เสร็จสิ้น</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-violet-500 inline-block" />การประชุม</span>
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div className="space-y-4">
              {teamTasks.filter((t) => t.dueDate).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">ไม่มีงานที่มีวันครบกำหนด</CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    <div className="ml-40 mb-2 relative h-5">
                      {[1, 8, 15, 22, 29].filter((d) => d <= totalDays).map((d) => (
                        <span key={d} className="absolute text-xs text-muted-foreground" style={{ left: `${((d - 1) / totalDays) * 100}%`, transform: "translateX(-50%)" }}>{d}</span>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {teamTasks.filter((t) => t.dueDate).map((task) => {
                        const barStyle = getBarStyle(task);
                        const assignees = task.assigneeIds.map((id) => mockUsers.find((u) => u.id === id)).filter(Boolean);
                        const isOverdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();
                        return (
                          <div key={task.id} className="flex items-center gap-2">
                            <div className="w-40 shrink-0 pr-2">
                              <p className="text-xs font-medium truncate">{task.title}</p>
                              {assignees.length > 0 && (
                                <p className="text-[10px] text-muted-foreground truncate">{assignees.map((a) => a!.name).join(", ")}</p>
                              )}
                            </div>
                            <div className="flex-1 relative h-7 bg-muted rounded">
                              {barStyle && (
                                <div
                                  className={cn("absolute h-full rounded flex items-center px-1.5 overflow-hidden",
                                    task.status === "done" ? "bg-green-500" : task.status === "in_progress" ? "bg-blue-500" : isOverdue ? "bg-destructive" : "bg-slate-400"
                                  )}
                                  style={barStyle}
                                  title={`${task.title} — ${new Date(task.dueDate!).toLocaleDateString("th-TH")}`}
                                >
                                  <span className="text-[10px] text-white truncate">{task.manHours != null ? `${task.manHours}h` : ""}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {teamMeetings.filter((m) => {
                        const d = new Date(m.datetime);
                        return d.getFullYear() === year && d.getMonth() === month;
                      }).map((meeting) => {
                        const d = new Date(meeting.datetime);
                        const dayOfMonth = d.getDate();
                        const leftPct = ((dayOfMonth - 1) / totalDays) * 100;
                        return (
                          <div key={meeting.id} className="flex items-center gap-2">
                            <div className="w-40 shrink-0 pr-2">
                              <p className="text-xs font-medium truncate text-violet-600">📹 {meeting.topic}</p>
                              <p className="text-[10px] text-muted-foreground">{d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                            <div className="flex-1 relative h-7 bg-muted rounded">
                              <div className="absolute h-full w-1 bg-violet-500 rounded" style={{ left: `${leftPct}%` }} title={`${meeting.topic} — ${d.toLocaleDateString("th-TH")}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block" />รอดำเนินการ</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />กำลังทำ</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-green-500 inline-block" />เสร็จสิ้น</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-destructive inline-block" />เกินกำหนด</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-violet-500 inline-block" />การประชุม</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
