"use client";

import { useState } from "react";
import { useAuthStore, useTeamStore, useTemplateStore, useRubricStore } from "@/store";
import {
  Template,
  TemplateCategory,
  ProjectTemplate,
  RubricTemplate,
  TaskStructureTemplate,
  PeerEvaluationTemplate,
  RubricWeights,
} from "@/types";
import { DEFAULT_RUBRIC_WEIGHTS } from "@/store/rubricStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Library,
  FolderOpen,
  Sliders,
  ListChecks,
  ClipboardCheck,
  Plus,
  Trash2,
  Copy,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

const CATEGORY_META: Record<TemplateCategory, { label: string; icon: React.ReactNode; color: string }> = {
  project: { label: "Project Template", icon: <FolderOpen className="w-4 h-4" />, color: "bg-blue-100 text-blue-700" },
  rubric: { label: "Rubric Template", icon: <Sliders className="w-4 h-4" />, color: "bg-amber-100 text-amber-700" },
  task_structure: { label: "Task Structure", icon: <ListChecks className="w-4 h-4" />, color: "bg-green-100 text-green-700" },
  peer_evaluation: { label: "Peer Evaluation", icon: <ClipboardCheck className="w-4 h-4" />, color: "bg-purple-100 text-purple-700" },
};

const CRITERIA_KEYS: (keyof RubricWeights)[] = [
  "contribution", "qualityOfWork", "responsibility", "communication", "teamwork", "effort",
];
const CRITERIA_LABELS: Record<keyof RubricWeights, string> = {
  contribution: "Contribution",
  qualityOfWork: "Quality of Work",
  responsibility: "Responsibility",
  communication: "Communication",
  teamwork: "Teamwork",
  effort: "Effort",
};

// ─── Create Form State ───────────────────────────────────────────────────────

interface CreateForm {
  name: string;
  description: string;
  // project
  taskTitles: string[];
  // rubric
  rubricWeights: RubricWeights;
  // task structure
  tsTitle: string;
  tsDescription: string;
  tsManHours: string;
  tsSubTasks: { title: string; manHours: string }[];
  // peer evaluation
  peNotes: string;
  peCriteriaLabels: Record<keyof RubricWeights, string>;
}

const DEFAULT_FORM: CreateForm = {
  name: "",
  description: "",
  taskTitles: [""],
  rubricWeights: { ...DEFAULT_RUBRIC_WEIGHTS },
  tsTitle: "",
  tsDescription: "",
  tsManHours: "",
  tsSubTasks: [{ title: "", manHours: "" }],
  peNotes: "",
  peCriteriaLabels: {
    contribution: "Contribution",
    qualityOfWork: "Quality of Work",
    responsibility: "Responsibility",
    communication: "Communication",
    teamwork: "Teamwork",
    effort: "Effort",
  },
};

