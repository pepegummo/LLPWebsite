"use client";

import { useState } from "react";
import { useAuthStore, useProfileStore, useTeamStore } from "@/store";
import { UserProfile, Contact, ContactType } from "@/types";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  UserCircle,
  Mail,
  Phone,
  Plus,
  Trash2,
  Save,
  Edit3,
  AtSign,
  MessageCircle,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

const CONTACT_TYPES: ContactType[] = ["Email", "Facebook", "IG", "Line", "Discord", "Phone"];

const CONTACT_ICONS: Record<ContactType, React.ReactNode> = {
  Email: <Mail className="w-4 h-4" />,
  Facebook: <Share2 className="w-4 h-4" />,
  IG: <AtSign className="w-4 h-4" />,
  Line: <MessageCircle className="w-4 h-4" />,
  Discord: <MessageCircle className="w-4 h-4" />,
  Phone: <Phone className="w-4 h-4" />,
};

const CONTACT_COLORS: Record<ContactType, string> = {
  Email: "bg-blue-100 text-blue-700",
  Facebook: "bg-indigo-100 text-indigo-700",
  IG: "bg-pink-100 text-pink-700",
  Line: "bg-green-100 text-green-700",
  Discord: "bg-violet-100 text-violet-700",
  Phone: "bg-slate-100 text-slate-700",
};

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  const { getProfile, upsertProfile } = useProfileStore();
  const { teams } = useTeamStore();

  if (!currentUser) return null;

  const existing = getProfile(currentUser.id);
  const initial: UserProfile = existing ?? {
    userId: currentUser.id,
    firstName: "",
    lastName: "",
    bio: "",
    contacts: [],
    displayNames: {},
  };

  const [form, setForm] = useState<UserProfile>(initial);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactType, setNewContactType] = useState<ContactType>("Email");
  const [newContactValue, setNewContactValue] = useState("");
  const [editDisplayNameTeamId, setEditDisplayNameTeamId] = useState<string | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState("");

  const userTeams = teams.filter((t) => t.members.some((m) => m.userId === currentUser.id));

  const availableContactTypes = CONTACT_TYPES.filter(
    (ct) => !form.contacts.some((c) => c.type === ct)
  );

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("กรุณากรอกชื่อและนามสกุล");
      return;
    }
    upsertProfile(form);
    toast.success("บันทึกข้อมูลส่วนตัวแล้ว");
  };

  const handleAddContact = () => {
    if (!newContactValue.trim()) {
      toast.error("กรุณากรอกข้อมูลการติดต่อ");
      return;
    }
    setForm((prev) => ({
      ...prev,
      contacts: [...prev.contacts, { type: newContactType, value: newContactValue.trim() }],
    }));
    setNewContactValue("");
    setShowAddContact(false);
    toast.success(`เพิ่ม ${newContactType} แล้ว`);
  };

  const handleRemoveContact = (type: ContactType) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.type !== type),
    }));
  };

  const handleSaveDisplayName = () => {
    if (!editDisplayNameTeamId) return;
    setForm((prev) => ({
      ...prev,
      displayNames: {
        ...prev.displayNames,
        [editDisplayNameTeamId]: displayNameDraft.trim(),
      },
    }));
    setEditDisplayNameTeamId(null);
    setDisplayNameDraft("");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <UserCircle className="w-6 h-6" />
        ข้อมูลส่วนตัว
      </h1>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลพื้นฐาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ชื่อ (First Name) *</Label>
              <Input
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                placeholder="ชื่อ"
              />
            </div>
            <div className="space-y-1.5">
              <Label>นามสกุล (Last Name) *</Label>
              <Input
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                placeholder="นามสกุล"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Bio (ไม่บังคับ)</Label>
            <Textarea
              value={form.bio ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="แนะนำตัวสั้นๆ..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">ช่องทางการติดต่อ</CardTitle>
            {availableContactTypes.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setNewContactType(availableContactTypes[0]);
                  setShowAddContact(true);
                }}
                className="gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่ม
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {form.contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              ยังไม่มีช่องทางการติดต่อ
            </p>
          ) : (
            <div className="space-y-2">
              {form.contacts.map((c) => (
                <div
                  key={c.type}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/30"
                >
                  <Badge className={`gap-1.5 shrink-0 ${CONTACT_COLORS[c.type]}`} variant="secondary">
                    {CONTACT_ICONS[c.type]}
                    {c.type}
                  </Badge>
                  <span className="flex-1 text-sm truncate">{c.value}</span>
                  <button
                    onClick={() => handleRemoveContact(c.type)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Display Names per Team */}
      {userTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ชื่อที่แสดงในแต่ละทีม (Display Name)</CardTitle>
            <p className="text-xs text-muted-foreground">ชื่อที่จะโชว์แทนชื่อจริงในแต่ละทีม (ไม่บังคับ)</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {userTeams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {form.displayNames[team.id]
                      ? `แสดงเป็น: "${form.displayNames[team.id]}"`
                      : "ใช้ชื่อจริง"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditDisplayNameTeamId(team.id);
                    setDisplayNameDraft(form.displayNames[team.id] ?? "");
                  }}
                  className="gap-1.5 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  แก้ไข
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} className="gap-2">
        <Save className="w-4 h-4" />
        บันทึกข้อมูลส่วนตัว
      </Button>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>เพิ่มช่องทางการติดต่อ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>ประเภท</Label>
              <Select value={newContactType} onValueChange={(v) => setNewContactType(v as ContactType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableContactTypes.map((ct) => (
                    <SelectItem key={ct} value={ct}>
                      <span className="flex items-center gap-2">
                        {CONTACT_ICONS[ct]}
                        {ct}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ข้อมูล</Label>
              <Input
                value={newContactValue}
                onChange={(e) => setNewContactValue(e.target.value)}
                placeholder={
                  newContactType === "Email"
                    ? "example@email.com"
                    : newContactType === "Phone"
                    ? "0xx-xxx-xxxx"
                    : `ชื่อผู้ใช้ ${newContactType}`
                }
                onKeyDown={(e) => e.key === "Enter" && handleAddContact()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAddContact} disabled={!newContactValue.trim()}>
              เพิ่ม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Display Name Dialog */}
      <Dialog open={!!editDisplayNameTeamId} onOpenChange={() => setEditDisplayNameTeamId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              แก้ไข Display Name —{" "}
              {userTeams.find((t) => t.id === editDisplayNameTeamId)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Display Name (เว้นว่างเพื่อใช้ชื่อจริง)</Label>
            <Input
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              placeholder="ชื่อที่ต้องการแสดง"
              onKeyDown={(e) => e.key === "Enter" && handleSaveDisplayName()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDisplayNameTeamId(null)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSaveDisplayName}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
