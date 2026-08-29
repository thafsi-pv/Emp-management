import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { UserMinus, CheckCircle2, Clock } from 'lucide-react';

interface OffboardingRecord {
  id: string;
  type: 'RESIGNATION' | 'TERMINATION' | 'CONTRACT_END';
  status: 'PENDING' | 'CLEARED' | 'COMPLETED' | 'REJECTED';
  noticeDate: string;
  lastWorkingDay: string;
  reason: string;
  departmentClearance: boolean;
  financeClearance: boolean;
  hrClearance: boolean;
  employee: {
    id: string;
    name: string;
    code: string;
    department: { name: string };
    designation: { name: string };
  };
}

export const Offboarding: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState<'RESIGNATION' | 'TERMINATION' | 'CONTRACT_END'>('RESIGNATION');
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch active offboardings
  const { data: offboardingsRes, isLoading } = useQuery({
    queryKey: ['offboardings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/offboardings');
      return res.data;
    },
  });

  // Fetch active employees for request dropdown
  const { data: employeesRes } = useQuery({
    queryKey: ['activeEmployeesForOffboarding'],
    queryFn: async () => {
      const res = await apiClient.get('/api/employees?status=ACTIVE&limit=200');
      return res.data;
    },
  });

  // Submit offboarding request mutation
  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/api/offboardings', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to submit offboarding request');
    },
  });

  // Toggle clearance status mutation
  const clearanceMutation = useMutation({
    mutationFn: async ({ id, dept, status }: { id: string; dept: 'dept' | 'finance' | 'hr'; status: boolean }) => {
      const endpoint = `/api/offboardings/${id}/clearance/${dept}`;
      await apiClient.patch(endpoint, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
    },
  });

  // Complete offboarding mutation
  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/offboardings/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offboardings'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const resetForm = () => {
    setEmployeeId('');
    setType('RESIGNATION');
    setNoticeDate(new Date().toISOString().split('T')[0]);
    setLastWorkingDay('');
    setReason('');
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      employeeId,
      type,
      noticeDate,
      lastWorkingDay,
      reason,
    });
  };

  const records: OffboardingRecord[] = offboardingsRes?.data || [];
  const employees = employeesRes?.data || [];

  return (
    <div style={styles.container}>
      {/* Header action */}
      <div className="card flex-between" style={{ padding: '20px 24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Employee Offboarding & Clearance</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage resignations, clearances, and automated status updates to RESIGNED / TERMINATED.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ gap: '8px' }}>
          <UserMinus size={16} />
          Initiate Exit Process
        </button>
      </div>

      {/* Offboarding Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          {isLoading ? (
            <div style={styles.loader}><div style={styles.spinner} /></div>
          ) : records.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Exit Type</th>
                  <th>Notice Date</th>
                  <th>Last Working Day</th>
                  <th>Department Clearance</th>
                  <th>Finance Clearance</th>
                  <th>HR Clearance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const allCleared = rec.departmentClearance && rec.financeClearance && rec.hrClearance;
                  return (
                    <tr key={rec.id}>
                      <td>
                        <strong style={{ display: 'block' }}>{rec.employee?.name}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--accent-secondary)' }}>{rec.employee?.code}</span>
                      </td>
                      <td>
                        <span className="badge badge-warning" style={{ fontSize: '11px' }}>{rec.type}</span>
                      </td>
                      <td>{rec.noticeDate}</td>
                      <td>{rec.lastWorkingDay}</td>
                      <td>
                        <button
                          className={`btn ${rec.departmentClearance ? 'btn-success' : 'btn-secondary'}`}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => clearanceMutation.mutate({ id: rec.id, dept: 'dept', status: !rec.departmentClearance })}
                        >
                          {rec.departmentClearance ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {rec.departmentClearance ? 'Cleared' : 'Pending'}
                        </button>
                      </td>
                      <td>
                        <button
                          className={`btn ${rec.financeClearance ? 'btn-success' : 'btn-secondary'}`}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => clearanceMutation.mutate({ id: rec.id, dept: 'finance', status: !rec.financeClearance })}
                        >
                          {rec.financeClearance ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {rec.financeClearance ? 'Cleared' : 'Pending'}
                        </button>
                      </td>
                      <td>
                        <button
                          className={`btn ${rec.hrClearance ? 'btn-success' : 'btn-secondary'}`}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => clearanceMutation.mutate({ id: rec.id, dept: 'hr', status: !rec.hrClearance })}
                        >
                          {rec.hrClearance ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {rec.hrClearance ? 'Cleared' : 'Pending'}
                        </button>
                      </td>
                      <td>
                        <span className={`badge badge-${rec.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td>
                        {rec.status !== 'COMPLETED' && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            disabled={!allCleared || completeMutation.isPending}
                            onClick={() => completeMutation.mutate(rec.id)}
                            title={!allCleared ? 'Requires clearance from all 3 departments' : 'Finalize Exit'}
                          >
                            Finalize Exit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={styles.empty}>
              <UserMinus size={40} color="var(--text-muted)" />
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                No active exit or offboarding requests.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={styles.modalBackdrop}>
          <div className="card animated-fade-in" style={styles.modalContent}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Initiate Employee Offboarding</h3>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Exit Type *</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="RESIGNATION">Resignation</option>
                    <option value="TERMINATION">Termination</option>
                    <option value="CONTRACT_END">Contract End</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notice Date *</label>
                  <input type="date" className="form-input" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Last Working Day *</label>
                <input type="date" className="form-input" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Remarks</label>
                <textarea className="form-input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="State primary reasons for exit..." />
              </div>

              <div className="flex-between" style={{ marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
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
  modalContent: { width: '100%', maxWidth: '540px', padding: '24px' },
  errorBox: { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
};
