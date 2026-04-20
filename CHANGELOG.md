# Changelog — LLPWebsite

## [Unreleased] — 2026-04-20

### `components/TaskForm.tsx`
- ลบการใช้ `mockUsers` ออก → ใช้ `team.members` จริงแทน (แก้ปัญหาไม่เจอสมาชิกในกลุ่ม)
- เพิ่ม `useProfileStore` และ `useEffect` fetch profile ของสมาชิกเมื่อ dialog เปิด
- แสดงชื่อจาก `profileStore` ทั้งส่วน main assignee และ sub-task assignee

### `components/KanbanBoard.tsx`
- เพิ่ม `useEffect` เรียก `fetchTasks(teamId)` เมื่อ mount / เปลี่ยนทีม (แก้ปัญหา data หายหลัง refresh)
- เพิ่ม `useEffect` pre-fetch profile สมาชิกก่อนที่ TaskForm จะเปิด (แก้ปัญหา UUID flash)
- แก้ `onSave` ให้ await `addTask` ก่อนแสดง toast — แสดง error toast ถ้า API ล้มเหลว

### `components/TaskCard.tsx`
- ลบการใช้ `mockUsers` ออกทั้งหมด → ใช้ `profileStore.getProfile()` แทน
- เพิ่ม `useEffect` pre-fetch profile สมาชิกในทีม
- แก้การแสดงชื่อ assignee (task หลัก, sub-task, activity log) ให้ใช้ profile จริง
- แก้ `onSave` ให้ await `updateTask` ก่อนแสดง toast — แสดง error toast ถ้า API ล้มเหลว

## [Unreleased] — 2026-04-14

### `app/(main)/evaluation/page.tsx`
- ลบการใช้ `mockUsers` ออก → ดึง profile จริงจาก `useProfileStore` แทน
- เพิ่ม `useEffect` fetch profile ของสมาชิกในทีมเมื่อเปลี่ยน active team
- กรองตัวเองออกจากรายการประเมิน (`id !== currentUser.id`)
- ส่ง `workspaceId` ไปให้ `EvaluationForm`

### `app/(main)/setup/page.tsx`
- ลบส่วน Rubric Weights ออก (ย้ายไปอยู่ใน workspace/page แล้ว)
- เหลือเฉพาะส่วนจัดการ Tags สำหรับ team leader

### `app/(main)/workspace/page.tsx`
- เพิ่มปุ่ม **Rubric** บนการ์ด workspace (แสดงเฉพาะ workspace owner)
- เพิ่ม Dialog ตั้งค่า Rubric: toggle เปิด/ปิด + กำหนดน้ำหนักแต่ละเกณฑ์ + reset ค่าเริ่มต้น
- เพิ่ม `useEffect` fetch profile สำหรับ team members (แสดงชื่อจริงแทน UUID)
- แก้ `getAdminDisplayName` ให้ fallback ลำดับ: `firstName+lastName` → `name` → UUID

### `components/EvaluationForm.tsx`
- เพิ่ม prop `workspaceId`
- เปลี่ยนจาก `weights` (legacy) → `getWeights(workspaceId)` จาก `useRubricStore`
- แก้ `computeWeightedScore` ให้รองรับ `enabled: boolean` ใน `RubricWeights` โดยไม่ error
- แก้การแสดง weight % ต่อเกณฑ์ให้ cast เป็น number ถูกต้อง

### `store/rubricStore.ts`
- เปลี่ยนจาก per-team (`weightsByTeam`) → per-workspace (`weightsByWorkspace`)
- ลบ `weights` และ `resetWeights` (legacy single-team) ออก
- `fetchRubric` / `setWeights` / `getWeights` รับ `workspaceId` แทน `teamId`
- `DEFAULT_RUBRIC_WEIGHTS` เพิ่ม `enabled: false`

### `types/index.ts`
- เพิ่ม `enabled: boolean` ใน `RubricWeights`
- เพิ่ม `name: string` ใน `UserProfile`

### `lib/mappers.ts`
- `mapProfile`: เพิ่ม map `r.name` → `name`
- `mapRubric`: เพิ่ม map `r.enabled` → `enabled`

### `lib/api.ts`
- เพิ่ม endpoints สำหรับ project admins: `addAdmin`, `removeAdmin`, `addAdminByEmail`
- เพิ่ม endpoints สำหรับ invite links: workspace / project / team
- เปลี่ยน rubric route จาก `teams/:id/rubric` → `workspaces/:id/rubric`

### `store/profileStore.ts`
- `getDisplayName`: เพิ่ม `profile.name` เป็น fallback ก่อน UUID
