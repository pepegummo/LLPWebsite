"use client";

import { useGroupStore } from "@/store";
import { GroupTable } from "@/components/staff/GroupTable";

export default function StaffGroupsPage() {
  const { groups } = useGroupStore();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">จัดการกลุ่ม</h1>
        <p className="text-muted-foreground">ดูและจัดการสมาชิกในกลุ่มทั้งหมด</p>
      </div>

      <GroupTable groups={groups} />
    </div>
  );
}
