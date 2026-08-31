import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Check, X, CalendarCheck, ShieldCheck, UserCheck } from 'lucide-react';

type StatusType = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'OFF' | 'OD' | 'HOLIDAY' | 'SERVICE_BREAK';

interface AttendanceRecord {
  id: string;
  date: string;
  status: StatusType;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  otHours?: number;
  employee: {
    id: string;
    name: string;
    code: string;
    department: { name: string };
  };
}

const activeStatusStyleMap: Record<StatusType, React.CSSProperties> = {
  PRESENT: { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', borderColor: 'rgba(16, 185, 129, 0.3)' },
  ABSENT: { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  HALF_DAY: { backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', borderColor: 'rgba(245, 158, 11, 0.3)' },
  LEAVE: { backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', borderColor: 'rgba(6, 182, 212, 0.3)' },
  OFF: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' },
  OD: { backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' },
  HOLIDAY: { backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', borderColor: 'rgba(236, 72, 153, 0.3)' },
  SERVICE_BREAK: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' },
};

export const Attendance: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  
  // State for bulk marking
  const [markedStatuses, setMarkedStatuses] = useState<Record<string, StatusType>>({});
  const [markedRemarks, setMarkedRemarks] = useState<Record<string, string>>({});
  const [markedOtHours, setMarkedOtHours] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch active employees to show in daily attendance logging
  const { data: employeesRes, isLoading: employeesLoading } = useQuery({
    queryKey: ['activeEmployeesForAttendance'],
    queryFn: async () => {
      const res = await apiClient.get('/api/employees?status=ACTIVE&limit=100');
      return res.data;
    },
  });

  // Fetch pending approvals attendance list
  const { data: pendingAttendance, isLoading: pendingLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['pendingAttendance'],
    queryFn: async () => {
      const res = await apiClient.get('/api/attendance?approvalStatus=PENDING');
      return res.data.data || res.data;
    },
  });

  // Bulk submit mutation
  const bulkSubmitMutation = useMutation({
    mutationFn: async (records: any[]) => {
      const res = await apiClient.post('/api/attendance/bulk', { records });
      return res.data;
    },
    onSuccess: () => {
      setSubmitSuccess(true);
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['pendingAttendance'] });
      setTimeout(() => setSubmitSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.message || 'Failed to submit attendance');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/attendance/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiClient.patch(`/api/attendance/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });

  const handleStatusChange = (empId: string, status: StatusType) => {
    setMarkedStatuses((prev) => ({ ...prev, [empId]: status }));
  };

  const handleRemarkChange = (empId: string, remark: string) => {
    setMarkedRemarks((prev) => ({ ...prev, [empId]: remark }));
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const employees = employeesRes?.data || [];
    const records = employees.map((emp: any) => ({
      employeeId: emp.id,
      date: selectedDate,
      status: markedStatuses[emp.id] || 'PRESENT',
      remarks: markedRemarks[emp.id] || '',
      otHours: Number(markedOtHours[emp.id]) || 0,
    }));

    bulkSubmitMutation.mutate(records);
  };

  const handleRejectClick = (id: string) => {
    const reason = prompt('Please enter the reason for rejection:');
    if (reason) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const activeEmployees = employeesRes?.data || [];

  return (
    <div style={styles.container}>
      <div style={styles.gridColumns}>
        {/* Left Column: Daily Attendance Marker */}
        <div className="card" style={{ flex: 1.3 }}>
          <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarCheck size={20} color="var(--accent-secondary)" />
              Daily Supervisor Attendance Marker
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label className="form-label" style={{ margin: 0 }}>Select Date:</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '150px', padding: '6px 12px' }}
              />
            </div>
          </div>

          {submitError && <div className="form-error" style={{ marginBottom: '16px' }}>{submitError}</div>}
          {submitSuccess && (
            <div style={styles.successAlert}>
              <UserCheck size={18} />
              <span>Attendance logs saved successfully and queued for approval!</span>
            </div>
          )}

          {employeesLoading ? (
            <div style={styles.loader}><div style={styles.spinner} /></div>
          ) : activeEmployees.length > 0 ? (
            <form onSubmit={handleBulkSubmit}>
              <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Attendance Status</th>
                      <th>OT Hours</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEmployees.map((emp: any) => {
                      const currentStatus = markedStatuses[emp.id] || 'PRESENT';
                      return (
                        <tr key={emp.id}>
                          <td>
                            <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{emp.name}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--accent-secondary)' }}>{emp.code}</span>
                          </td>
                          <td>{emp.department?.name}</td>
                          <td>
                            <div style={styles.statusOptions}>
                              {(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'OFF', 'OD', 'HOLIDAY', 'SERVICE_BREAK'] as const).map((st) => (
                                <label
                                  key={st}
                                  style={{
                                    ...styles.statusLabel,
                                    ...(currentStatus === st ? activeStatusStyleMap[st] : {}),
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`status-${emp.id}`}
                                    checked={currentStatus === st}
                                    onChange={() => handleStatusChange(emp.id, st)}
                                    style={{ display: 'none' }}
                                  />
                                  {st.replace('_', ' ')}
                                </label>
                              ))}
                            </div>
                          </td>
                          <td>
                            <input type="number" min="0" step="0.25" className="form-input" placeholder="0" value={markedOtHours[emp.id] || ''} onChange={(e) => setMarkedOtHours((prev) => ({ ...prev, [emp.id]: e.target.value }))} style={{ width: '80px', padding: '6px 10px', fontSize: '13px' }} />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Add notes..."
                              value={markedRemarks[emp.id] || ''}
                              onChange={(e) => handleRemarkChange(emp.id, e.target.value)}
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={styles.formActions}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={bulkSubmitMutation.isPending}
                >
                  {bulkSubmitMutation.isPending ? 'Saving logs...' : 'Save & Submit Attendance'}
                </button>
              </div>
            </form>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>No active employees found to log attendance.</p>
          )}
        </div>

        {/* Right Column: Attendance Approvals Panel */}
        <div className="card" style={{ flex: 0.7, display: 'flex', flexDirection: 'column', height: '620px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
            <ShieldCheck size={20} color="var(--accent-primary)" />
            Pending Attendance Approvals
          </h3>

          <div style={styles.approvalsScroll}>
            {pendingLoading ? (
              <div style={styles.loader}><div style={styles.spinner} /></div>
            ) : pendingAttendance && pendingAttendance.length > 0 ? (
              pendingAttendance.map((rec) => (
                <div key={rec.id} style={styles.approvalItem}>
                  <div style={styles.approvalBrief}>
                    <div>
                      <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '14px' }}>
                        {rec.employee?.name}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        ID: {rec.employee?.code} • Dept: {rec.employee?.department?.name || 'Unassigned'}
                      </span>
                      <span style={{ display: 'block', fontSize: '12px', color: 'var(--accent-secondary)', marginTop: '4px', fontWeight: 600 }}>
                        Date: {rec.date.split('T')[0]}
                      </span>
                    </div>
                    <span className={`badge badge-${
                      rec.status === 'PRESENT' ? 'success' :
                      rec.status === 'ABSENT' ? 'danger' : 'warning'
                    }`}>
                      {rec.status}
                    </span>
                  </div>

                  <div style={styles.approvalActions}>
                    <button
                      onClick={() => approveMutation.mutate(rec.id)}
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: '11px', flex: 1 }}
                      disabled={approveMutation.isPending}
                    >
                      <Check size={14} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(rec.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '11px', flex: 1 }}
                      disabled={rejectMutation.isPending}
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noApprovals}>
                <ShieldCheck size={32} color="var(--color-success)" />
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  No pending attendance approvals queued!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  gridColumns: { display: 'flex', gap: '24px' },
  loader: { display: 'flex', justifyContent: 'center', padding: '40px 0' },
  spinner: { width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  statusOptions: { display: 'flex', gap: '4px', flexWrap: 'wrap' },
  statusLabel: { padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', color: 'var(--text-secondary)', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', textTransform: 'uppercase', userSelect: 'none', transition: 'var(--transition-smooth)' },
  formActions: { display: 'flex', justifyContent: 'flex-end', marginTop: '20px' },
  successAlert: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '14px', marginBottom: '20px' },
  approvalsScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' },
  approvalItem: { backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  approvalBrief: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  approvalActions: { display: 'flex', gap: '8px' },
  noApprovals: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 0' },
};
