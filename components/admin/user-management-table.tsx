"use client";

import { Edit2, Filter, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createNewUser,
  deleteUser,
  resetUserPasswordToDefault,
  updateUserAcademicInfo,
  updateUserRole,
} from "@/lib/actions/admin-pengguna-mutations";
import type { Profile } from "@/lib/db/schema";

interface UserManagementTableProps {
  users: Profile[];
  currentUserId: string;
  currentUserRole: string;
}

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: "Super Admin",
    className: "border-accent bg-accent/15 text-accent-text font-semibold",
  },
  wali_kelas: {
    label: "Wali Kelas",
    className: "border-accent/60 bg-accent/10 text-accent-text font-medium",
  },
  pengurus: {
    label: "Pengurus",
    className: "border-border bg-surface text-foreground font-medium",
  },
  siswa: {
    label: "Siswa",
    className: "border-border/60 bg-surface/50 text-muted",
  },
};

export function UserManagementTable({
  users,
  currentUserId,
  currentUserRole,
}: UserManagementTableProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [resettingUser, setResettingUser] = useState<Profile | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states for editing
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<"super_admin" | "wali_kelas" | "pengurus" | "siswa">(
    "siswa",
  );
  const [formNis, setFormNis] = useState("");
  const [formAbsen, setFormAbsen] = useState<string>("");
  const [formJabatan, setFormJabatan] = useState("");
  const [formGender, setFormGender] = useState<"L" | "P" | "">("");

  // Form states for creating new user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("Password123#");
  const [newRole, setNewRole] = useState<"super_admin" | "wali_kelas" | "pengurus" | "siswa">(
    "siswa",
  );
  const [newJabatan, setNewJabatan] = useState("");
  const [newNis, setNewNis] = useState("");
  const [newAbsen, setNewAbsen] = useState("");
  const [newGender, setNewGender] = useState<"L" | "P" | "">("");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (u.nis?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (u.jabatan?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  function handleOpenEdit(user: Profile) {
    setEditingUser(user);
    setFormName(user.fullName);
    setFormRole(user.role as "super_admin" | "wali_kelas" | "pengurus" | "siswa");
    setFormNis(user.nis ?? "");
    setFormAbsen(user.absenNumber !== null ? String(user.absenNumber) : "");
    setFormJabatan(user.jabatan ?? "");
    setFormGender((user.gender as "L" | "P") ?? "");
  }

  function handleSave() {
    if (!editingUser) return;

    startTransition(async () => {
      // 1. Update academic info
      const academicRes = await updateUserAcademicInfo(editingUser.id, {
        fullName: formName.trim() || editingUser.fullName,
        nis: formNis.trim() || null,
        absenNumber: formAbsen ? Number(formAbsen) : null,
        jabatan: formJabatan.trim() || null,
        gender: formGender === "L" || formGender === "P" ? formGender : null,
      });

      if (academicRes.error) {
        toast.error(academicRes.error);
        return;
      }

      // 2. If role changed and current user is super_admin
      if (currentUserRole === "super_admin" && formRole !== editingUser.role) {
        const roleRes = await updateUserRole(editingUser.id, formRole, formJabatan.trim() || null);
        if (roleRes.error) {
          toast.error(roleRes.error);
          return;
        }
      }

      toast.success("Data pengguna berhasil diperbarui.");
      setEditingUser(null);
    });
  }

  function handleCreateUser() {
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Nama lengkap dan email wajib diisi.");
      return;
    }

    startTransition(async () => {
      const res = await createNewUser({
        fullName: newName.trim(),
        email: newEmail.trim(),
        password: newPassword || "Password123#",
        role: newRole,
        jabatan: newJabatan.trim() || null,
        nis: newNis.trim() || null,
        absenNumber: newAbsen ? Number(newAbsen) : null,
        gender: newGender === "L" || newGender === "P" ? newGender : null,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Pengguna baru berhasil ditambahkan.");
      setIsAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewJabatan("");
      setNewNis("");
      setNewAbsen("");
      setNewGender("");
    });
  }

  function handleDeleteUser() {
    if (!deletingUser) return;

    startTransition(async () => {
      const res = await deleteUser(deletingUser.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(`Pengguna ${deletingUser.fullName} berhasil dihapus.`);
      setDeletingUser(null);
    });
  }

  function handleResetPassword() {
    if (!resettingUser) return;

    startTransition(async () => {
      const res = await resetUserPasswordToDefault(resettingUser.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success(
        `Kata sandi untuk ${resettingUser.fullName} berhasil direset ke "Password123#".`,
      );
      setResettingUser(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filter, Search, and Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
          <Input
            placeholder="Cari nama, NIS, atau jabatan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="size-4 text-muted shrink-0" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semua Peran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                <SelectItem value="pengurus">Pengurus</SelectItem>
                <SelectItem value="siswa">Siswa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {currentUserRole === "super_admin" && (
            <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5 font-medium">
              <Plus className="size-4" />
              <span>Tambah Pengguna</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">No</TableHead>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead className="text-center">Absen</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead className="text-center">L/P</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user, idx) => {
                  const badge = ROLE_BADGES[user.role] ?? {
                    label: user.role,
                    className: "border-border text-muted",
                  };

                  return (
                    <TableRow key={user.id} className="hover:bg-surface/50">
                      <TableCell className="text-center font-mono text-xs text-muted">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{user.fullName}</span>
                          {user.id === currentUserId && (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-accent/40 text-accent-text"
                            >
                              Anda
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badge.className}>
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted">
                        {user.nis || "-"}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted">
                        {user.absenNumber !== null ? user.absenNumber : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted">{user.jabatan || "-"}</TableCell>
                      <TableCell className="text-center font-mono text-xs text-muted">
                        {user.gender || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 gap-1.5 text-xs"
                          >
                            <Edit2 className="size-3.5" />
                            <span>Edit</span>
                          </Button>
                          {currentUserRole === "super_admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setResettingUser(user)}
                              className="h-8 px-2 text-xs text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
                              title="Reset Kata Sandi ke Default (Password123#)"
                            >
                              <RotateCcw className="size-3.5" />
                            </Button>
                          )}
                          {currentUserRole === "super_admin" && user.id !== currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingUser(user)}
                              className="h-8 px-2 text-xs text-destructive-text hover:bg-destructive/10"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Tambah Pengguna Baru Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && setIsAddOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Buat akun otentikasi baru beserta profil identitas siswa atau staf kelas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3.5 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-name">Nama Lengkap *</Label>
              <Input
                id="new-name"
                placeholder="Contoh: Pratama Aditya"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-email">Email Login *</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="nama@12rpl.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-password">Kata Sandi Awal</Label>
                <Input
                  id="new-password"
                  placeholder="Min. 8 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-role">Peran (Role) *</Label>
                <Select
                  value={newRole}
                  onValueChange={(val) =>
                    setNewRole(val as "super_admin" | "wali_kelas" | "pengurus" | "siswa")
                  }
                >
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="siswa">Siswa</SelectItem>
                    <SelectItem value="pengurus">Pengurus Kelas</SelectItem>
                    <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-gender">Jenis Kelamin</Label>
                <Select
                  value={newGender}
                  onValueChange={(val) => setNewGender(val as "L" | "P" | "")}
                >
                  <SelectTrigger id="new-gender">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki (L)</SelectItem>
                    <SelectItem value="P">Perempuan (P)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-nis">NIS</Label>
                <Input
                  id="new-nis"
                  placeholder="242512..."
                  value={newNis}
                  onChange={(e) => setNewNis(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-absen">No. Absen</Label>
                <Input
                  id="new-absen"
                  type="number"
                  placeholder="1-36"
                  value={newAbsen}
                  onChange={(e) => setNewAbsen(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-jabatan">Jabatan</Label>
                <Input
                  id="new-jabatan"
                  placeholder="Ketua dll"
                  value={newJabatan}
                  onChange={(e) => setNewJabatan(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={handleCreateUser} disabled={isPending}>
              {isPending ? "Memproses..." : "Tambah Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui identitas akademik dan peran pengguna dalam portal kelas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {currentUserRole === "super_admin" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-role">Peran (Role)</Label>
                <Select
                  value={formRole}
                  onValueChange={(val) =>
                    setFormRole(val as "super_admin" | "wali_kelas" | "pengurus" | "siswa")
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="siswa">Siswa</SelectItem>
                    <SelectItem value="pengurus">Pengurus Kelas</SelectItem>
                    <SelectItem value="wali_kelas">Wali Kelas</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted">
                  Peran menentukan hak akses dashboard dan moderasi.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-nis">NIS</Label>
                <Input
                  id="edit-nis"
                  placeholder="Mis. 12345"
                  value={formNis}
                  onChange={(e) => setFormNis(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-absen">No. Absen</Label>
                <Input
                  id="edit-absen"
                  type="number"
                  placeholder="1-36"
                  value={formAbsen}
                  onChange={(e) => setFormAbsen(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-jabatan">Jabatan Kelas</Label>
                <Input
                  id="edit-jabatan"
                  placeholder="Ketua / Sekretaris..."
                  value={formJabatan}
                  onChange={(e) => setFormJabatan(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-gender">Jenis Kelamin</Label>
                <Select
                  value={formGender}
                  onValueChange={(val) => setFormGender(val as "L" | "P" | "")}
                >
                  <SelectTrigger id="edit-gender">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki (L)</SelectItem>
                    <SelectItem value="P">Perempuan (P)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus akun{" "}
              <span className="font-semibold text-foreground">{deletingUser?.fullName}</span>?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-3 gap-2">
            <Button variant="outline" onClick={() => setDeletingUser(null)} disabled={isPending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isPending}>
              {isPending ? "Menghapus..." : "Hapus Pengguna"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog
        open={Boolean(resettingUser)}
        onOpenChange={(open) => !open && setResettingUser(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi ke Default</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mereset kata sandi untuk{" "}
              <span className="font-semibold text-foreground">{resettingUser?.fullName}</span> ke
              kata sandi bawaan (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                Password123#
              </code>
              )?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-3 gap-2">
            <Button variant="outline" onClick={() => setResettingUser(null)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={handleResetPassword} disabled={isPending}>
              {isPending ? "Mereset..." : "Reset Kata Sandi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
