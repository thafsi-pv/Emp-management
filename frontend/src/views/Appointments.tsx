import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Briefcase, Plus, Printer, Download, Link2 } from 'lucide-react';

interface AppointmentRecord {
  id: string;
  orderNumber: string;
  contractType: 'DAYS_89' | 'DAYS_178' | 'ONE_YEAR' | 'EXTENSION' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'CUSTOM';
  startDate: string;
  endDate: string;
  salary: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';
  employee: {
    id: string;
    name: string;
    code: string;
  };
  department: { name: string };
  section?: { name: string };
  designation: { name: string };
  previousAppointment?: { orderNumber: string; endDate: string };
}

export const Appointments: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [contractType, setContractType] = useState<string>('DAYS_89');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [salary, setSalary] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [previousAppointmentId, setPreviousAppointmentId] = useState('');
  const [terms, setTerms] = useState('Standard employment contract terms applied.');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch appointments list
  const { data: appointmentsRes, isLoading } = useQuery({
    queryKey: ['appointmentsList'],
    queryFn: async () => {
      const res = await apiClient.get('/api/appointments?limit=100');
      return res.data;
    },
  });

  // Fetch active employees
  const { data: employeesRes } = useQuery({
    queryKey: ['employeesForAppointments'],
    queryFn: async () => {
      const res = await apiClient.get('/api/employees?limit=200');
      return res.data;
    },
  });

  // Fetch departments, sections & designations
  const { data: deptRes } = useQuery({ queryKey: ['departments'], queryFn: async () => (await apiClient.get('/api/departments')).data });
  const { data: desigRes } = useQuery({ queryKey: ['designations'], queryFn: async () => (await apiClient.get('/api/designations')).data });

  // Automatic End Date Calculator
  const handleTypeOrDateChange = (type: string, start: string) => {
    if (!start) return;
    const sDate = new Date(start);
    const computed = new Date(start);

    if (type === 'DAYS_89' || type === 'THREE_MONTHS') {
      computed.setDate(sDate.getDate() + 88);
    } else if (type === 'DAYS_178' || type === 'SIX_MONTHS') {
      computed.setDate(sDate.getDate() + 177);
    } else if (type === 'ONE_YEAR') {
      computed.setDate(sDate.getDate() + 364);
    }
    setEndDate(computed.toISOString().split('T')[0]);
  };

  // Create appointment mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/api/appointments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointmentsList'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to issue appointment order');
    },
  });

  const handlePrintPdf = async (aptId: string) => {
    try {
      const res = await apiClient.get(`/api/appointments/${aptId}/pdf`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }, 10000);
      };
    } catch (err) {
      console.error('Failed to print PDF', err);
    }
  };

  const handleDownloadPdf = async (aptId: string, orderNumber: string) => {
    try {
      const res = await apiClient.get(`/api/appointments/${aptId}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `appointment-${orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF', err);
    }
  };

  const resetForm = () => {
    setEmployeeId('');
    setOrderNumber('');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setContractType('DAYS_89');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setSalary('');
    setDepartmentId('');
    setSectionId('');
    setDesignationId('');
    setPreviousAppointmentId('');
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      employeeId,
      orderNumber,
      orderDate,
      contractType,
      startDate,
      endDate,
      salary: parseFloat(salary),
      departmentId,
      sectionId: sectionId || undefined,
      designationId,
      previousAppointmentId: previousAppointmentId || undefined,
      termsAndConditions: terms,
    });
  };

  const appointments: AppointmentRecord[] = appointmentsRes?.data || [];
  const employees = employeesRes?.data || [];
  const departments = deptRes?.data || [];
  const designations = desigRes?.data || [];

  // Filter previous appointments for selected employee
  const selectedEmployeeAppointments = appointments.filter(a => a.employee?.id === employeeId);

  return (
    <div style={styles.container}>
      <div className="card flex-between" style={{ padding: '20px 24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Appointment Orders & Extensions</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Issue 89-day, 178-day, 1-year appointments and extension orders linking previous appointments without changing Employee IDs.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ gap: '8px' }}>
          <Plus size={16} />
          Issue Appointment / Extension
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          {isLoading ? (
            <div style={styles.loader}><div style={styles.spinner} /></div>
          ) : appointments.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Employee</th>
                  <th>Contract Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Department / Designation</th>
                  <th>Basic Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id}>
                    <td>
                      <strong style={{ color: 'var(--accent-secondary)' }}>{apt.orderNumber}</strong>
                      {apt.previousAppointment && (
                        <div style={{ fontSize: '10px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          <Link2 size={10} /> Ext. of {apt.previousAppointment.orderNumber}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ display: 'block' }}>{apt.employee?.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{apt.employee?.code}</span>
                    </td>
                    <td><span className="badge badge-info">{apt.contractType}</span></td>
                    <td>{apt.startDate.split('T')[0]}</td>
                    <td>{apt.endDate.split('T')[0]}</td>
                    <td>
                      <span style={{ display: 'block' }}>{apt.department?.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{apt.designation?.name}</span>
                    </td>
                    <td>₹ {apt.salary?.toLocaleString()}</td>
                    <td><span className={`badge badge-${apt.status === 'ACTIVE' ? 'success' : 'warning'}`}>{apt.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handlePrintPdf(apt.id)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--bg-surface)' }}>
                          <Printer size={12} /> Print
                        </button>
                        <button onClick={() => handleDownloadPdf(apt.id, apt.orderNumber)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                          <Download size={12} /> Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.empty}>
              <Briefcase size={40} color="var(--text-muted)" />
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>No appointment or extension records found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={styles.modalBackdrop}>
          <div className="card animated-fade-in" style={styles.modalContent}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Issue Appointment / Extension Order</h3>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '4px 8px' }}>✕</button>
            </div>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select className="form-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Order Number</label>
                  <input type="text" className="form-input" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="Auto-generated if empty" />
                </div>
                <div className="form-group">
                  <label className="form-label">Order Date</label>
                  <input type="date" className="form-input" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contract Type *</label>
                  <select
                    className="form-select"
                    value={contractType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContractType(val);
                      handleTypeOrDateChange(val, startDate);
                    }}
                  >
                    <option value="DAYS_89">89 Days Appointment</option>
                    <option value="DAYS_178">178 Days Appointment</option>
                    <option value="ONE_YEAR">One Year Appointment</option>
                    <option value="EXTENSION">Extension Order (Links Previous)</option>
                    <option value="CUSTOM">Custom Duration</option>
                  </select>
                </div>
              </div>

              {contractType === 'EXTENSION' && (
                <div className="form-group" style={{ backgroundColor: 'rgba(59,130,246,0.1)', padding: '12px', borderRadius: '8px' }}>
                  <label className="form-label">Link Previous Appointment *</label>
                  <select className="form-select" value={previousAppointmentId} onChange={(e) => setPreviousAppointmentId(e.target.value)} required>
                    <option value="">-- Select Previous Appointment --</option>
                    {selectedEmployeeAppointments.map((a) => (
                      <option key={a.id} value={a.id}>{a.orderNumber} ({a.contractType} - Ended {a.endDate.split('T')[0]})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      handleTypeOrDateChange(contractType, e.target.value);
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Calculated End Date *</label>
                  <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <select className="form-select" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
                    <option value="">-- Select --</option>
                    {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Designation *</label>
                  <select className="form-select" value={designationId} onChange={(e) => setDesignationId(e.target.value)} required>
                    <option value="">-- Select --</option>
                    {designations.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Basic Salary (₹) *</label>
                  <input type="number" step="0.01" className="form-input" value={salary} onChange={(e) => setSalary(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Terms & Order Details</label>
                  <input type="text" className="form-input" value={terms} onChange={(e) => setTerms(e.target.value)} />
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Issuing...' : 'Issue Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  loader: { display: 'flex', justifyContent: 'center', padding: '60px' },
  spinner: { width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { width: '100%', maxWidth: '680px', padding: '24px' },
  errorBox: { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
};
