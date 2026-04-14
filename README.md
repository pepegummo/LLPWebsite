# LLP Frontend — LLPWebsite

Next.js frontend สำหรับระบบจัดการโปรเจกต์และประเมินผลนักศึกษา

---

## Tech Stack

| Category | Library / Tool |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI Components | shadcn/ui + Base UI |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| State Management | Zustand v5 |
| Drag & Drop | dnd-kit |
| Notifications | Sonner |
| Font | Geist |
| E2E Testing | Playwright |

---

## How to Run

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. รัน Development Server

```bash
npm run dev
```

เปิด http://localhost:3000

### 4. Build Production

```bash
npm run build
npm run start
```

### 5. รัน E2E Tests

```bash
npm run test:e2e          # รันทั้งหมด
npm run test:e2e:ui       # เปิด Playwright UI
npm run test:e2e:report   # ดู report
```

---

## File Structure

```
LLPWebsite/
├── app/
│   ├── (main)/                  # Layout หลัก (ต้อง login)
│   │   ├── calendar/            # ปฏิทินการประชุม
│   │   ├── chat/                # แชทภายในทีม
│   │   ├── dashboard/           # ภาพรวมทีม + [groupId] สำหรับ staff
│   │   ├── evaluation/          # ประเมิน peer evaluation
│   │   ├── links/               # ลิงก์ทีม
│   │   ├── meeting/             # จัดการประชุม
│   │   ├── notifications/       # การแจ้งเตือน
│   │   ├── profile/             # โปรไฟล์ผู้ใช้ + เปลี่ยนรหัสผ่าน
│   │   ├── setup/               # ตั้งค่าทีม (tags)
│   │   ├── tasks/               # Kanban Board
│   │   ├── team/                # จัดการสมาชิกทีม
│   │   ├── ticket/              # ระบบ ticket
│   │   └── workspace/           # จัดการ workspace / project / team
│   └── login/                   # หน้า login
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── NotificationPanel.tsx
│   │   ├── WorkspaceSwitcher.tsx
│   │   └── GroupSwitcher.tsx
│   ├── staff/                   # UI สำหรับ staff/อาจารย์
│   │   ├── EvalResultsTable.tsx
│   │   ├── GroupTable.tsx
│   │   ├── InviteModal.tsx
│   │   └── ProgressReportCard.tsx
│   ├── skeleton/                # Loading skeletons
│   ├── ui/                      # shadcn/ui components
│   ├── EvaluationForm.tsx
│   ├── KanbanBoard.tsx
│   ├── KanbanColumn.tsx
│   ├── TaskCard.tsx
│   ├── TaskForm.tsx
│   ├── InvitationCard.tsx
│   └── WorkloadBar.tsx
├── lib/
│   ├── api.ts                   # ฟังก์ชัน fetch ทุก endpoint
│   ├── mappers.ts               # แปลง snake_case (API) → camelCase (types)
│   ├── utils.ts
│   ├── badge-constants.ts
│   └── useDisplayName.ts
├── store/                       # Zustand stores
│   ├── index.ts                 # re-export ทั้งหมด
│   ├── authStore.ts
│   ├── workspaceStore.ts
│   ├── projectStore.ts
│   ├── teamStore.ts
│   ├── taskStore.ts
│   ├── evaluationStore.ts
│   ├── rubricStore.ts
│   ├── profileStore.ts
│   ├── notificationStore.ts
│   ├── chatStore.ts
│   ├── meetingStore.ts
│   ├── tagStore.ts
│   ├── ticketStore.ts
│   ├── linkStore.ts
│   ├── activityStore.ts
│   └── groupStore.ts
├── types/
│   └── index.ts                 # TypeScript interfaces ทั้งหมด
└── e2e/                         # Playwright E2E tests
    ├── auth.spec.ts
    ├── navigation.spec.ts
    ├── tasks.spec.ts
    └── workspace.spec.ts
```
