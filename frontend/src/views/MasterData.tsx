import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, X } from 'lucide-react';
import apiClient from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type MasterKind = 'departments' | 'sections' | 'designations';
type MasterItem = { id: string; name: string; code: string; departmentId?: string; department?: { name: string }; payType?: 'DAILY' | 'MONTHLY'; basicPay?: number; weightage?: number; allowance?: number; otRate?: number };

export const MasterData: React.FC<{ kind: MasterKind }> = ({ kind }) => {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [payType, setPayType] = useState<'DAILY' | 'MONTHLY'>('MONTHLY');
  const [basicPay, setBasicPay] = useState('0');
  const [weightage, setWeightage] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [otRate, setOtRate] = useState('0');
  const [editing, setEditing] = useState<MasterItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({ queryKey: [kind], queryFn: async () => (await apiClient.get(`/api/${kind}`)).data });
  const { data: departmentsData } = useQuery({ queryKey: ['departments'], queryFn: async () => (await apiClient.get('/api/departments')).data, enabled: kind === 'sections' });
  const items: MasterItem[] = data?.data || data || [];
  const departments: MasterItem[] = departmentsData?.data || departmentsData || [];
  const label = kind === 'departments' ? 'Department' : kind === 'sections' ? 'Section' : 'Designation';
  const supportsEdit = true;

  const resetForm = () => { setName(''); setCode(''); setDepartmentId(''); setPayType('MONTHLY'); setBasicPay('0'); setWeightage('0'); setAllowance('0'); setOtRate('0'); setEditing(null); setError(null); };
  const save = useMutation({
    mutationFn: () => {
      const payload = kind === 'sections' ? { name: name.trim(), code: code.trim().toUpperCase(), departmentId } : kind === 'designations' ? { name: name.trim(), code: code.trim().toUpperCase(), payType, basicPay: Number(basicPay) || 0, weightage: Number(weightage) || 0, allowance: Number(allowance) || 0, otRate: Number(otRate) || 0 } : { name: name.trim(), code: code.trim().toUpperCase() };
      if (editing) return apiClient.patch(`/api/${kind}/${editing.id}`, payload);
      return apiClient.post(`/api/${kind}`, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [kind] }); resetForm(); },
    onError: (e: any) => setError(e.response?.data?.message || `Could not save ${label.toLowerCase()}.`),
  });
  const startEdit = (item: MasterItem) => {
    setEditing(item); setName(item.name); setCode(item.code); setDepartmentId(item.departmentId || ''); setPayType(item.payType || 'MONTHLY'); setBasicPay(String(item.basicPay ?? 0)); setWeightage(String(item.weightage ?? 0)); setAllowance(String(item.allowance ?? 0)); setOtRate(String(item.otRate ?? 0)); setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <div className="flex flex-col gap-6">
    <Card><CardHeader><CardTitle>{editing ? `Edit ${label}` : `${label} Master`}</CardTitle><CardDescription>{editing ? `Update the selected ${label.toLowerCase()} and save the changes.` : `Create and manage company ${kind}.`}</CardDescription></CardHeader><CardContent>
      <form onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate(); }} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div><label className="text-sm">Name *</label><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder={`e.g. ${kind === 'departments' ? 'Operations' : kind === 'designations' ? 'Field Officer' : 'North Zone'}`} /></div>
        <div><label className="text-sm">Code *</label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required placeholder={kind === 'designations' ? 'FIELD-OFF' : 'OPS'} /></div>
        {kind === 'sections' && <div><label className="text-sm">Department *</label><Select value={departmentId} onValueChange={(value) => setDepartmentId(value || '')}><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>}
        {kind === 'designations' && <><div><label className="text-sm">Pay Type *</label><Select value={payType} onValueChange={(value) => setPayType(value as 'DAILY' | 'MONTHLY')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MONTHLY">Monthly</SelectItem><SelectItem value="DAILY">Daily wage</SelectItem></SelectContent></Select></div><div><label className="text-sm">Basic Pay (₹) *</label><Input type="number" min="0" step="0.01" value={basicPay} onChange={(e) => setBasicPay(e.target.value)} required /></div><div><label className="text-sm">Weightage (₹)</label><Input type="number" min="0" step="0.01" value={weightage} onChange={(e) => setWeightage(e.target.value)} /></div><div><label className="text-sm">Allowance (₹)</label><Input type="number" min="0" step="0.01" value={allowance} onChange={(e) => setAllowance(e.target.value)} /></div><div><label className="text-sm">OT Rate / hour (₹)</label><Input type="number" min="0" step="0.01" value={otRate} onChange={(e) => setOtRate(e.target.value)} /></div></>}
        <div className="flex gap-2"><Button type="submit" disabled={save.isPending || (kind === 'sections' && !departmentId)}>{save.isPending ? 'Saving…' : editing ? `Save ${label}` : `Add ${label}`}</Button>{editing && <Button type="button" variant="outline" onClick={resetForm}><X className="mr-1 h-4 w-4" />Cancel</Button>}</div>
      </form>{error && <p className="mt-3 text-sm text-destructive">{Array.isArray(error) ? error.join(', ') : error}</p>}
    </CardContent></Card>
    <Card><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead>{kind === 'sections' && <TableHead>Department</TableHead>}{kind === 'designations' && <><TableHead>Pay Type</TableHead><TableHead>Basic Pay</TableHead><TableHead>Weightage</TableHead><TableHead>Allowance</TableHead><TableHead>OT Rate/hr</TableHead></>}{supportsEdit && <TableHead className="text-right">Actions</TableHead>}</TableRow></TableHeader><TableBody>
      {items.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.code}</TableCell>{kind === 'sections' && <TableCell>{item.department?.name || '—'}</TableCell>}{kind === 'designations' && <><TableCell>{item.payType || 'MONTHLY'}</TableCell><TableCell>₹ {item.basicPay ?? 0}</TableCell><TableCell>₹ {item.weightage ?? 0}</TableCell><TableCell>₹ {item.allowance ?? 0}</TableCell><TableCell>₹ {item.otRate ?? 0}</TableCell></>}{supportsEdit && <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => startEdit(item)}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button></TableCell>}</TableRow>)}
      {!items.length && <TableRow><TableCell colSpan={supportsEdit ? 6 : 5} className="text-center py-10 text-muted-foreground">No {kind} created yet.</TableCell></TableRow>}
    </TableBody></Table></CardContent></Card>
  </div>;
};
