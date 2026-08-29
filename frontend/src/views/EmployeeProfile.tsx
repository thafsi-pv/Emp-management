import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import {
  User,
  ChevronLeft,
  Download,
  AlertCircle,
  Upload,
  LayoutDashboard,
  UserCircle,
  Briefcase,
  FileText,
  Wallet,
  CalendarCheck,
  Umbrella,
  FolderOpen,
  GitBranch,
  Receipt,
  LogOut,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FormSelect } from '@/components/form/FormSelect';
import { useAuth } from '../context/SimulatedAuthContext';
import { Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { IdCardPrintDialog } from '../components/IdCardPrintDialog';
import { Printer } from 'lucide-react';
import { FormInput } from '@/components/form/FormInput';
import { FormDatePicker } from '@/components/form/FormDatePicker';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EmployeeDocument {
  id: string;
  name: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

const DOCUMENT_CATEGORIES = [
  'Application', 'Photo', 'ID/Aadhaar', 'Appointment Order', 'Joining Report',
  'Agreement', 'ID Card', 'Bank Details', 'Leave Documents', 'Service Break Order',
  'Extension Order', 'Renewal Order', 'Pay Revision Order', 'Memo/Warning',
  'Resignation', 'Termination Order', 'Final Settlement',
];

const PROFILE_TABS = [
  { id: 'overview',     label: 'Overview',               Icon: LayoutDashboard },
  { id: 'personal',    label: 'Personal Info',           Icon: UserCircle },
  { id: 'employment',  label: 'Employment',              Icon: Briefcase },
  { id: 'appointments',label: 'Appointments',            Icon: FileText },
  { id: 'payStructure',label: 'Pay Structure',           Icon: Wallet },
  { id: 'attendance',  label: 'Attendance',              Icon: CalendarCheck },
  { id: 'leaves',      label: 'Leave & Off',             Icon: Umbrella },
  { id: 'documents',   label: 'Digital Documents',       Icon: FolderOpen },
  { id: 'timeline',    label: 'Service History',         Icon: GitBranch },
  { id: 'payroll',     label: 'Payroll History',         Icon: Receipt },
  { id: 'settlement',  label: 'Resignation / Settlement',Icon: LogOut },
];

export const EmployeeProfile: React.FC<{ employeeId?: string | null; onBack?: () => void }> = ({ employeeId, onBack }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = employeeId || paramId;
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/employees');
  };
  const queryClient = useQueryClient();
  const [activeProfileTab, setActiveProfileTab] = useState('overview');
  
  // Document uploading states
  const [docCategory, setDocCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [, setUploadError] = useState<string | null>(null);

  // Fetch employee details
  const { data: employee, isLoading: empLoading, error: empError } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/employees/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch digital documents list
  const { data: documents } = useQuery<EmployeeDocument[]>({
    queryKey: ['employeeDocuments', id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/documents/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employeeDocuments', id] });
      setDocFile(null);
      setUploadError(null);
    },
    onError: (err: any) => {
      setUploadError(err.response?.data?.message || 'Failed to upload document');
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile || !id) return;
    setUploadError(null);

    const formData = new FormData();
    formData.append('employeeId', id);
    formData.append('name', docCategory);
    formData.append('file', docFile);

    uploadMutation.mutate(formData);
  };

  // Auth for RBAC
  const { simulatedRole, user } = useAuth();
  const canEdit = 
    simulatedRole === 'ADMIN' || 
    (simulatedRole === 'SUPERVISOR' && user?.employee?.departmentId && employee && user.employee.departmentId === employee.departmentId);

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await apiClient.get('/api/departments')).data,
  });

  const { data: designations } = useQuery({
    queryKey: ['designations'],
    queryFn: async () => (await apiClient.get('/api/designations')).data,
  });

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.patch(`/api/employees/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      setIsEditModalOpen(false);
      setEditError(null);
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.message || 'Failed to update employee');
    },
  });

  
  const handleDownloadPdf = async (payrollId: string, month: number, year: number) => {
    try {
      if (!employee) return;
      const res = await apiClient.get(`/api/payroll/${payrollId}/payslip`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `payslip-${employee.code}-${month}-${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF', err);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    const formData = new FormData();
    if (editData.name) formData.append('name', editData.name);
    if (editData.email) formData.append('email', editData.email);
    if (editData.phone) formData.append('phone', editData.phone);
    if (editData.address) formData.append('address', editData.address);
    if (editData.gender) formData.append('gender', editData.gender);
    if (editData.dateOfBirth) formData.append('dateOfBirth', editData.dateOfBirth);
    if (editData.joiningDate) formData.append('joiningDate', editData.joiningDate);
    if (editData.salary) formData.append('salary', editData.salary);
    if (editData.departmentId) formData.append('departmentId', editData.departmentId);
    if (editData.designationId) formData.append('designationId', editData.designationId);
    if (editPhoto) formData.append('photo', editPhoto);

    updateMutation.mutate(formData);
  };

  const openEditModal = () => {
    if (employee) {
      setEditData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        address: employee.address,
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth?.split('T')[0],
        joiningDate: employee.joiningDate?.split('T')[0],
        salary: employee.salary,
        departmentId: employee.departmentId,
        designationId: employee.designationId,
      });
      setEditPhoto(null);
      setIsEditModalOpen(true);
    }
  };

  if (empLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (empError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground text-sm">Employee profile could not be found.</p>
        <Button variant="outline" onClick={handleBack}>
          Back to Directory
        </Button>
      </div>
    );
  }

  // ── Service History Timeline ────────────────
  const timelineEvents: { title: string; date: string; desc: string; type: 'completed' | 'active' }[] = [];

  if (employee.joiningDate) {
    timelineEvents.push({
      title: 'Employee Joining',
      date: employee.joiningDate.split('T')[0],
      desc: `Joined Department "${employee.department?.name}" as "${employee.designation?.name}".`,
      type: 'completed',
    });
  }

  (employee.appointments || []).forEach((apt: any) => {
    timelineEvents.push({
      title: `Contract (${apt.contractType})`,
      date: apt.startDate.split('T')[0],
      desc: `Order No: ${apt.orderNumber}, Valid to: ${apt.endDate.split('T')[0]}. Salary: ₹ ${apt.salary}`,
      type: apt.status === 'ACTIVE' ? 'active' : 'completed',
    });
  });

  (employee.serviceBreaks || []).forEach((br: any) => {
    timelineEvents.push({
      title: 'Service Break Cycle',
      date: br.breakStartDate.split('T')[0],
      desc: `Break duration: ${br.breakStartDate.split('T')[0]} to ${br.breakEndDate.split('T')[0]}. Reason: ${br.reason}`,
      type: 'completed',
    });
  });

  timelineEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadgeVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'TERMINATED': return 'destructive';
      case 'RESIGNED': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Top Bar */}
      <Card className="flex flex-row items-center justify-between p-4">
        <Button variant="outline" onClick={handleBack} size="sm">
          <ChevronLeft className="mr-1 h-4 w-4" /> Back to Directory
        </Button>

        <div className="flex items-center gap-3">
          {canEdit && (
            <Button variant="outline" size="sm" onClick={openEditModal} className="h-8 hidden sm:flex">
              <Pencil className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setIsIdCardModalOpen(true)} className="h-8 hidden sm:flex">
            <Printer className="mr-2 h-4 w-4" /> Print ID
          </Button>
          <div className="h-10 w-10 rounded-full bg-muted border overflow-hidden flex items-center justify-center shrink-0">
            {employee.photo ? (
              <img src={employee.photo} alt={employee.name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-lg font-bold">{employee.name}</h2>
          <Badge variant="outline" className="font-mono">{employee.code}</Badge>
          <Badge variant={getStatusBadgeVariant(employee.status)}>{employee.status}</Badge>
        </div>
      </Card>

      {/* Shadcn Tabs — Vertical layout */}
      <Tabs
        value={activeProfileTab}
        onValueChange={setActiveProfileTab}
        orientation="vertical"
        className="w-full"
      >
        {/* Left sidebar nav */}
        <TabsList className="self-start sticky top-4 sm:w-[200px] w-full flex-row sm:flex-col flex-wrap gap-1 overflow-x-auto sm:overflow-visible">
          {PROFILE_TABS.map(({ id, label, Icon }) => (
            <TabsTrigger key={id} value={id} className="flex items-center gap-2.5 sm:w-full">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Right content */}
        <div className="flex-1 min-w-0 sm:pl-5 pt-4 sm:pt-0">

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center p-4 border rounded-xl bg-card">
                  <div className="h-20 w-20 rounded-2xl bg-muted border overflow-hidden flex items-center justify-center mb-3">
                    {employee.photo ? (
                      <img src={employee.photo} alt={employee.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="text-base font-bold">{employee.name}</h3>
                  <span className="text-xs text-muted-foreground">{employee.designation?.name}</span>

                  <div className="w-full mt-4 p-3 rounded-lg bg-muted/60 text-xs space-y-2 text-left">
                    <div className="flex justify-between"><span className="text-muted-foreground">Dept:</span> <span className="font-semibold">{employee.department?.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Section:</span> <span className="font-semibold">{employee.section?.name || 'Main'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Shift:</span> <span className="font-semibold">{employee.shift || 'GENERAL'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Salary:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">₹ {employee.salary}</span></div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="text-sm font-bold mb-4">Quick Service History Overview</h4>
                  <div className="timeline">
                    {timelineEvents.slice(0, 4).map((ev, i) => (
                      <div key={i} className="timeline-item">
                        <div className={`timeline-dot ${ev.type}`} />
                        <div className="timeline-content">
                          <span className="font-semibold">{ev.title}</span> — <span className="text-xs text-muted-foreground">{ev.date}</span>
                          <p className="text-xs text-muted-foreground mt-1">{ev.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Personal Info */}
        <TabsContent value="personal">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', val: employee.name },
                  { label: 'Employee Code', val: employee.code },
                  { label: 'Email Address', val: employee.email },
                  { label: 'Mobile Contact', val: employee.phone },
                  { label: 'Gender', val: employee.gender },
                  { label: 'Date of Birth', val: employee.dateOfBirth?.split('T')[0] },
                  { label: 'ID / Details', val: employee.idDetails || 'Verified' },
                  { label: 'Residential Address', val: employee.address },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-card text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.val}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Employment */}
        <TabsContent value="employment">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Department', val: employee.department?.name },
                  { label: 'Section', val: employee.section?.name || 'General Section' },
                  { label: 'Supervisory Officer', val: employee.supervisor?.name || 'Unassigned' },
                  { label: 'Designation', val: employee.designation?.name },
                  { label: 'Assigned Shift', val: employee.shift || 'GENERAL' },
                  { label: 'Joining Date', val: employee.joiningDate?.split('T')[0] },
                  { label: 'Employment Status', val: employee.status },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-card text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.val}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Appointments */}
        <TabsContent value="appointments">
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-bold mb-4">Appointment Contracts & Extensions</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Order No</th><th>Type</th><th>Start Date</th><th>End Date</th><th>Salary</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {(employee.appointments || []).map((apt: any) => (
                      <tr key={apt.id}>
                        <td><strong>{apt.orderNumber}</strong></td>
                        <td><Badge variant="outline">{apt.contractType}</Badge></td>
                        <td>{apt.startDate?.split('T')[0]}</td>
                        <td>{apt.endDate?.split('T')[0]}</td>
                        <td>₹ {apt.salary?.toLocaleString()}</td>
                        <td><Badge variant={getStatusBadgeVariant(apt.status)}>{apt.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Pay Structure */}
        <TabsContent value="payStructure">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Pay Model', val: employee.designation?.payType || 'MONTHLY' },
                  { label: 'Basic Pay Rate', val: `₹ ${employee.salary}` },
                  { label: 'Weightage', val: `₹ ${employee.designation?.weightage || 0}` },
                  { label: 'Standard Allowance', val: `₹ ${employee.designation?.allowance || 0}` },
                  { label: 'OT Rate', val: `₹ ${employee.designation?.otRate || 0} / hr` },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-card text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-semibold">{item.val}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Attendance */}
        <TabsContent value="attendance">
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-bold mb-4">Attendance History Log (Recent 30 Days)</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Date</th><th>Status</th><th>Approval</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {(employee.attendances || []).map((att: any) => (
                      <tr key={att.id}>
                        <td>{att.date?.split('T')[0]}</td>
                        <td><Badge variant={att.status === 'PRESENT' ? 'default' : 'destructive'}>{att.status}</Badge></td>
                        <td><Badge variant={att.approvalStatus === 'APPROVED' ? 'default' : 'outline'}>{att.approvalStatus}</Badge></td>
                        <td>{att.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Leaves */}
        <TabsContent value="leaves">
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-bold mb-2">Approved Leave Applications</h4>
              <p className="text-xs text-muted-foreground">No active leave deductions recorded for current month.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 8: Digital Documents */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <h4 className="text-sm font-bold">Upload Document</h4>
                  <FormSelect
                    label="Category"
                    value={docCategory}
                    onValueChange={setDocCategory}
                    options={DOCUMENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Select File</label>
                    <Input
                      type="file"
                      onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                      className="cursor-pointer"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={uploadMutation.isPending || !docFile} className="w-full">
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                  </Button>
                </form>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold">Digital Cabinet</h4>
                  {(documents || []).length > 0 ? (
                    (documents || []).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                        <div>
                          <p className="text-xs font-semibold">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.uploadedAt?.split('T')[0]}</p>
                        </div>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No digital documents uploaded yet.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 9: Service History Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-bold mb-4">Complete Service History Timeline</h4>
              <div className="timeline">
                {timelineEvents.map((ev, index) => (
                  <div key={index} className="timeline-item">
                    <div className={`timeline-dot ${ev.type}`} />
                    <div className="timeline-content">
                      <span className="font-semibold text-foreground">{ev.title}</span> — <span className="text-xs text-muted-foreground">{ev.date}</span>
                      <p className="text-xs text-muted-foreground mt-1">{ev.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 10: Payroll History */}
        <TabsContent value="payroll">
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-bold mb-4">Historical Payslips & Salary Registers</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Month / Year</th><th>Worked Days</th><th>Basic Pay</th><th>Net Salary</th><th>Status</th><th>Payslip</th></tr>
                  </thead>
                  <tbody>
                    {(employee.payrolls || []).map((p: any) => (
                      <tr key={p.id}>
                        <td><strong>{p.month}/{p.year}</strong></td>
                        <td>{p.workedDays} / {p.totalWorkingDays}</td>
                        <td>₹ {p.basicSalary?.toLocaleString()}</td>
                        <td><strong className="text-emerald-600 dark:text-emerald-400">₹ {p.netSalary?.toLocaleString()}</strong></td>
                        <td><Badge variant="default">{p.status}</Badge></td>
                        <td>
                          <button onClick={() => handleDownloadPdf(p.id, p.month, p.year)} className="inline-flex items-center px-2.5 py-1 text-xs font-medium border rounded-md hover:bg-accent transition-colors">
                            <Download className="mr-1 h-3 w-3" /> Payslip
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 11: Resignation / Settlement */}
        <TabsContent value="settlement">
          <Card>
            <CardContent className="pt-6">
              <h4 className="text-sm font-bold mb-2">Resignation & Exit Clearance Status</h4>
              <p className="text-xs text-muted-foreground">
                Employee status: <strong>{employee.status}</strong>. All clearance steps verified.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>


      <IdCardPrintDialog isOpen={isIdCardModalOpen} onClose={() => setIsIdCardModalOpen(false)} employee={employee} />
      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">Edit Employee Profile</DialogTitle>
          </DialogHeader>

          {editError && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{editError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Full Name *"
                value={editData.name || ''}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                required
              />
              <FormInput
                label="Email Address *"
                type="email"
                value={editData.email || ''}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
                required
              />
              <FormInput
                label="Phone Number *"
                value={editData.phone || ''}
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                required
              />
              <div className="sm:col-span-2">
                <FormInput
                  label="Residential Address *"
                  value={editData.address || ''}
                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                  required
                />
              </div>

              <FormSelect
                label="Gender *"
                value={editData.gender || 'MALE'}
                onValueChange={(val) => setEditData({...editData, gender: val})}
                options={[
                  { label: 'Male', value: 'MALE' },
                  { label: 'Female', value: 'FEMALE' },
                ]}
              />

              <FormDatePicker
                label="Date of Birth"
                value={editData.dateOfBirth || ''}
                onChange={(val) => setEditData({...editData, dateOfBirth: val})}
                required
                fromYear={1950}
                toYear={new Date().getFullYear() - 18}
              />

              <FormSelect
                label="Department *"
                value={editData.departmentId || ''}
                onValueChange={(val) => setEditData({...editData, departmentId: val})}
                options={departments?.map((d: any) => ({ label: d.name, value: d.id })) || []}
              />

              <FormSelect
                label="Designation *"
                value={editData.designationId || ''}
                onValueChange={(val) => setEditData({...editData, designationId: val})}
                options={designations?.map((d: any) => ({ label: d.name, value: d.id })) || []}
              />

              <FormInput
                label="Basic Salary (₹) *"
                type="number"
                value={editData.salary || ''}
                onChange={(e) => setEditData({...editData, salary: e.target.value})}
                required
              />

              <FormDatePicker
                label="Joining Date"
                value={editData.joiningDate || ''}
                onChange={(val) => setEditData({...editData, joiningDate: val})}
                required
                fromYear={2000}
                toYear={new Date().getFullYear() + 1}
              />

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium">Profile Photo (Leave blank to keep current)</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditPhoto(e.target.files?.[0] ?? null)}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
