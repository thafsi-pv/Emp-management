import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import {
  Users, UserPlus, KeyRound, Trash2, Pencil, ShieldCheck, Eye, EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect } from '@/components/form/FormSelect';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

type Role = 'ADMIN' | 'ESTABLISHMENT_OFFICER' | 'PAYROLL_OFFICER' | 'SUPERVISOR' | 'MANAGEMENT' | 'DEPARTMENT_OFFICER' | 'EMPLOYEE';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  employeeId?: string;
  createdAt: string;
  employee?: { id: string; name: string; code: string; department?: { name: string } };
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Super Admin' },
  { value: 'ESTABLISHMENT_OFFICER', label: 'Establishment Officer' },
  { value: 'PAYROLL_OFFICER', label: 'Payroll Officer' },
  { value: 'SUPERVISOR', label: 'Supervisory Officer' },
  { value: 'MANAGEMENT', label: 'Management' },
  { value: 'DEPARTMENT_OFFICER', label: 'Department Officer' },
  { value: 'EMPLOYEE', label: 'Employee (Read-only)' },
];

const ROLE_BADGE_COLORS: Record<Role, string> = {
  ADMIN: 'bg-red-500/15 text-red-400 border-red-500/30',
  ESTABLISHMENT_OFFICER: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PAYROLL_OFFICER: 'bg-green-500/15 text-green-400 border-green-500/30',
  SUPERVISOR: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  MANAGEMENT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DEPARTMENT_OFFICER: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  EMPLOYEE: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const roleLabel = (r: Role) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;

type ModalMode = 'create' | 'edit' | 'password' | null;

export const UserManagement: React.FC = () => {
  const qc = useQueryClient();
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // Stores 10-digit number without +91 in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('ESTABLISHMENT_OFFICER');
  const [employeeId, setEmployeeId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { data: usersRes, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/api/users');
      return res.data;
    },
  });
  const users: User[] = usersRes || [];

  const { data: employees } = useQuery({
    queryKey: ['employees-for-user'],
    queryFn: async () => {
      const res = await apiClient.get('/api/employees?limit=500');
      return res.data?.data || [];
    },
  });

  const resetForm = () => {
    setName(''); setPhone(''); setEmail(''); setPassword(''); setRole('ESTABLISHMENT_OFFICER');
    setEmployeeId(''); setNewPassword(''); setFormError(null);
    setShowPassword(false); setShowNewPassword(false);
  };

  const openCreate = () => { resetForm(); setSelected(null); setModal('create'); };
  const openEdit = (u: User) => {
    setSelected(u);
    setName(u.name);
    // Strip +91 for UI editing
    const rawPhone = u.phone.startsWith('+91') ? u.phone.slice(3) : u.phone;
    setPhone(rawPhone);
    setEmail(u.email || '');
    setRole(u.role);
    setEmployeeId(u.employeeId || '');
    setFormError(null); setModal('edit');
  };
  const openPassword = (u: User) => {
    setSelected(u); setNewPassword(''); setFormError(null); setModal('password');
  };
  const closeModal = () => { setModal(null); resetForm(); setSelected(null); };

  const createMutation = useMutation({
    mutationFn: async () => {
      // Prepend +91 before saving
      const fullPhone = `+91${phone}`;
      const res = await apiClient.post('/api/users', {
        name,
        phone: fullPhone,
        email: email || undefined,
        password,
        role,
        ...(employeeId ? { employeeId } : {}),
      });
      return res.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const fullPhone = `+91${phone}`;
      const res = await apiClient.patch(`/api/users/${selected!.id}`, {
        name,
        phone: fullPhone,
        email: email || undefined,
        role,
        ...(employeeId ? { employeeId } : { employeeId: null }),
      });
      return res.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to update user'),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch(`/api/users/${selected!.id}/change-password`, { newPassword });
      return res.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); closeModal(); },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to change password'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/users/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name || !phone || !password) { setFormError('Name, mobile number and password are required'); return; }
    if (phone.length !== 10) { setFormError('Mobile number must be exactly 10 digits'); return; }
    if (password.length < 6) { setFormError('Password must be at least 6 characters'); return; }
    createMutation.mutate();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!phone) { setFormError('Mobile number is required'); return; }
    if (phone.length !== 10) { setFormError('Mobile number must be exactly 10 digits'); return; }
    updateMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setFormError(null);
    if (!newPassword || newPassword.length < 6) { setFormError('Password must be at least 6 characters'); return; }
    changePasswordMutation.mutate();
  };

  const handleDelete = (u: User) => {
    if (window.confirm(`Are you sure you want to delete user "${u.name}" (${u.phone})?`)) {
      deleteMutation.mutate(u.id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldCheck size={32} className="text-primary" />
            <div>
              <CardTitle>User Account Management</CardTitle>
              <CardDescription>
                Create, update, and manage system user accounts and their role-based access. Each user can log in with their Indian mobile number and password.
              </CardDescription>
            </div>
          </div>
          <Button onClick={openCreate} className="gap-2 shrink-0">
            <UserPlus size={16} /> Add User
          </Button>
        </CardHeader>
      </Card>

      {/* Default credentials info card */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <KeyRound size={18} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-400 mb-2">Default Seeded Login Credentials</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono text-muted-foreground">
                <span>9999999990 → <span className="text-foreground font-semibold">admin123</span> (Super Admin)</span>
                <span>9999999991 → <span className="text-foreground font-semibold">admin123</span> (Est. Officer)</span>
                <span>9999999992 → <span className="text-foreground font-semibold">admin123</span> (Payroll Officer)</span>
                <span>9999999993 → <span className="text-foreground font-semibold">admin123</span> (Management)</span>
                <span>9999999994 → <span className="text-foreground font-semibold">super123</span> (Supervisor)</span>
                <span>9876543210 → <span className="text-foreground font-semibold">emp123</span> (Employee)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile (Login)</TableHead>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Linked Employee</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      <Users className="mx-auto mb-3 opacity-30" size={36} />
                      No users found. Click "Add User" to create the first account.
                    </TableCell>
                  </TableRow>
                ) : users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/40">
                    <TableCell className="font-semibold">{u.name}</TableCell>
                    <TableCell className="text-sm font-mono text-primary font-bold">{u.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email || '—'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${ROLE_BADGE_COLORS[u.role]}`}>
                        {roleLabel(u.role)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.employee ? (
                        <span>{u.employee.code} — {u.employee.name}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => openEdit(u)}>
                          <Pencil size={13} /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-amber-400 hover:text-amber-300" onClick={() => openPassword(u)}>
                          <KeyRound size={13} /> Password
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive/80" onClick={() => handleDelete(u)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Create User Modal ── */}
      <Dialog open={modal === 'create'} onOpenChange={(o) => { if (!o) closeModal(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={18} /> Create New User Account
            </DialogTitle>
          </DialogHeader>
          {formError && (
            <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>
          )}
          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Full Name *" placeholder="User full name" value={name} onChange={(e) => setName(e.target.value)} required />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number (Login) *</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center pointer-events-none select-none font-mono text-sm text-muted-foreground border-r pr-2 gap-1">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    pattern="[0-9]{10}"
                    className="flex h-10 w-full rounded-lg border border-input bg-background pr-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ paddingLeft: '72px' }}
                    required
                  />
                </div>
              </div>

              <FormInput label="Email Address (Optional)" type="email" placeholder="user@hospital.in" value={email} onChange={(e) => setEmail(e.target.value)} />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Password * <span className="text-muted-foreground text-xs">(min. 6 chars)</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    placeholder="Set initial password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              
              <FormSelect
                label="System Role *"
                value={role}
                onValueChange={(v) => setRole(v as Role)}
                options={ROLE_OPTIONS}
              />
              <div className="sm:col-span-2">
                <FormSelect
                  label="Link to Employee (optional)"
                  value={employeeId || 'NONE'}
                  onValueChange={(v) => setEmployeeId(v === 'NONE' ? '' : v)}
                  options={[
                    { value: 'NONE', label: '— Not linked to an employee —' },
                    ...(employees || []).map((e: any) => ({ value: e.id, label: `${e.code} — ${e.name}` })),
                  ]}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create User Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Modal ── */}
      <Dialog open={modal === 'edit'} onOpenChange={(o) => { if (!o) closeModal(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={18} /> Edit User — {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {formError && (
            <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>
          )}
          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput label="Full Name *" value={name} onChange={(e) => setName(e.target.value)} required />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mobile Number (Login) *</label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center pointer-events-none select-none font-mono text-sm text-muted-foreground border-r pr-2 gap-1">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    pattern="[0-9]{10}"
                    className="flex h-10 w-full rounded-lg border border-input bg-background pr-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ paddingLeft: '72px' }}
                    required
                  />
                </div>
              </div>

              <FormInput label="Email Address (Optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              
              <FormSelect
                label="System Role *"
                value={role}
                onValueChange={(v) => setRole(v as Role)}
                options={ROLE_OPTIONS}
              />
              <div className="sm:col-span-2">
                <FormSelect
                  label="Link to Employee (optional)"
                  value={employeeId || 'NONE'}
                  onValueChange={(v) => setEmployeeId(v === 'NONE' ? '' : v)}
                  options={[
                    { value: 'NONE', label: '— Not linked to an employee —' },
                    ...(employees || []).map((e: any) => ({ value: e.id, label: `${e.code} — ${e.name}` })),
                  ]}
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Change Password Modal ── */}
      <Dialog open={modal === 'password'} onOpenChange={(o) => { if (!o) closeModal(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound size={18} className="text-amber-400" /> Reset Password — {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {formError && (
            <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password <span className="text-muted-foreground text-xs">(min. 6 chars)</span></label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 pr-10 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                The user will use this new password on their next login.
              </p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Update Password' : 'Update Password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default UserManagement;
