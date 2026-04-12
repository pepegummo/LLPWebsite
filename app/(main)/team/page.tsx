"use client";

import { useEffect, useState } from "react";
import { useAuthStore, useTeamStore, useTaskStore } from "@/store";
import { useProfileStore } from "@/store/profileStore";
import { useDisplayName } from "@/lib/useDisplayName";
import { TeamRole } from "@/types";
import { WorkloadBar } from "@/components/WorkloadBar";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Users, User, Shuffle, UserPlus, Shield, Trash2, Crown, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/badge-constants";

export default function StudentTeamPage() {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { teams, getUserRole, setMemberRole, removeMember, inviteUser, rejectInvitation } = useTeamStore();
  const { tasks, updateTask } = useTaskStore();
  const { getProfile, fetchProfile, upsertProfile } = useProfileStore();
  const resolveDisplayName = useDisplayName();

  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [showInvitePanel, setShowInvitePanel] = useState(false);

  // Invite search state
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [inviting, setInviting] = useState(false);

  if (!currentUser) return null;

  const activeTeam = teams.find((t) => t.id === currentUser.activeTeamId);

  // Fetch profiles for all members when team changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!activeTeam) return;
    activeTeam.members.forEach(({ userId }) => {
      if (!getProfile(userId)) fetchProfile(userId).catch(() => {});
    });
    activeTeam.invitedIds.forEach((userId) => {
      if (!getProfile(userId)) fetchProfile(userId).catch(() => {});
    });
  }, [activeTeam?.id, activeTeam?.members.length, activeTeam?.invitedIds.length]);

  if (!activeTeam) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">ทีมของฉัน</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่มีทีมที่ใช้งานอยู่ — เลือกทีมจาก Team Switcher
          </CardContent>
        </Card>
      </div>
    );
  }

  const userRole = getUserRole(activeTeam.id, currentUser.id);
  const isLeader = userRole === "team_leader" || userRole === "assistant_leader";
  const isTeamLeader = userRole === "team_leader";

  const memberIds = activeTeam.members.map((m) => m.userId);
  const teamTasks = tasks.filter((t) => t.teamId === activeTeam.id);

  const getMemberName = (userId: string) => {
    const profile = getProfile(userId);
    return resolveDisplayName(userId, profile?.displayNames?.[activeTeam.id] || profile?.firstName || userId, activeTeam.id);
  };

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setFoundUser(null);
    try {
      const raw = await api.users.searchByEmail(searchEmail.trim());
      const user = raw as { id: string; name: string; email: string };
      if (memberIds.includes(user.id)) {
        toast.error("ผู้ใช้นี้เป็นสมาชิกทีมอยู่แล้ว");
        return;
      }
      if (activeTeam.invitedIds.includes(user.id)) {
        toast.error("ส่งคำเชิญให้ผู้ใช้นี้ไปแล้ว");
        return;
      }
      setFoundUser(user);
    } catch {
      toast.error("ไม่พบผู้ใช้ที่ใช้อีเมลนี้");
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!foundUser) return;
    setInviting(true);
    try {
      await inviteUser(activeTeam.id, foundUser.id);
      // Cache the found user's profile so their name shows in pending list
      upsertProfile({
        userId: foundUser.id,
        firstName: foundUser.name,
        lastName: "",
        displayNames: {},
        contacts: [],
      });
      setSearchEmail("");
      setFoundUser(null);
      toast.success(`ส่งคำเชิญให้ ${foundUser.name} แล้ว`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ส่งคำเชิญไม่สำเร็จ");
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = (userId: string) => {
    rejectInvitation(activeTeam.id, userId);
    toast.success("ยกเลิกคำเชิญแล้ว");
  };

  const handleReassign = () => {
    if (memberIds.length === 0) return;
    const pendingTasks = teamTasks.filter((t) => t.status === "todo" || t.status === "in_progress");
    if (pendingTasks.length === 0) {
      toast.info("ไม่มีงานที่ต้องจัดสรรใหม่");
      return;
    }

    const sorted = [...pendingTasks].sort((a, b) => (b.manHours ?? 1) - (a.manHours ?? 1));
    const memberHours: Record<string, number> = {};
    memberIds.forEach((id) => {
      memberHours[id] = teamTasks
        .filter((t) => t.status === "done" && t.assigneeIds.includes(id))
        .reduce((s, t) => s + (t.manHours ?? 1), 0);
    });

    sorted.forEach((task) => {
      const leastLoaded = memberIds.reduce(
        (minId, id) => memberHours[id] < memberHours[minId] ? id : minId,
        memberIds[0]
      );
      updateTask({ ...task, assigneeIds: [leastLoaded] });
      memberHours[leastLoaded] += task.manHours ?? 1;
    });

    toast.success(`จัดสรรงานใหม่ ${pendingTasks.length} งาน ให้สมาชิก ${memberIds.length} คน`);
  };

  const handleSetRole = (userId: string, role: TeamRole) => {
    setMemberRole(activeTeam.id, userId, role);
    toast.success(`เปลี่ยน ${getMemberName(userId)} เป็น ${ROLE_LABELS[role]} แล้ว`);
  };

  const handleRemoveMember = (userId: string) => {
    removeMember(activeTeam.id, userId);
    if (currentUser.activeTeamId === activeTeam.id && userId === currentUser.id) {
      updateCurrentUser({ ...currentUser, activeTeamId: null });
    }
    setRemovingMemberId(null);
    toast.success(`ลบ ${getMemberName(userId)} ออกจากทีมแล้ว`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">ทีมของฉัน</h1>
          <p className="text-muted-foreground">ทีม: {activeTeam.name}</p>
        </div>
        <div className="flex gap-2">
          {isLeader && (
            <Button variant="outline" size="sm" onClick={() => setShowInvitePanel((v) => !v)}>
              <UserPlus className="w-4 h-4 mr-1.5" />
              ชวนเพื่อน
            </Button>
          )}
          {memberIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleReassign}>
              <Shuffle className="w-4 h-4 mr-1.5" />
              Re-assign
            </Button>
          )}
        </div>
      </div>

      {/* Invite panel */}
      {showInvitePanel && isLeader && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              ชวนสมาชิกใหม่
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Email search */}
            <div className="flex gap-2">
              <Input
                placeholder="ค้นหาด้วยอีเมล..."
                value={searchEmail}
                onChange={(e) => { setSearchEmail(e.target.value); setFoundUser(null); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearchUser(); }}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleSearchUser} disabled={searching || !searchEmail.trim()}>
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {/* Found user */}
            {foundUser && (
              <div className="flex items-center justify-between border border-border rounded-md px-3 py-2 bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{foundUser.name}</p>
                  <p className="text-xs text-muted-foreground">{foundUser.email}</p>
                </div>
                <Button size="sm" onClick={handleInvite} disabled={inviting}>
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "ส่งคำเชิญ"}
                </Button>
              </div>
            )}

            {/* Pending invitations */}
            {activeTeam.invitedIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">รอตอบรับ ({activeTeam.invitedIds.length})</p>
                {activeTeam.invitedIds.map((userId) => (
                  <div key={userId} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2">
                    <span className="text-sm">{getMemberName(userId)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleCancelInvite(userId)}
                    >
                      ยกเลิก
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" />
          สมาชิก ({memberIds.length} คน)
        </h2>
        {memberIds.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">ไม่มีสมาชิก</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeTeam.members.map((memberEntry) => {
              const memberTasks = teamTasks.filter((t) => t.assigneeIds.includes(memberEntry.userId));
              const doneTasks = memberTasks.filter((t) => t.status === "done").length;
              const overdueTasks = memberTasks.filter(
                (t) => t.dueDate && t.status !== "done" && new Date(t.dueDate) < new Date()
              ).length;
              const totalHours = memberTasks.reduce((s, t) => s + (t.manHours ?? 0), 0);
              const isMe = memberEntry.userId === currentUser.id;
              const isThisLeader = memberEntry.role === "team_leader";
              const displayName = getMemberName(memberEntry.userId);

              return (
                <Card key={memberEntry.userId} className={isMe ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {isThisLeader ? (
                          <Crown className="w-5 h-5 text-amber-500" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{displayName}</p>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[memberEntry.role]}`}>
                            {ROLE_LABELS[memberEntry.role]}
                          </span>
                          {isMe && <Badge variant="outline" className="text-xs">คุณ</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                      <p>งาน: {memberTasks.length} ({doneTasks} เสร็จ)</p>
                      {totalHours > 0 && <p>Man Hours: {totalHours} ชม.</p>}
                      {overdueTasks > 0 && <p className="text-destructive">เกินกำหนด: {overdueTasks}</p>}
                    </div>

                    {isLeader && !isMe && (
                      <div className="mt-3 flex gap-1.5 flex-wrap">
                        {isTeamLeader && (
                          <Select
                            value={memberEntry.role}
                            onValueChange={(v) => handleSetRole(memberEntry.userId, v as TeamRole)}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <Shield className="w-3 h-3 mr-1" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="assistant_leader">Assistant Leader</SelectItem>
                              <SelectItem value="team_leader">Team Leader</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                          onClick={() => setRemovingMemberId(memberEntry.userId)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Workload */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">ภาระงาน</h2>
        <Card>
          <CardContent className="p-4">
            {memberIds.length === 0 ? (
              <p className="text-muted-foreground text-sm">ไม่มีสมาชิก</p>
            ) : (
              <WorkloadBar tasks={teamTasks} memberIds={memberIds} teamId={activeTeam.id} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remove member confirmation */}
      <AlertDialog open={!!removingMemberId} onOpenChange={(open) => !open && setRemovingMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบสมาชิก</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ {removingMemberId ? getMemberName(removingMemberId) : ""} ออกจากทีมหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removingMemberId && handleRemoveMember(removingMemberId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
