"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore, useGroupStore, useTaskStore, useEvaluationStore } from "@/store";
import { mockUsers } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronRight,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffDashboardPage() {
  const { currentUser } = useAuthStore();
  const { groups, courses } = useGroupStore();
  const { tasks } = useTaskStore();
  const { evaluations } = useEvaluationStore();

  const [expandedCourse, setExpandedCourse] = useState<string | null>(
    courses[0]?.id ?? null
  );

  if (!currentUser) return null;

  const roleLabel = () => {
    if (currentUser.role === "professor") return "อาจารย์";
    return "TA";
  };

  const totalGroups = groups.length;
  const totalStudents = mockUsers.filter((u) => u.role === "student").length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== "done" &&
      new Date(t.dueDate) < new Date()
  ).length;
  const totalEvaluations = evaluations.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground">
          ยินดีต้อนรับ, {currentUser.name} ({roleLabel()})
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{totalGroups}</p>
              <p className="text-xs text-muted-foreground">กลุ่มทั้งหมด</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{totalStudents}</p>
              <p className="text-xs text-muted-foreground">นักศึกษา</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {doneTasks}/{totalTasks}
              </p>
              <p className="text-xs text-muted-foreground">งานเสร็จสิ้น</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{overdueTasks}</p>
              <p className="text-xs text-muted-foreground">เกินกำหนด</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses with drilldown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          รายวิชา
        </h2>
        {courses.map((course) => {
          const courseGroups = groups.filter((g) => g.courseId === course.id);
          const courseTasks = tasks.filter((t) =>
            courseGroups.some((g) => g.id === t.groupId)
          );
          const courseDone = courseTasks.filter((t) => t.status === "done").length;
          const courseOverdue = courseTasks.filter(
            (t) =>
              t.dueDate &&
              t.status !== "done" &&
              new Date(t.dueDate) < new Date()
          ).length;
          const courseStudents = new Set(
            courseGroups.flatMap((g) => g.memberIds)
          ).size;
          const isExpanded = expandedCourse === course.id;
          const taNames = mockUsers
            .filter((u) => course.taIds.includes(u.id))
            .map((u) => u.name)
            .join(", ");

          return (
            <Card key={course.id} className="border-primary/20">
              <CardHeader className="pb-2">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedCourse(isExpanded ? null : course.id)
                  }
                >
                  <div>
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      TA: {taNames || "ไม่มี"} · {courseGroups.length} กลุ่ม · {courseStudents} นักศึกษา
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {courseOverdue > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        เกินกำหนด {courseOverdue}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {courseDone}/{courseTasks.length} งาน
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    {courseGroups.map((group) => {
                      const gt = tasks.filter((t) => t.groupId === group.id);
                      const gDone = gt.filter((t) => t.status === "done").length;
                      const gOverdue = gt.filter(
                        (t) =>
                          t.dueDate &&
                          t.status !== "done" &&
                          new Date(t.dueDate) < new Date()
                      ).length;
                      const pct =
                        gt.length === 0
                          ? 0
                          : Math.round((gDone / gt.length) * 100);

                      return (
                        <Card
                          key={group.id}
                          className={cn(
                            "border",
                            gOverdue > 0
                              ? "border-destructive/40"
                              : "border-border"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-sm">{group.name}</p>
                              <div className="flex gap-1">
                                {gOverdue > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    เกินกำหนด {gOverdue}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {group.memberIds.length} คน
                                </Badge>
                              </div>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {gDone}/{gt.length} งาน ({pct}%)
                            </p>
                            <Link href={`/staff/dashboard/${group.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full mt-2 h-7 text-xs"
                              >
                                ดูรายละเอียด
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Recent evaluations */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          การประเมินล่าสุด ({totalEvaluations})
        </h2>
        {evaluations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              ยังไม่มีการประเมิน
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {evaluations.slice(0, 5).map((e) => {
              const evaluator = mockUsers.find((u) => u.id === e.evaluatorId);
              const evaluatee = mockUsers.find((u) => u.id === e.evaluateeId);
              return (
                <Card key={e.id}>
                  <CardContent className="p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span>
                        {evaluator?.name} → {evaluatee?.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{e.score}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {e.comment}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
