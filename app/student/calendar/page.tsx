"use client";

import { useState } from "react";
import { useAuthStore, useTaskStore, useGroupStore } from "@/store";
import { Task } from "@/types";
import { mockUsers } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
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

export default function StudentCalendarPage() {
  const { currentUser } = useAuthStore();
  const { tasks } = useTaskStore();
  const { groups } = useGroupStore();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tab, setTab] = useState<"calendar" | "timeline">("calendar");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  if (!currentUser) return null;

  const activeGroupId = currentUser.activeGroupId;
  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const groupTasks = tasks.filter((t) => t.groupId === activeGroupId);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  // Tasks with due date in this month
  const tasksThisMonth = groupTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Map day → tasks
  const tasksByDay: Record<number, Task[]> = {};
  tasksThisMonth.forEach((t) => {
    const day = new Date(t.dueDate!).getDate();
    if (!tasksByDay[day]) tasksByDay[day] = [];
    tasksByDay[day].push(t);
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const selectedDayTasks = selectedDay ? (tasksByDay[selectedDay] ?? []) : [];

  // --- Timeline: tasks sorted by due date ---
  const timelineTasks = [...groupTasks]
    .filter((t) => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  // Compute timeline range
  const timelineStart = new Date(year, month, 1);
  const timelineEnd = new Date(year, month + 1, 0);
  const totalDays = timelineEnd.getDate();

  function getBarStyle(task: Task) {
    const start = new Date(task.createdAt);
    const end = task.dueDate ? new Date(task.dueDate) : start;

    const clampedStart = start < timelineStart ? timelineStart : start;
    const clampedEnd = end > timelineEnd ? timelineEnd : end;

    if (clampedStart > timelineEnd || clampedEnd < timelineStart) return null;

    const leftPct =
      ((clampedStart.getDate() - 1) / totalDays) * 100;
    const rightPct =
      ((timelineEnd.getDate() - clampedEnd.getDate()) / totalDays) * 100;
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
          {/* Tab switch */}
          <div className="flex gap-2">
            <Button
              variant={tab === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("calendar")}
            >
              ปฏิทิน
            </Button>
            <Button
              variant={tab === "timeline" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("timeline")}
            >
              Timeline
            </Button>
          </div>

          {/* Month navigation */}
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
              {/* Calendar grid */}
              <Card>
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="grid grid-cols-7 mb-2">
                    {DAYS_TH.map((d) => (
                      <div
                        key={d}
                        className="text-center text-xs font-medium text-muted-foreground py-1"
                      >
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Days grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells before first day */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-16" />
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dayTasks = tasksByDay[day] ?? [];
                      const isToday =
                        today.getDate() === day &&
                        today.getMonth() === month &&
                        today.getFullYear() === year;
                      const isSelected = selectedDay === day;

                      return (
                        <button
                          key={day}
                          onClick={() =>
                            setSelectedDay(isSelected ? null : day)
                          }
                          className={cn(
                            "h-16 rounded-md border text-left p-1 transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-muted/50",
                            isToday && !isSelected && "border-primary/60 bg-primary/5"
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs font-medium block",
                              isToday && "text-primary font-bold"
                            )}
                          >
                            {day}
                          </span>
                          <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden">
                            {dayTasks.slice(0, 2).map((t) => (
                              <span
                                key={t.id}
                                className={cn(
                                  "text-[10px] px-1 rounded truncate text-white",
                                  statusColor(t.status)
                                )}
                              >
                                {t.title}
                              </span>
                            ))}
                            {dayTasks.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{dayTasks.length - 2} อื่นๆ
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Selected day tasks */}
              {selectedDay !== null && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">
                    งานครบกำหนด {selectedDay} {MONTHS_TH[month]} {year + 543}
                    {" "}({selectedDayTasks.length} งาน)
                  </h3>
                  {selectedDayTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">ไม่มีงานวันนี้</p>
                  ) : (
                    selectedDayTasks.map((task) => {
                      const assignees = task.assigneeIds
                        .map((id) => mockUsers.find((u) => u.id === id))
                        .filter(Boolean);
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
                                variant={
                                  task.status === "done"
                                    ? "default"
                                    : task.status === "in_progress"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-xs shrink-0"
                              >
                                {statusLabel(task.status)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block" />
                  รอดำเนินการ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  กำลังทำ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-green-500 inline-block" />
                  เสร็จสิ้น
                </span>
              </div>
            </div>
          )}

          {tab === "timeline" && (
            <div className="space-y-4">
              {timelineTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    ไม่มีงานที่มีวันครบกำหนด
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-4">
                    {/* Date header */}
                    <div className="ml-40 mb-2 relative h-5">
                      {[1, 8, 15, 22, 29].filter((d) => d <= totalDays).map((d) => (
                        <span
                          key={d}
                          className="absolute text-xs text-muted-foreground"
                          style={{
                            left: `${((d - 1) / totalDays) * 100}%`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    {/* Timeline rows */}
                    <div className="space-y-2">
                      {groupTasks.filter((t) => t.dueDate).map((task) => {
                        const barStyle = getBarStyle(task);
                        const assignees = task.assigneeIds
                          .map((id) => mockUsers.find((u) => u.id === id))
                          .filter(Boolean);
                        const isOverdue =
                          task.dueDate &&
                          task.status !== "done" &&
                          new Date(task.dueDate) < new Date();

                        return (
                          <div key={task.id} className="flex items-center gap-2">
                            <div className="w-40 shrink-0 pr-2">
                              <p className="text-xs font-medium truncate">{task.title}</p>
                              {assignees.length > 0 && (
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {assignees.map((a) => a!.name).join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="flex-1 relative h-7 bg-muted rounded">
                              {barStyle && (
                                <div
                                  className={cn(
                                    "absolute h-full rounded flex items-center px-1.5 overflow-hidden",
                                    task.status === "done"
                                      ? "bg-green-500"
                                      : task.status === "in_progress"
                                      ? "bg-blue-500"
                                      : isOverdue
                                      ? "bg-destructive"
                                      : "bg-slate-400"
                                  )}
                                  style={barStyle}
                                  title={`${task.title} — ${new Date(task.dueDate!).toLocaleDateString("th-TH")}`}
                                >
                                  <span className="text-[10px] text-white truncate">
                                    {task.manHours != null ? `${task.manHours}h` : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-400 inline-block" />
                  รอดำเนินการ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block" />
                  กำลังทำ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-green-500 inline-block" />
                  เสร็จสิ้น
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-destructive inline-block" />
                  เกินกำหนด
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
