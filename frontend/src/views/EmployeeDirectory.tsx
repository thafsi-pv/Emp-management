import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { Search, UserPlus, Eye, Filter, User, LayoutGrid, TableProperties } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect } from '@/components/form/FormSelect';
import { FormDatePicker } from '@/components/form/FormDatePicker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface Employee {
  id: string;
  code: string;
  name: string;
  photo?: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'RESIGNED';
  department: { name: string };
  designation: { name: string };
  salary: number;
}

export const EmployeeDirectory: React.FC<{ onSelectEmployee?: (id: string) => void }> = ({ onSelectEmployee }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: employeesRes, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', search, deptFilter, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (deptFilter && deptFilter !== 'ALL') params.append('departmentId', deptFilter);
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '10'); // 10 per page
      const res = await apiClient.get(`/api/employees?${params.toString()}`);
      return res.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient.get('/api/departments');
      return res.data;
    },
  });

  const { data: designations } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => {
      const res = await apiClient.get('/api/designations');
      return res.data;
    },
  });
  const { data: sections } = useQuery({ queryKey: ['sections', departmentId], queryFn: async () => (await apiClient.get(`/api/sections${departmentId ? `?departmentId=${departmentId}` : ''}`)).data, enabled: !!departmentId });
  const { data: supervisors } = useQuery({ queryKey: ['supervisorOptions'], queryFn: async () => {
    try { return (await apiClient.get('/api/users/supervisors')).data; }
    catch { return (await apiClient.get('/api/users')).data.filter((user: any) => user.role === 'SUPERVISOR' && user.employee); }
  } });
  const supervisorOptions = Array.isArray(supervisors) ? supervisors : supervisors?.data || [];

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post('/api/employees', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create employee');
    },
  });

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setAddress('');
    setGender('MALE'); setDob(''); setJoiningDate('');
    setDepartmentId(''); setSectionId(''); setSupervisorId(''); setDesignationId('');
    setPhotoFile(null); setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!dob) { setFormError('Date of Birth is required'); return; }
    if (!joiningDate) { setFormError('Joining Date is required'); return; }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('address', address);
    formData.append('gender', gender);
    formData.append('dateOfBirth', dob);
    formData.append('joiningDate', joiningDate);
    formData.append('departmentId', departmentId);
    if (sectionId) formData.append('sectionId', sectionId);
    if (supervisorId) formData.append('supervisorId', supervisorId);
    formData.append('designationId', designationId);
    if (photoFile) formData.append('photo', photoFile);
    createMutation.mutate(formData);
  };

  const employees = employeesRes?.data || [];
  const meta = employeesRes?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const getStatusBadgeVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'TERMINATED': return 'destructive';
      case 'RESIGNED': return 'secondary';
      default: return 'outline';
    }
  };

  const statusLabel = (s: string) =>
    s === 'ACTIVE' ? 'Active' : s === 'TERMINATED' ? 'Terminated' : s === 'RESIGNED' ? 'Resigned' : 'On Leave';

  return (
    <div className="flex flex-col gap-6">
      {/* Filters & Controls */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, ID or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset page on search
              }}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={deptFilter || 'ALL'} onValueChange={(v) => { setDeptFilter(!v || v === 'ALL' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[168px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Departments</SelectItem>
                  {departments?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={statusFilter || 'ALL'} onValueChange={(v) => { setStatusFilter(!v || v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">On Leave</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
                <SelectItem value="RESIGNED">Resigned</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Switcher */}
            <div className="flex items-center border rounded-lg p-0.5 bg-muted/60">
              <Button
                type="button"
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <TableProperties className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === 'card' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5"
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
            </div>

            <Button onClick={() => setIsModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />Add Employee
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {employeesLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : employees.length > 0 ? (
        viewMode === 'table' ? (
          /* Table View (Default) */
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp: Employee) => (
                    <TableRow
                      key={emp.id}
                      className="cursor-pointer transition-colors hover:bg-muted/60"
                      onClick={() => onSelectEmployee ? onSelectEmployee(emp.id) : navigate(`/employees/${emp.id}`)}
                    >
                      <TableCell className="font-bold text-primary text-xs">{emp.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full overflow-hidden border bg-muted flex items-center justify-center shrink-0">
                            {emp.photo ? (
                              <img src={emp.photo} alt={emp.name} className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-none">{emp.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{emp.department?.name || '—'}</TableCell>
                      <TableCell className="text-sm">{emp.designation?.name || '—'}</TableCell>
                      <TableCell className="text-xs font-mono">{emp.phone}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(emp.status)} className="text-[10px] h-5">
                          {statusLabel(emp.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee ? onSelectEmployee(emp.id) : navigate(`/employees/${emp.id}`);
                          }}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          /* Card Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {employees.map((emp: Employee) => (
              <Card key={emp.id} className="flex flex-col justify-between">
                <CardContent className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl overflow-hidden border bg-muted flex items-center justify-center shrink-0">
                      {emp.photo
                        ? <img src={emp.photo} alt={emp.name} className="h-full w-full object-cover" />
                        : <User className="h-5 w-5 text-muted-foreground" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{emp.name}</p>
                      <p className="text-xs font-bold text-primary">{emp.code}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-muted-foreground">Designation</span>
                    <span className="font-medium text-right truncate">{emp.designation?.name || '—'}</span>
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium text-right truncate">{emp.department?.name || '—'}</span>
                    <span className="text-muted-foreground">Contact</span>
                    <span className="font-medium text-right">{emp.phone}</span>
                    <span className="text-muted-foreground">Status</span>
                    <span className="flex justify-end">
                      <Badge variant={getStatusBadgeVariant(emp.status)} className="text-[10px] h-5">
                        {statusLabel(emp.status)}
                      </Badge>
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => onSelectEmployee ? onSelectEmployee(emp.id) : navigate(`/employees/${emp.id}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <User className="h-12 w-12 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground text-sm">No employee records matched your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {!employeesLoading && employees.length > 0 && (
        <div className="flex items-center justify-between py-4">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{employees.length}</span> of <span className="font-medium">{meta.total}</span> employees
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <div className="text-sm font-medium px-2">
              Page {page} of {meta.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Employee Dialog */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Create Digital Employee Profile</DialogTitle>
          </DialogHeader>

          {formError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Employee ID/Code"
                value="Auto-generated on save"
                disabled
                readOnly
              />
              <FormInput
                label="Full Name *"
                placeholder="Full legal name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <FormInput
                label="Email Address *"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <FormInput
                label="Phone Number *"
                placeholder="+971 50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Residential Address *"
                  placeholder="Abu Dhabi, UAE"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <FormSelect
                label="Gender *"
                value={gender}
                onValueChange={setGender}
                options={[
                  { label: 'Male', value: 'MALE' },
                  { label: 'Female', value: 'FEMALE' },
                ]}
              />

              <FormDatePicker
                label="Date of Birth"
                value={dob}
                onChange={setDob}
                placeholder="Select date of birth"
                required
                fromYear={1950}
                toYear={new Date().getFullYear() - 18}
              />

              <FormSelect
                label="Department *"
                value={departmentId}
                onValueChange={(value) => { setDepartmentId(value); setSectionId(''); }}
                options={departments?.map((d: any) => ({ label: d.name, value: d.id })) || []}
                placeholder="Select Department"
              />

              <FormSelect
                label="Section"
                value={sectionId}
                onValueChange={setSectionId}
                options={(sections?.data || sections || []).map((s: any) => ({ label: s.name, value: s.id }))}
                placeholder={departmentId ? 'Select Section' : 'Select Department first'}
              />

              <FormSelect
                label="Reporting Supervisor"
                value={supervisorId}
                onValueChange={setSupervisorId}
                options={supervisorOptions.map((item: any) => {
                  const employee = item.employee || item;
                  return { label: `${employee.name} (${employee.code})`, value: employee.id };
                })}
                placeholder="Select Supervisor (optional)"
              />

              <FormSelect
                label="Designation *"
                value={designationId}
                onValueChange={setDesignationId}
                options={designations?.map((d: any) => ({ label: d.name, value: d.id })) || []}
                placeholder="Select Designation"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Basic Pay</label>
                <div className="h-10 rounded-md border bg-muted/40 px-3 flex items-center text-sm">
                  {designationId ? `₹ ${designations?.find((d: any) => d.id === designationId)?.basicPay ?? 0} — taken from the selected designation` : 'Select a designation first'}
                </div>
              </div>

              <FormDatePicker
                label="Joining Date"
                value={joiningDate}
                onChange={setJoiningDate}
                placeholder="Select joining date"
                required
                fromYear={2000}
                toYear={new Date().getFullYear() + 1}
              />

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium">Profile Photo</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Registering...' : 'Create Profile'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
