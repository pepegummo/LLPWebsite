"use client";

import { useState } from "react";
import {
  useAuthStore,
  useWorkspaceStore,
  useProjectStore,
  useTeamStore,
} from "@/store";
import { Workspace, Project, Team, TeamRole } from "@/types";
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
} from "lucide-react";
import { toast } from "sonner";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export default function WorkspacePage() {
  const { currentUser, updateCurrentUser } = useAuthStore();
  const { workspaces, addWorkspace, deleteWorkspace } = useWorkspaceStore();
  const { projects, addProject, deleteProject, getProjectsByWorkspace } = useProjectStore();
  const { teams, addTeam, deleteTeam, getUserRole, getTeamsByUser } = useTeamStore();

  // Dialogs
  const [newWsOpen, setNewWsOpen] = useState(false);
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "workspace" | "project" | "team"; id: string; name: string } | null>(null);

  // Form state
  const [wsName, setWsName] = useState("");
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projWorkspaceId, setProjWorkspaceId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamProjectId, setTeamProjectId] = useState("");

  if (!currentUser) return null;

  const myWorkspaces = workspaces.filter((w) => w.ownerId === currentUser.id);
  const userTeams = getTeamsByUser(currentUser.id);

  const handleCreateWorkspace = () => {
    if (!wsName.trim()) { toast.error("กรุณากรอกชื่อ Workspace"); return; }
    const ws: Workspace = {
      id: generateId(),
      name: wsName.trim(),
      ownerId: currentUser.id,
      createdAt: new Date().toISOString(),
    };
    addWorkspace(ws);
    setWsName("");
    setNewWsOpen(false);
    toast.success("สร้าง Workspace แล้ว");
  };

  const handleCreateProject = () => {
    if (!projName.trim()) { toast.error("กรุณากรอกชื่อ Project"); return; }
    if (!projWorkspaceId) { toast.error("กรุณาเลือก Workspace"); return; }
    const proj: Project = {
      id: generateId(),
      workspaceId: projWorkspaceId,
      name: projName.trim(),
      description: projDesc.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    addProject(proj);
    setProjName("");
    setProjDesc("");
    setProjWorkspaceId("");
    setNewProjOpen(false);
    toast.success("สร้าง Project แล้ว");
  };

  const handleCreateTeam = () => {
    if (!teamName.trim()) { toast.error("กรุณากรอกชื่อทีม"); return; }
    if (!teamProjectId) { toast.error("กรุณาเลือก Project"); return; }
    const proj = projects.find((p) => p.id === teamProjectId);
    if (!proj) return;

    const team: Team = {
      id: generateId(),
      projectId: teamProjectId,
      workspaceId: proj.workspaceId,
      name: teamName.trim(),
      members: [{ userId: currentUser.id, role: "team_leader" as TeamRole }],
      invitedIds: [],
      createdAt: new Date().toISOString(),
    };
    addTeam(team);

    // Set as active team if no active team
    if (!currentUser.activeTeamId) {
      updateCurrentUser({ ...currentUser, activeTeamId: team.id });
    }

    setTeamName("");
    setTeamProjectId("");
    setNewTeamOpen(false);
    toast.success(`สร้างทีม "${team.name}" แล้ว — คุณเป็น Team Leader อัตโนมัติ`);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "workspace") {
      deleteWorkspace(deleteTarget.id);
      toast.success("ลบ Workspace แล้ว");
    } else if (deleteTarget.type === "project") {
      deleteProject(deleteTarget.id);
      toast.success("ลบ Project แล้ว");
    } else {
      deleteTeam(deleteTarget.id);
      // If deleted team was active, clear it
      if (currentUser.activeTeamId === deleteTarget.id) {
        const remaining = userTeams.filter((t) => t.id !== deleteTarget.id);
        updateCurrentUser({ ...currentUser, activeTeamId: remaining[0]?.id ?? null });
      }
      toast.success("ลบทีมแล้ว");
    }
    setDeleteTarget(null);
  };

  // All projects visible to user (in their workspaces + projects of teams they're in)
  const visibleProjectIds = new Set([
    ...myWorkspaces.flatMap((ws) => getProjectsByWorkspace(ws.id).map((p) => p.id)),
    ...userTeams.map((t) => t.projectId),
  ]);
  const visibleProjects = projects.filter((p) => visibleProjectIds.has(p.id));

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
        <Button size="sm" variant="outline" onClick={() => { setProjWorkspaceId(myWorkspaces[0]?.id ?? ""); setNewProjOpen(true); }}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Project ใหม่
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setTeamProjectId(visibleProjects[0]?.id ?? ""); setNewTeamOpen(true); }}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          ทีมใหม่
        </Button>
      </div>

      {/* ทีมของฉัน — แสดงทุกทีมที่เป็นสมาชิก */}
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
        {myWorkspaces.length === 0 && userTeams.length === 0 ? (
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
        ) : myWorkspaces.length > 0 ? (
          myWorkspaces.map((ws) => {
            const wsProjects = getProjectsByWorkspace(ws.id);
            return (
              <Card key={ws.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      {ws.name}
                      <Badge variant="secondary" className="text-xs">เจ้าของ</Badge>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget({ type: "workspace", id: ws.id, name: ws.name })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
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
                            <div className="flex items-center gap-2">
                              <FolderOpen className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-sm">{proj.name}</span>
                              {proj.description && (
                                <span className="text-xs text-muted-foreground">— {proj.description}</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteTarget({ type: "project", id: proj.id, name: proj.name })}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          {/* Teams in project */}
                          <div className="pl-6 space-y-1.5">
                            {projTeams.map((team) => {
                              const myRole = getUserRole(team.id, currentUser.id);
                              const isThisLeader = myRole === "team_leader";
                              return (
                                <div key={team.id} className="flex items-center justify-between bg-muted/40 rounded-md px-3 py-1.5">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-sm">{team.name}</span>
                                    <span className="text-xs text-muted-foreground">{team.members.length} สมาชิก</span>
                                    {myRole && (
                                      <Badge variant="outline" className="text-xs">
                                        {myRole === "team_leader" ? "Leader" : myRole === "assistant_leader" ? "Asst." : "Member"}
                                      </Badge>
                                    )}
                                  </div>
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

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground"
                    onClick={() => { setProjWorkspaceId(ws.id); setNewProjOpen(true); }}
                  >
                    <PlusCircle className="w-3 h-3 mr-1" />
                    เพิ่ม Project
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : null}
      </div>

      {/* Create Workspace Dialog */}
      <Dialog open={newWsOpen} onOpenChange={(v) => { if (!v) { setNewWsOpen(false); setWsName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>สร้าง Workspace ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>ชื่อ Workspace *</Label>
              <Input value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="เช่น CS101 - ระบบจัดการโปรเจกต์" onKeyDown={(e) => { if (e.key === "Enter") handleCreateWorkspace(); }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewWsOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateWorkspace}>สร้าง</Button>
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
                {myWorkspaces.map((ws) => (
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
            <Button onClick={handleCreateProject}>สร้าง</Button>
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
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="เช่น ทีม Alpha" onKeyDown={(e) => { if (e.key === "Enter") handleCreateTeam(); }} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              คุณจะเป็น Team Leader อัตโนมัติ
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTeamOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreateTeam}>สร้างทีม</Button>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