export default function TemplatesPage() {
  const { currentUser } = useAuthStore();
  const { teams, getUserRole } = useTeamStore();
  const { templates, addTemplate, deleteTemplate } = useTemplateStore();
  const { setWeights } = useRubricStore();

  const [activeTab, setActiveTab] = useState<TemplateCategory>("project");
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateForm>({ ...DEFAULT_FORM });

  if (!currentUser) return null;

  const activeTeam = teams.find((t) => t.id === currentUser.activeTeamId);
  const userRole = activeTeam ? getUserRole(activeTeam.id, currentUser.id) : null;
  const isLeader = userRole === "team_leader" || userRole === "assistant_leader";

  if (!isLeader) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Library className="w-6 h-6" />
          Template Library
        </h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>เฉพาะ Team Leader / Assistant Leader เท่านั้น</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setForm({ ...DEFAULT_FORM });
    setCreateDialog(true);
  };

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error("กรุณากรอกชื่อ Template");
      return;
    }

    let data: Template["data"];
    if (activeTab === "project") {
      const titles = form.taskTitles.map((t) => t.trim()).filter(Boolean);
      if (titles.length === 0) {
        toast.error("กรุณาเพิ่ม Task อย่างน้อย 1 รายการ");
        return;
      }
      data = {
        name: form.name,
        description: form.description,
        defaultTaskTitles: titles,
      } satisfies ProjectTemplate;
    } else if (activeTab === "rubric") {
      const total = Object.values(form.rubricWeights).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        toast.error(`น้ำหนักรวมต้องเท่ากับ 100% (ปัจจุบัน: ${total}%)`);
        return;
      }
      data = { weights: { ...form.rubricWeights } } satisfies RubricTemplate;
    } else if (activeTab === "task_structure") {
      if (!form.tsTitle.trim()) {
        toast.error("กรุณากรอกชื่องาน");
        return;
      }
      const subTasks = form.tsSubTasks
        .filter((s) => s.title.trim())
        .map((s) => ({ title: s.title.trim(), manHours: s.manHours ? Number(s.manHours) : undefined }));
      data = {
        title: form.tsTitle.trim(),
        description: form.tsDescription,
        manHours: form.tsManHours ? Number(form.tsManHours) : undefined,
        subTasks,
        tags: [],
      } satisfies TaskStructureTemplate;
    } else {
      data = {
        criteriaLabels: CRITERIA_KEYS.map((k) => ({
          key: k,
          customLabel: form.peCriteriaLabels[k] || CRITERIA_LABELS[k],
        })),
        notes: form.peNotes,
      } satisfies PeerEvaluationTemplate;
    }

    const tmpl: Template = {
      id: generateId(),
      category: activeTab,
      name: form.name.trim(),
      description: form.description,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      data,
    };
    addTemplate(tmpl);
    toast.success("สร้าง Template แล้ว");
    setCreateDialog(false);
  };

  const handleApplyRubric = (tmpl: Template) => {
    const d = tmpl.data as RubricTemplate;
    setWeights(d.weights);
    toast.success(`ใช้ Rubric "${tmpl.name}" แล้ว`);
  };

  const renderTemplateCard = (tmpl: Template) => {
    const meta = CATEGORY_META[tmpl.category];
    return (
      <Card key={tmpl.id}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className={`gap-1.5 ${meta.color}`}>
                  {meta.icon}
                  {meta.label}
                </Badge>
              </div>
              <CardTitle className="text-sm">{tmpl.name}</CardTitle>
              {tmpl.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tmpl.description}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              {tmpl.category === "rubric" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApplyRubric(tmpl)}
                  className="gap-1.5 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  ใช้งาน
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteId(tmpl.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <TemplateDetail tmpl={tmpl} />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Library className="w-6 h-6" />
          Template Library
        </h1>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          สร้าง Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v: TemplateCategory) => setActiveTab(v)}>
        <TabsList className="grid grid-cols-4 w-full">
          {(Object.keys(CATEGORY_META) as TemplateCategory[]).map((cat) => (
            <TabsTrigger key={cat} value={cat} className="gap-1.5 text-xs sm:text-sm">
              {CATEGORY_META[cat].icon}
              <span className="hidden sm:inline">{CATEGORY_META[cat].label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(CATEGORY_META) as TemplateCategory[]).map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4 space-y-3">
            {templates.filter((t) => t.category === cat).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground text-sm">
                  ยังไม่มี {CATEGORY_META[cat].label} — กด "สร้าง Template" เพื่อเพิ่ม
                </CardContent>
              </Card>
            ) : (
              templates.filter((t) => t.category === cat).map(renderTemplateCard)
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {CATEGORY_META[activeTab].icon}
              สร้าง {CATEGORY_META[activeTab].label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Common */}
            <div className="space-y-1.5">
              <Label>ชื่อ Template *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="ชื่อ Template"
              />
            </div>
            <div className="space-y-1.5">
              <Label>คำอธิบาย</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="อธิบาย Template นี้..."
                rows={2}
              />
            </div>

            {/* Project-specific */}
            {activeTab === "project" && (
              <div className="space-y-2">
                <Label>รายการ Task เริ่มต้น</Label>
                {form.taskTitles.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={t}
                      onChange={(e) => {
                        const updated = [...form.taskTitles];
                        updated[i] = e.target.value;
                        setForm((p) => ({ ...p, taskTitles: updated }));
                      }}
                      placeholder={`Task ${i + 1}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setForm((p) => ({ ...p, taskTitles: p.taskTitles.filter((_, j) => j !== i) }))
                      }
                      disabled={form.taskTitles.length === 1}
                      className="shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setForm((p) => ({ ...p, taskTitles: [...p.taskTitles, ""] }))}
                  className="gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่ม Task
                </Button>
              </div>
            )}

            {/* Rubric-specific */}
            {activeTab === "rubric" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>น้ำหนักคะแนน (%)</Label>
                  <span className={`text-sm font-medium ${
                    Object.values(form.rubricWeights).reduce((a, b) => a + b, 0) === 100
                      ? "text-green-600"
                      : "text-destructive"
                  }`}>
                    รวม: {Object.values(form.rubricWeights).reduce((a, b) => a + b, 0)}%
                  </span>
                </div>
                {CRITERIA_KEYS.map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="text-sm w-40 shrink-0">{CRITERIA_LABELS[k]}</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.rubricWeights[k]}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          rubricWeights: { ...p.rubricWeights, [k]: Number(e.target.value) },
                        }))
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Task Structure-specific */}
            {activeTab === "task_structure" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>ชื่องาน *</Label>
                  <Input
                    value={form.tsTitle}
                    onChange={(e) => setForm((p) => ({ ...p, tsTitle: e.target.value }))}
                    placeholder="ชื่องาน"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>รายละเอียดงาน</Label>
                  <Textarea
                    value={form.tsDescription}
                    onChange={(e) => setForm((p) => ({ ...p, tsDescription: e.target.value }))}
                    placeholder="รายละเอียด..."
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Man Hours (งานหลัก)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.tsManHours}
                    onChange={(e) => setForm((p) => ({ ...p, tsManHours: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sub-Tasks</Label>
                  {form.tsSubTasks.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={s.title}
                        onChange={(e) => {
                          const updated = [...form.tsSubTasks];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setForm((p) => ({ ...p, tsSubTasks: updated }));
                        }}
                        placeholder={`Sub-task ${i + 1}`}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={s.manHours}
                        onChange={(e) => {
                          const updated = [...form.tsSubTasks];
                          updated[i] = { ...updated[i], manHours: e.target.value };
                          setForm((p) => ({ ...p, tsSubTasks: updated }));
                        }}
                        placeholder="hrs"
                        className="w-16"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setForm((p) => ({ ...p, tsSubTasks: p.tsSubTasks.filter((_, j) => j !== i) }))
                        }
                        disabled={form.tsSubTasks.length === 1}
                        className="shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm((p) => ({ ...p, tsSubTasks: [...p.tsSubTasks, { title: "", manHours: "" }] }))
                    }
                    className="gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    เพิ่ม Sub-task
                  </Button>
                </div>
              </div>
            )}

            {/* Peer Evaluation-specific */}
            {activeTab === "peer_evaluation" && (
              <div className="space-y-3">
                <Label>ชื่อเกณฑ์การประเมิน (ปรับได้)</Label>
                {CRITERIA_KEYS.map((k) => (
                  <div key={k} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28 shrink-0">{CRITERIA_LABELS[k]}</span>
                    <Input
                      value={form.peCriteriaLabels[k]}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          peCriteriaLabels: { ...p.peCriteriaLabels, [k]: e.target.value },
                        }))
                      }
                      placeholder={CRITERIA_LABELS[k]}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>หมายเหตุ</Label>
                  <Textarea
                    value={form.peNotes}
                    onChange={(e) => setForm((p) => ({ ...p, peNotes: e.target.value }))}
                    placeholder="คำแนะนำในการให้คะแนน..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreate}>สร้าง Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบ Template?</AlertDialogTitle>
            <AlertDialogDescription>
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  deleteTemplate(deleteId);
                  toast.success("ลบ Template แล้ว");
                  setDeleteId(null);
                }
              }}
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Template Detail Component ────────────────────────────────────────────────

function TemplateDetail({ tmpl }: { tmpl: Template }) {
  if (tmpl.category === "project") {
    const d = tmpl.data as ProjectTemplate;
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground mb-1.5">Tasks เริ่มต้น ({d.defaultTaskTitles.length} รายการ)</p>
        <div className="flex flex-wrap gap-1.5">
          {d.defaultTaskTitles.map((t, i) => (
            <Badge key={i} variant="secondary" className="text-xs font-normal">
              {t}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  if (tmpl.category === "rubric") {
    const d = tmpl.data as RubricTemplate;
    return (
      <div className="grid grid-cols-3 gap-1.5">
        {CRITERIA_KEYS.map((k) => (
          <div key={k} className="flex items-center justify-between bg-muted/40 rounded px-2 py-1">
            <span className="text-xs text-muted-foreground truncate">{CRITERIA_LABELS[k]}</span>
            <span className="text-xs font-semibold ml-1 shrink-0">{d.weights[k]}%</span>
          </div>
        ))}
      </div>
    );
  }

  if (tmpl.category === "task_structure") {
    const d = tmpl.data as TaskStructureTemplate;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{d.title}</span>
          {d.manHours != null && <span>· {d.manHours} hrs</span>}
        </div>
        {d.subTasks.length > 0 && (
          <div className="space-y-1 pl-2 border-l-2 border-muted">
            {d.subTasks.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">·</span>
                <span>{s.title}</span>
                {s.manHours != null && (
                  <span className="text-muted-foreground ml-auto">{s.manHours} hrs</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (tmpl.category === "peer_evaluation") {
    const d = tmpl.data as PeerEvaluationTemplate;
    return (
      <div className="space-y-1.5">
        {d.criteriaLabels.map((cl) => (
          <div key={cl.key} className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground w-28 shrink-0">{CRITERIA_LABELS[cl.key]}</span>
            <span className="text-foreground">→ {cl.customLabel}</span>
          </div>
        ))}
        {d.notes && (
          <p className="text-xs text-muted-foreground mt-2 italic">{d.notes}</p>
        )}
      </div>
    );
  }

  return null;
}
