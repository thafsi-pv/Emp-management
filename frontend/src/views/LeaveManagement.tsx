import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Calendar, Check, X, Plus } from 'lucide-react';
import { useAuth } from '../context/SimulatedAuthContext';

interface LeaveRecord {
  id: string;
  leaveType: 'CASUAL' | 'SICK' | 'FESTIVAL' | 'UNPAID' | 'OTHER';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  employee: {
    id: string;
    name: string;
    code: string;
    department?: { name: string };
  };
}

export const LeaveManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, simulatedRole } = useAuth();
  const isAdminRole = simulatedRole !== 'EMPLOYEE';

  const [isModalOpen, setIsModalOpen] = useState(false);
  // For EMPLOYEE: pre-fill with their own ID; for admin roles: let them pick
  const [employeeId, setEmployeeId] = useState(isAdminRole ? '' : (user?.employeeId || ''));
  const [leaveType, setLeaveType] = useState<'CASUAL' | 'SICK' | 'FESTIVAL' | 'UNPAID' | 'OTHER'>('CASUAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If role switches to EMPLOYEE, lock to their own ID
  useEffect(() => {
    if (!isAdminRole) {
      setEmployeeId(user?.employeeId || '');
    }
  }, [isAdminRole, user?.employeeId]);

  // Fetch leaves list
  const { data: leavesRes, isLoading } = useQuery({
    queryKey: ['leavesList'],
    queryFn: async () => {
      const res = await apiClient.get('/api/leaves');
      return res.data;
    },
  });

  // Fetch active employees
  const { data: employeesRes } = useQuery({
    queryKey: ['employeesForLeave'],
    queryFn: async () => {
      const res = await apiClient.get('/api/employees?limit=200');
      return res.data;
    },
  });

  // Submit leave mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/api/leaves', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leavesList'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to submit leave application');
    },
  });

  // Approve leave mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/leaves/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leavesList'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  // Reject leave mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.patch(`/api/leaves/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leavesList'] });
    },
  });

  const resetForm = () => {
    // Keep employee locked for EMPLOYEE role
    setEmployeeId(isAdminRole ? '' : (user?.employeeId || ''));
    setLeaveType('CASUAL');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setReason('');
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
    });
  };

  const handleRejectClick = (id: string) => {
    const r = prompt('Reason for rejection:');
    if (r) rejectMutation.mutate({ id, reason: r });
  };

  const leaves: LeaveRecord[] = Array.isArray(leavesRes) ? leavesRes : (leavesRes?.data || []);
  const employees = employeesRes?.data || [];

  return (
    <div style={styles.container}>
      <div className="card flex-between" style={{ padding: '20px 24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Leave & Off Management</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Submit, approve, or reject leave applications integrated with daily attendance.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ gap: '8px' }}>
          <Plus size={16} />
          Apply for Leave
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none' }}>
          {isLoading ? (
            <div style={styles.loader}><div style={styles.spinner} /></div>
          ) : leaves.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong style={{ display: 'block' }}>{l.employee?.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.employee?.code}</span>
                    </td>
                    <td><span className="badge badge-info">{l.leaveType}</span></td>
                    <td>{l.startDate.split('T')[0]}</td>
                    <td>{l.endDate.split('T')[0]}</td>
                    <td style={{ fontSize: '12px' }}>{l.reason}</td>
                    <td>
                      <span className={`badge badge-${l.status === 'APPROVED' ? 'success' : l.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {l.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => approveMutation.mutate(l.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleRejectClick(l.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.empty}>
              <Calendar size={40} color="var(--text-muted)" />
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>No leave records found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={styles.modalBackdrop}>
          <div className="card animated-fade-in" style={styles.modalContent}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Apply for Employee Leave</h3>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)} style={{ padding: '4px 8px' }}>✕</button>
            </div>

            {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              {/* Employee selector — admin roles only; employees are auto-assigned */}
              {isAdminRole ? (
                <div className="form-group">
                  <label className="form-label">Select Employee *</label>
                  <select className="form-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required>
                    <option value="">-- Select Employee --</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.code})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: 600 }}>
                    {user?.name || 'You'}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Leave Type *</label>
                <select className="form-select" value={leaveType} onChange={(e) => setLeaveType(e.target.value as any)}>
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Sick Leave</option>
                  <option value="FESTIVAL">Festival Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                  <option value="OTHER">Other Leave</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Remarks *</label>
                <textarea className="form-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="State purpose of leave..." required />
              </div>

              <div className="flex-between" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Submitting...' : 'Submit Application'}
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
  modalContent: { width: '100%', maxWidth: '520px', padding: '24px' },
  errorBox: { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
};
