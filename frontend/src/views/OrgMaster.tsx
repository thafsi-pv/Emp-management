import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuth } from '../context/SimulatedAuthContext';
import { Building2, Tag, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';

// Shadcn Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/* ─── Types ─────────────────────────────────────────── */
interface Department {
  id: string;
  name: string;
  code: string;
  _count?: { employees: number };
}

interface Designation {
  id: string;
  name: string;
  code: string;
  payType: 'DAILY' | 'MONTHLY';
  basicPay: number;
  weightage: number;
  allowance: number;
  otRate: number;
  _count?: { employees: number };
}

/* ─── Component ──────────────────────────────────────── */
export const OrgMaster: React.FC = () => {
  const { simulatedRole } = useAuth();
  const isAdmin = simulatedRole === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <ShieldAlert size={48} className="text-destructive" />
        <h3 className="text-xl font-bold">Access Restricted</h3>
        <p className="text-muted-foreground">This page is only accessible to Super Admins.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <DepartmentsPanel />
      <DesignationsPanel />
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   DEPARTMENTS PANEL
══════════════════════════════════════════════════════ */
const DepartmentsPanel: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.get('/api/departments').then((r) => r.data),
  });

  const departments: Department[] = res?.data || res || [];

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string; code: string }) =>
      editId
        ? apiClient.patch(`/api/departments/${editId}`, payload)
        : apiClient.post('/api/departments', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      closeForm();
    },
    onError: (e: any) => setErr(e.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/departments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
    onError: (e: any) => alert(e.response?.data?.message || 'Delete failed'),
  });

  const openAdd = () => { setEditId(null); setName(''); setCode(''); setErr(null); setShowForm(true); };
  const openEdit = (d: Department) => { setEditId(d.id); setName(d.name); setCode(d.code); setErr(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditId(null); setName(''); setCode(''); setErr(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ name: name.trim(), code: code.trim().toUpperCase() });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Building2 className="text-secondary-foreground" size={24} />
          <div>
            <CardTitle className="text-lg">Departments</CardTitle>
            <CardDescription>Manage all company departments</CardDescription>
          </div>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Department
        </Button>
      </CardHeader>
      
      {showForm && (
        <div className="p-6 bg-muted/30 border-b">
          <h4 className="font-semibold mb-4">{editId ? 'Edit Department' : 'New Department'}</h4>
          {err && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Department Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Operations"
                required
              />
            </div>
            <div className="space-y-2 w-[140px]">
              <Label>Code *</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. OPS"
                maxLength={10}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : departments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d, i) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell><Badge variant="outline">{d.code}</Badge></TableCell>
                  <TableCell>{d._count?.employees ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm(`Delete "${d.name}"?`)) deleteMutation.mutate(d.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Building2 size={36} className="mb-4 opacity-50" />
            <p>No departments yet. Create one above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/* ══════════════════════════════════════════════════════
   DESIGNATIONS PANEL
══════════════════════════════════════════════════════ */
const DesignationsPanel: React.FC = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [payType, setPayType] = useState<'DAILY' | 'MONTHLY'>('MONTHLY');
  const [basicPay, setBasicPay] = useState('');
  const [weightage, setWeightage] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [otRate, setOtRate] = useState('0');
  const [err, setErr] = useState<string | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: () => apiClient.get('/api/designations').then((r) => r.data),
  });

  const designations: Designation[] = res?.data || res || [];

  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      editId
        ? apiClient.patch(`/api/designations/${editId}`, payload)
        : apiClient.post('/api/designations', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] });
      closeForm();
    },
    onError: (e: any) => setErr(e.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/designations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['designations'] }),
    onError: (e: any) => alert(e.response?.data?.message || 'Delete failed'),
  });

  const openAdd = () => {
    setEditId(null); setName(''); setCode(''); setPayType('MONTHLY');
    setBasicPay(''); setWeightage('0'); setAllowance('0'); setOtRate('0');
    setErr(null); setShowForm(true);
  };
  const openEdit = (d: Designation) => {
    setEditId(d.id); setName(d.name); setCode(d.code); setPayType(d.payType);
    setBasicPay(String(d.basicPay)); setWeightage(String(d.weightage));
    setAllowance(String(d.allowance)); setOtRate(String(d.otRate));
    setErr(null); setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false); setEditId(null); setName(''); setCode(''); setErr(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      payType,
      basicPay: parseFloat(basicPay) || 0,
      weightage: parseFloat(weightage) || 0,
      allowance: parseFloat(allowance) || 0,
      otRate: parseFloat(otRate) || 0,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Tag className="text-primary" size={24} />
          <div>
            <CardTitle className="text-lg">Designations & Pay Grades</CardTitle>
            <CardDescription>Configure designation-wise pay structures</CardDescription>
          </div>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Designation
        </Button>
      </CardHeader>

      {showForm && (
        <div className="p-6 bg-muted/30 border-b">
          <h4 className="font-semibold mb-4">{editId ? 'Edit Designation' : 'New Designation'}</h4>
          {err && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Designation Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Security Guard" required />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SECG" maxLength={10} required />
              </div>
              <div className="space-y-2">
                <Label>Pay Type *</Label>
                <Select value={payType} onValueChange={(v) => setPayType((v as any) || 'MONTHLY')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="DAILY">Daily Wage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Basic Pay (₹)</Label>
                <Input type="number" step="0.01" value={basicPay} onChange={(e) => setBasicPay(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Weightage (₹)</Label>
                <Input type="number" step="0.01" value={weightage} onChange={(e) => setWeightage(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Allowance (₹)</Label>
                <Input type="number" step="0.01" value={allowance} onChange={(e) => setAllowance(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>OT Rate / hr</Label>
                <Input type="number" step="0.01" value={otRate} onChange={(e) => setOtRate(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : editId ? 'Update' : 'Create'}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : designations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Pay Type</TableHead>
                <TableHead>Basic Pay</TableHead>
                <TableHead>Weightage</TableHead>
                <TableHead>Allowance</TableHead>
                <TableHead>OT Rate</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations.map((d, i) => (
                <TableRow key={d.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell><Badge variant="outline">{d.code}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={d.payType === 'DAILY' ? 'secondary' : 'default'}>
                      {d.payType}
                    </Badge>
                  </TableCell>
                  <TableCell>₹ {d.basicPay.toLocaleString()}</TableCell>
                  <TableCell>₹ {d.weightage.toLocaleString()}</TableCell>
                  <TableCell>₹ {d.allowance.toLocaleString()}</TableCell>
                  <TableCell>₹ {d.otRate}/hr</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm(`Delete "${d.name}"?`)) deleteMutation.mutate(d.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Tag size={36} className="mb-4 opacity-50" />
            <p>No designations yet. Create one above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
