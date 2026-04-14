"use client";

import { useState, useEffect } from "react";
import {
  useAuthStore,
  useWorkspaceStore,
  useProjectStore,
  useTeamStore,
  useRubricStore,
  DEFAULT_RUBRIC_WEIGHTS,
} from "@/store";
import { useProfileStore } from "@/store/profileStore";
import { RubricWeights } from "@/types";
import { WORKSPACE_ROLE_COLORS, WORKSPACE_ROLE_LABELS } from "@/lib/badge-constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Layers,
  FolderOpen,
  Users,
  PlusCircle,
  Trash2,
  ChevronRight,
  Crown,
  Shield,
  UserPlus,
  X,
  Loader2,
  Link2,
  Copy,
  Check,
  Mail,
  Sliders,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export default function WorkspacePage() {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const {
    workspaces,
    fetchWorkspaces,
    createWorkspace,
    deleteWorkspace,
    getWorkspaceRole,
    getWorkspacesByUser,
    addAdmin,
    removeAdmin,
  } = useWorkspaceStore();
  const { projects, fetchProjects, createProject, deleteProject, getProjectsByWorkspace } = useProjectStore();
  const { teams, fetchMyTeams, createTeam, deleteTeam, getUserRole, getTeamsByUser } = useTeamStore();
  const { getProfile, fetchProfile } = useProfileStore();
  const { fetchRubric, setWeights, getWeights } = useRubricStore();

  // Rubric state (per workspace being edited)
  const [rubricWsId, setRubricWsId] = useState<string | null>(null);
  const [localRubric, setLocalRubric] = useState<RubricWeights>({ ...DEFAULT_RUBRIC_WEIGHTS });
  const [savingRubric, setSavingRubric] = useState(false);

  // Dialogs
  const [newWsOpen, setNewWsOpen] = useState(false);
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "workspace" | "project" | "team"; id: string; name: string } | null>(null);
  const [manageAdminWsId, setManageAdminWsId] = useState<string | null>(null);
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminSearching, setAdminSearching] = useState(false);

  // Invite link state
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<{ type: "workspace" | "project" | "team"; id: string; name: string } | null>(null);

  // Project admin
  const [manageProjAdminId, setManageProjAdminId] = useState<string | null>(null);
  const [projAdminEmail, setProjAdminEmail] = useState("");
  const [projAdminSearching, setProjAdminSearching] = useState(false);

  // Form state
  const [wsName, setWsName] = useState("");
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projWorkspaceId, setProjWorkspaceId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamProjectId, setTeamProjectId] = useState("");

  // Loading state per action
  const [saving, setSaving] = useState(false);

  // Fetch projects for any new workspace that was just added
  useEffect(() => {
    workspaces.forEach((ws) => fetchProjects(ws.id));
  }, [workspaces.length]);

  // Fetch profiles for all admin IDs we encounter
  useEffect(() => {
    const allAdminIds = workspaces.flatMap((ws) => ws.adminIds);
    const unique = [...new Set(allAdminIds)];
    unique.forEach((id) => {
      if (!getProfile(id)) fetchProfile(id).catch(() => {});
    });
  }, [workspaces, getProfile, fetchProfile]);

  // Fetch profiles for all team members
  useEffect(() => {
    const allMemberIds = teams.flatMap((t) => t.members.map((m) => m.userId));
    const unique = [...new Set(allMemberIds)];
    unique.forEach((id) => {
      if (!getProfile(id)) fetchProfile(id).catch(() => {});
    });
  }, [teams, getProfile, fetchProfile]);

  // Load rubric into local state when opening the rubric dialog
  useEffect(() => {
    if (rubricWsId) {
      fetchRubric(rubricWsId).catch(() => {});
      setLocalRubric({ ...getWeights(rubricWsId) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubricWsId]);

  if (!currentUser) return null;

  const managedWorkspaces = getWorkspacesByUser(currentUser.id);
  const userTeams = getTeamsByUser(currentUser.id);

  const visibleProjectIds = new Set([
    ...managedWorkspaces.flatMap((ws) => getProjectsByWorkspace(ws.id).map((p) => p.id)),
    ...userTeams.map((t) => t.projectId),
  ]);
  const visibleProjects = projects.filter((p) => visibleProjectIds.has(p.id));

  const handleCreateWorkspace = async () => {
    if (!wsName.trim()) { toast.error("กรุณากรอกชื่อ Workspace"); return; }
    setSaving(true);
    try {
      await createWorkspace(wsName.trim());
      setWsName("");
      setNewWsOpen(false);
      toast.success("สร้าง Workspace แล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "สร้าง Workspace ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async () => {
    if (!projName.trim()) { toast.error("กรุณากรอกชื่อ Project"); return; }
    if (!projWorkspaceId) { toast.error("กรุณาเลือก Workspace"); return; }
    setSaving(true);
    try {
      await createProject(projWorkspaceId, projName.trim(), projDesc.trim() || undefined);
      setProjName("");
      setProjDesc("");
      setProjWorkspaceId("");
      setNewProjOpen(false);
      toast.success("สร้าง Project แล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "สร้าง Project ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) { toast.error("กรุณากรอกชื่อทีม"); return; }
    if (!teamProjectId) { toast.error("กรุณาเลือก Project"); return; }
    const proj = projects.find((p) => p.id === teamProjectId);
    if (!proj) return;
    setSaving(true);
    try {
      const team = await createTeam(teamProjectId, proj.workspaceId, teamName.trim());
      if (!currentUser.activeTeamId) {
        updateCurrentUser({ ...currentUser, activeTeamId: team.id });
      }
      setTeamName("");
      setTeamProjectId("");
      setNewTeamOpen(false);
      toast.success(`สร้างทีม "${team.name}" แล้ว — คุณเป็น Team Leader อัตโนมัติ`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "สร้างทีมไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.type === "workspace") {
        deleteWorkspace(deleteTarget.id);
        toast.success("ลบ Workspace แล้ว");
      } else if (deleteTarget.type === "project") {
        await deleteProject(deleteTarget.id);
        toast.success("ลบ Project แล้ว");
      } else {
        deleteTeam(deleteTarget.id);
        if (currentUser.activeTeamId === deleteTarget.id) {
          const remaining = userTeams.filter((t) => t.id !== deleteTarget.id);
          updateCurrentUser({ ...currentUser, activeTeamId: remaining[0]?.id ?? null });
        }
        toast.success("ลบทีมแล้ว");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  };

  const handleAddAdmin = async () => {
    if (!manageAdminWsId || !adminEmailInput.trim()) return;
    setAdminSearching(true);
    try {
      const result = await api.workspaces.addAdminByEmail(manageAdminWsId, adminEmailInput.trim());
      await addAdmin(manageAdminWsId, result.userId);
      setAdminEmailInput("");
      toast.success("แต่งตั้ง Workspace Admin แล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "แต่งตั้ง Admin ไม่สำเร็จ");
    } finally {
      setAdminSearching(false);
    }
  };

  const handleAddProjectAdmin = async () => {
    if (!manageProjAdminId || !projAdminEmail.trim()) return;
    setProjAdminSearching(true);
    try {
      await api.projects.addAdminByEmail(manageProjAdminId, projAdminEmail.trim());
      setProjAdminEmail("");
      toast.success("แต่งตั้ง Project Admin แล้ว");
      // Refresh projects
      managedWorkspaces.forEach((ws) => fetchProjects(ws.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "แต่งตั้ง Project Admin ไม่สำเร็จ");
    } finally {
      setProjAdminSearching(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!inviteTarget) return;
    setGeneratingLink(true);
    try {
      let token: string;
      if (inviteTarget.type === "workspace") {
        const res = await api.workspaces.createInviteLink(inviteTarget.id);
        token = res.token;
      } else if (inviteTarget.type === "project") {
        const res = await api.projects.createInviteLink(inviteTarget.id);
        token = res.token;
      } else {
        const res = await api.teams.createInviteLink(inviteTarget.id);
        token = res.token;
      }
      const link = `${window.location.origin}/invite/${inviteTarget.type}/${token}`;
      setInviteLink(link);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "สร้าง Invite Link ไม่สำเร็จ");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setInviteLinkCopied(true);
    toast.success("คัดลอก Invite Link แล้ว");
    setTimeout(() => setInviteLinkCopied(false), 2000);
  };

  const handleRemoveAdmin = async (wsId: string, userId: string) => {
    try {
      await removeAdmin(wsId, userId);
      toast.success("ถอด Workspace Admin แล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ถอด Admin ไม่สำเร็จ");
    }
  };

  const RUBRIC_CRITERIA: { key: keyof Omit<RubricWeights, "enabled">; label: string }[] = [
    { key: "contribution", label: "Contribution (การมีส่วนร่วม)" },
    { key: "qualityOfWork", label: "Quality of Work (คุณภาพงาน)" },
    { key: "responsibility", label: "Responsibility (ความรับผิดชอบ)" },
    { key: "communication", label: "Communication (การสื่อสาร)" },
    { key: "teamwork", label: "Teamwork (การทำงานเป็นทีม)" },
    { key: "effort", label: "Effort (ความพยายาม)" },
  ];

  const handleSaveRubric = async () => {
    if (!rubricWsId) return;
    const total = RUBRIC_CRITERIA.reduce((s, { key }) => s + (localRubric[key] as number), 0);
    if (localRubric.enabled && total !== 100) {
      toast.error(`น้ำหนักรวมต้องเท่ากับ 100 (ปัจจุบัน: ${total})`);
      return;
    }
    setSavingRubric(true);
    try {
      await setWeights(rubricWsId, localRubric);
      toast.success("บันทึกการตั้งค่า Rubric แล้ว");
      setRubricWsId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSavingRubric(false);
    }
  };

  const getAdminDisplayName = (userId: string) => {
    const profile = getProfile(userId);
    return profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
          profile.name ||
          userId
      : userId;
  };

  const manageAdminWs = workspaces.find((w) => w.id === manageAdminWsId);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Layers className="w-6 h-6" />
            Workspace
          </h1>
          <p className="text-muted-foreground">จัดการ Workspace, Project และทีม</p>
        </div>
      </div>

      {/* Quick create actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setNewWsOpen(true)}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Workspace ใหม่
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setProjWorkspaceId(managedWorkspaces[0]?.id ?? ""); setNewProjOpen(true); }}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Project ใหม่
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setTeamProjectId(visibleProjects[0]?.id ?? ""); setNewTeamOpen(true); }}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          ทีมใหม่
        </Button>
      </div>

      {/* ทีมของฉัน */}
      {userTeams.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              ทีมของฉัน
              <Badge variant="secondary" className="text-xs">{userTeams.length} ทีม</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {userTeams.map((team) => {
              const proj = projects.find((p) => p.id === team.projectId);
              const ws = workspaces.find((w) => w.id === team.workspaceId);
              const myRole = getUserRole(team.id, currentUser.id);
              const isThisLeader = myRole === "team_leader";
              return (
                <div key={team.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{team.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ws?.name} <ChevronRight className="w-3 h-3 inline" /> {proj?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {myRole && (
                      <Badge variant="outline" className="text-xs">
                        {myRole === "team_leader" ? "Team Leader" : myRole === "assistant_leader" ? "Assistant Leader" : "Member"}
                      </Badge>
                    )}
                    {isThisLeader && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget({ type: "team", id: team.id, name: team.name })}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Workspaces */}
      <div className="space-y-4">
        {managedWorkspaces.length === 0 && userTeams.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">ยังไม่มี Workspace</p>
              <p className="text-sm mt-1">สร้าง Workspace เพื่อเริ่มต้น</p>
              <Button size="sm" className="mt-4" onClick={() => setNewWsOpen(true)}>
                <PlusCircle className="w-4 h-4 mr-1.5" />
                สร้าง Workspace
              </Button>
            </CardContent>
          </Card>
        ) : (
          managedWorkspaces.map((ws) => {
            const myWsRole = getWorkspaceRole(ws.id, currentUser.id)!;
            const isOwner = myWsRole === "owner";
            const canManageProject = isOwner || myWsRole === "admin";
            const wsProjects = getProjectsByWorkspace(ws.id);

            return (
              <Card key={ws.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      {ws.name}
                      <Badge className={cn("text-xs border-0", WORKSPACE_ROLE_COLORS[myWsRole])}>
                        {WORKSPACE_ROLE_LABELS[myWsRole]}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      {isOwner && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => { setManageAdminWsId(ws.id); setAdminEmailInput(""); }}
                          >
                            <Shield className="w-3.5 h-3.5 mr-1" />
                            จัดการ Admin
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => setRubricWsId(ws.id)}
                          >
                            <Sliders className="w-3.5 h-3.5 mr-1" />
                            Rubric
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-primary"
                        onClick={() => { setInviteTarget({ type: "workspace", id: ws.id, name: ws.name }); setInviteLink(null); }}
                      >
                        <Link2 className="w-3.5 h-3.5 mr-1" />
                        เชิญ
                      </Button>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget({ type: "workspace", id: ws.id, name: ws.name })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Admin list */}
                  {(ws.adminIds ?? []).length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-xs text-muted-foreground">Admins:</span>
                      {ws.adminIds.map((uid) => (
                        <Badge key={uid} variant="outline" className="text-xs gap-1">
                          <Shield className="w-2.5 h-2.5 text-violet-500" />
                          {getAdminDisplayName(uid)}
                          {isOwner && (
                            <button
                              className="ml-0.5 hover:text-destructive"
                              onClick={() => handleRemoveAdmin(ws.id, uid)}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-2">
                  {wsProjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">ยังไม่มี Project</p>
                  ) : (
                    wsProjects.map((proj) => {
                      const projTeams = teams.filter((t) => t.projectId === proj.id);
                      return (
                        <div key={proj.id} className="border border-border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FolderOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm">{proj.name}</span>
                              {proj.description && (
                                <span className="text-xs text-muted-foreground truncate">— {proj.description}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {canManageProject && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs text-muted-foreground hover:text-primary px-2"
                                  onClick={() => { setManageProjAdminId(proj.id); setProjAdminEmail(""); }}
                                >
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-muted-foreground hover:text-primary px-2"
                                onClick={() => { setInviteTarget({ type: "project", id: proj.id, name: proj.name }); setInviteLink(null); }}
                              >
                                <Link2 className="w-3 h-3 mr-1" />
                                เชิญ
                              </Button>
                              {canManageProject && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteTarget({ type: "project", id: proj.id, name: proj.name })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="pl-6 space-y-1.5">
                            {projTeams.map((team) => {
                              const myRole = getUserRole(team.id, currentUser.id);
                              const isThisLeader = myRole === "team_leader";
                              return (
                                <div key={team.id} className="bg-muted/40 rounded-md px-3 py-2 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="text-sm font-medium">{team.name}</span>
                                      {myRole && (
                                        <Badge variant="outline" className="text-xs">
                                          {myRole === "team_leader" ? "Leader" : myRole === "assistant_leader" ? "Asst." : "Member"}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs text-muted-foreground hover:text-primary px-2"
                                        onClick={() => { setInviteTarget({ type: "team", id: team.id, name: team.name }); setInviteLink(null); }}
                                      >
                                        <Link2 className="w-3 h-3 mr-1" />
                                        เชิญ
                                      </Button>
                                      {isThisLeader && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                          onClick={() => setDeleteTarget({ type: "team", id: team.id, name: team.name })}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  {/* Show all members */}
                                  {team.members.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pl-5">
                                      {team.members.map((m) => {
                                        const profile = getProfile(m.userId);
                                        const name = profile
                                          ? profile.displayNames?.[team.id] ||
                                            [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
                                            profile.name ||
                                            m.userId
                                          : m.userId;
                                        return (
                                          <span key={m.userId} className="text-xs bg-background border border-border rounded px-1.5 py-0.5">
                                            {name}
                                            {m.role === "team_leader" && " 👑"}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            <button
                              className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-muted/60 rounded-md transition-colors"
                              onClick={() => { setTeamProjectId(proj.id); setNewTeamOpen(true); }}
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              เพิ่มทีม
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {canManageProject && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs text-muted-foreground"
                      onClick={() => { setProjWorkspaceId(ws.id); setNewProjOpen(true); }}
                    >
                      <PlusCircle className="w-3 h-3 mr-1" />
                      เพิ่ม Project
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Manage Admin Dialog */}
      <Dialog open={!!manageAdminWsId} onOpenChange={(v) => { if (!v) setManageAdminWsId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-500" />
              จัดการ Workspace Admin — {manageAdminWs?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {manageAdminWs && (manageAdminWs.adminIds ?? []).length > 0 ? (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Admin ปัจจุบัน</Label>
                {manageAdminWs.adminIds.map((uid) => (
                  <div key={uid} className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-sm">{getAdminDisplayName(uid)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-destructive"
                      onClick={() => handleRemoveAdmin(manageAdminWsId!, uid)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">ยังไม่มี Admin</p>
            )}

            <div className="space-y-1.5 border-t border-border pt-3">
              <Label>แต่งตั้ง Admin ใหม่ (Gmail)</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="example@gmail.com"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddAdmin(); }}
                />
                <Button onClick={handleAddAdmin} disabled={!adminEmailInput.trim() || adminSearching}>
                  {adminSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageAdminWsId(null)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Dialog */}
      <Dialog open={newWsOpen} onOpenChange={(v) => { if (!v) { setNewWsOpen(false); setWsName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้าง Workspace ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>ชื่อ Workspace *</Label>
              <Input
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="เช่น CS101 - ระบบจัดการโปรเจกต์"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateWorkspace(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewWsOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateWorkspace} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={newProjOpen} onOpenChange={(v) => { if (!v) { setNewProjOpen(false); setProjName(""); setProjDesc(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้าง Project ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Workspace *</Label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={projWorkspaceId}
                onChange={(e) => setProjWorkspaceId(e.target.value)}
              >
                <option value="">เลือก Workspace...</option>
                {managedWorkspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>{ws.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>ชื่อ Project *</Label>
              <Input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="เช่น โปรเจกต์กลางภาค" />
            </div>
            <div className="space-y-1">
              <Label>รายละเอียด</Label>
              <Input value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="รายละเอียดโปรเจกต์..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewProjOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateProject} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              สร้าง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={newTeamOpen} onOpenChange={(v) => { if (!v) { setNewTeamOpen(false); setTeamName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้างทีมใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Project *</Label>
              <select
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={teamProjectId}
                onChange={(e) => setTeamProjectId(e.target.value)}
              >
                <option value="">เลือก Project...</option>
                {visibleProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>ชื่อทีม *</Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="เช่น ทีม Alpha"
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateTeam(); }}
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              คุณจะเป็น Team Leader อัตโนมัติ
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTeamOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateTeam} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              สร้างทีม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Project Admin Dialog */}
      <Dialog open={!!manageProjAdminId} onOpenChange={(v) => { if (!v) setManageProjAdminId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-500" />
              จัดการ Project Admin — {projects.find((p) => p.id === manageProjAdminId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(() => {
              const proj = projects.find((p) => p.id === manageProjAdminId);
              const adminIds = proj?.adminIds ?? [];
              return adminIds.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Project Admin ปัจจุบัน</Label>
                  {adminIds.map((uid) => (
                    <div key={uid} className="flex items-center justify-between border border-border rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-violet-500" />
                        <span className="text-sm">{getAdminDisplayName(uid)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-destructive"
                        onClick={async () => {
                          try {
                            await api.projects.removeAdmin(manageProjAdminId!, uid);
                            managedWorkspaces.forEach((ws) => fetchProjects(ws.id));
                            toast.success("ถอด Project Admin แล้ว");
                          } catch (err) {
                            toast.error(err instanceof Error ? err.message : "ถอด Admin ไม่สำเร็จ");
                          }
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ยังไม่มี Project Admin</p>
              );
            })()}
            <div className="space-y-1.5 border-t border-border pt-3">
              <Label>แต่งตั้ง Project Admin (Gmail)</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={projAdminEmail}
                  onChange={(e) => setProjAdminEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddProjectAdmin(); }}
                />
                <Button onClick={handleAddProjectAdmin} disabled={!projAdminEmail.trim() || projAdminSearching}>
                  {projAdminSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageProjAdminId(null)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={!!inviteTarget} onOpenChange={(v) => { if (!v) { setInviteTarget(null); setInviteLink(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              เชิญเข้า{inviteTarget?.type === "workspace" ? " Workspace" : inviteTarget?.type === "project" ? " Project" : "ทีม"} — {inviteTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              สร้าง Invite Link เพื่อแชร์ให้ผู้อื่น เมื่อคลิก Link จะเข้าร่วมอัตโนมัติ
            </p>
            {!inviteLink ? (
              <Button onClick={handleGenerateInviteLink} disabled={generatingLink} className="w-full">
                {generatingLink ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                สร้าง Invite Link
              </Button>
            ) : (
              <div className="space-y-2">
                <Label>Invite Link</Label>
                <div className="flex gap-2">
                  <Input value={inviteLink} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    {inviteLinkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Link นี้สามารถใช้ได้หลายครั้ง</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setInviteTarget(null); setInviteLink(null); }}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบ {deleteTarget?.type === "workspace" ? "Workspace" : deleteTarget?.type === "project" ? "Project" : "ทีม"} &quot;{deleteTarget?.name}&quot; หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rubric Weights Dialog */}
      <Dialog open={!!rubricWsId} onOpenChange={(v) => { if (!v) setRubricWsId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary" />
              ค่าน้ำหนัก Rubric — {workspaces.find((w) => w.id === rubricWsId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Enable/disable toggle */}
            <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium">เปิดใช้งานการประเมิน Rubric</p>
                <p className="text-xs text-muted-foreground">หากปิด สมาชิกจะไม่ถูกถามเรื่องน้ำหนักเกณฑ์</p>
              </div>
              <button
                type="button"
                onClick={() => setLocalRubric((r) => ({ ...r, enabled: !r.enabled }))}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
                  localRubric.enabled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5",
                    localRubric.enabled ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {/* Weight inputs — only shown when enabled */}
            {localRubric.enabled && (
              <div className="space-y-3">
                {RUBRIC_CRITERIA.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Label className="flex-1 text-sm">{label}</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={localRubric[key] as number}
                        onChange={(e) =>
                          setLocalRubric((r) => ({ ...r, [key]: parseInt(e.target.value) || 0 }))
                        }
                        className="w-20 text-right"
                      />
                      <span className="text-sm text-muted-foreground w-4">%</span>
                    </div>
                  </div>
                ))}

                {(() => {
                  const total = RUBRIC_CRITERIA.reduce((s, { key }) => s + (localRubric[key] as number), 0);
                  return (
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-md text-sm",
                      total === 100 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      <span>ผลรวมน้ำหนัก</span>
                      <span className="font-semibold">{total}%</span>
                    </div>
                  );
                })()}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setLocalRubric({ ...DEFAULT_RUBRIC_WEIGHTS, enabled: true })}
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  รีเซ็ตเป็นค่าเริ่มต้น
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRubricWsId(null)}>ยกเลิก</Button>
            <Button onClick={handleSaveRubric} disabled={savingRubric}>
              {savingRubric ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
