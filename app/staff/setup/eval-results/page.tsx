"use client";

import { useState } from "react";
import { useGroupStore, useEvaluationStore } from "@/store";
import { EvalResultsTable } from "@/components/staff/EvalResultsTable";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function StaffEvalResultsPage() {
  const { groups } = useGroupStore();
  const { evaluations } = useEvaluationStore();
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const filteredEvaluations =
    selectedGroup === "all"
      ? evaluations
      : evaluations.filter((e) => e.groupId === selectedGroup);

  const handleExport = () => {
    const data = JSON.stringify(filteredEvaluations, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluations-${selectedGroup === "all" ? "all" : selectedGroup}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ส่งออกข้อมูลแล้ว");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ผลการประเมิน</h1>
          <p className="text-muted-foreground">ผลการประเมินเพื่อนร่วมกลุ่ม</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export JSON
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="whitespace-nowrap">กรองตามกลุ่ม:</Label>
        <Select value={selectedGroup} onValueChange={(v) => setSelectedGroup(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {groups
        .filter((g) => selectedGroup === "all" || g.id === selectedGroup)
        .map((group) => {
          const groupEvals = filteredEvaluations.filter(
            (e) => e.groupId === group.id
          );
          return (
            <div key={group.id} className="space-y-2">
              <h2 className="text-lg font-semibold">{group.name}</h2>
              <EvalResultsTable evaluations={groupEvals} groupId={group.id} />
            </div>
          );
        })}
    </div>
  );
}
