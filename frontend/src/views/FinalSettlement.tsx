import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Calculator, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface FinalSettlementRecord {
  id: string;
  lastWorkingDate: string;
  pendingSalary: number;
  leaveAdjustments: number;
  otPay: number;
  advanceDeductions: number;
  otherAdjustments: number;
  netPayable: number;
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

export const FinalSettlement: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [lastWorkingDate, setLastWorkingDate] = useState(new Date().toISOString().split('T')[0]);
  const [pendingSalary, setPendingSalary] = useState('0');
  const [leaveAdjustments, setLeaveAdjustments] = useState('0');
  const [otPay, setOtPay] = useState('0');
  const [advanceDeductions, setAdvanceDeductions] = useState('0');
  const [otherAdjustments, setOtherAdjustments] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch employees for dropdown
  const { data: employeesRes } = useQuery({
    queryKey: ['employeesForSettlement'],
    queryFn: async () => {
      const res = await apiClient.get('/api/employees?limit=200');
      return res.data;
    },
  });

  // Fetch final settlement for selected employee
  const { data: settlementData } = useQuery({
    queryKey: ['finalSettlement', selectedEmpId],
    queryFn: async () => {
      if (!selectedEmpId) return null;
      try {
        const res = await apiClient.get(`/api/final-settlements/${selectedEmpId}`);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: !!selectedEmpId,
  });

  // Calculate settlement mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/api/final-settlements', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finalSettlement', selectedEmpId] });
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to generate settlement statement');
    },
  });

  // Update clearance mutation
  const clearanceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.patch(`/api/final-settlements/${selectedEmpId}/clearance`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finalSettlement', selectedEmpId] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const employees = employeesRes?.data || [];
  const record: FinalSettlementRecord | null = settlementData;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    createMutation.mutate({
      employeeId: selectedEmpId,
      lastWorkingDate,
      pendingSalary: parseFloat(pendingSalary),
      leaveAdjustments: parseFloat(leaveAdjustments),
      otPay: parseFloat(otPay),
      advanceDeductions: parseFloat(advanceDeductions),
      otherAdjustments: parseFloat(otherAdjustments),
    });
  };

  const calculatedNet =
    (parseFloat(pendingSalary) || 0) +
    (parseFloat(leaveAdjustments) || 0) +
    (parseFloat(otPay) || 0) -
    (parseFloat(advanceDeductions) || 0) +
    (parseFloat(otherAdjustments) || 0);

  return (
    <div style={styles.container}>
      <div className="card flex-between" style={{ padding: '20px 24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Employee Final Settlement & Payout Wizard</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Calculate exit financial settlements (salary, OT, leaveencashment, advance deductions) & track clearances.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Form / Employee Selection */}
        <div className="card">
          <h4 style={styles.title}>Calculate Payout Parameters</h4>

          {formError && <div style={styles.errorBox}>{formError}</div>}

          <form onSubmit={handleCalculate} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Select Employee *</label>
              <select className="form-select" value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} required>
                <option value="">-- Select Employee --</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Last Working Date *</label>
              <input type="date" className="form-input" value={lastWorkingDate} onChange={(e) => setLastWorkingDate(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Pending Salary (₹)</label>
                <input type="number" step="0.01" className="form-input" value={pendingSalary} onChange={(e) => setPendingSalary(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Leave Encashment (₹)</label>
                <input type="number" step="0.01" className="form-input" value={leaveAdjustments} onChange={(e) => setLeaveAdjustments(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Approved OT Pay (₹)</label>
                <input type="number" step="0.01" className="form-input" value={otPay} onChange={(e) => setOtPay(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Advance Deductions (₹)</label>
                <input type="number" step="0.01" className="form-input" value={advanceDeductions} onChange={(e) => setAdvanceDeductions(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Other Adjustments / Gratuity (₹)</label>
              <input type="number" step="0.01" className="form-input" value={otherAdjustments} onChange={(e) => setOtherAdjustments(e.target.value)} />
            </div>

            <div className="card" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)', padding: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Estimated Net Payable Amount</span>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-success)', marginTop: '4px' }}>
                ₹ {calculatedNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ gap: '8px' }} disabled={createMutation.isPending || !selectedEmpId}>
              <Calculator size={16} />
              {createMutation.isPending ? 'Calculating...' : 'Generate Settlement Statement'}
            </button>
          </form>
        </div>

        {/* Right Column: Statement & Clearance Signoffs */}
        <div className="card">
          <h4 style={styles.title}>Settlement Statement & Department Clearances</h4>

          {record ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={styles.statementBox}>
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <strong>{record.employee?.name}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--accent-secondary)' }}>{record.employee?.code}</span>
                </div>
                <div style={styles.statRow}><span>Last Working Day:</span> <strong>{record.lastWorkingDate.split('T')[0]}</strong></div>
                <div style={styles.statRow}><span>Pending Salary:</span> <strong>₹ {record.pendingSalary?.toLocaleString()}</strong></div>
                <div style={styles.statRow}><span>Leave Adjustments:</span> <strong>₹ {record.leaveAdjustments?.toLocaleString()}</strong></div>
                <div style={styles.statRow}><span>Overtime Pay:</span> <strong>₹ {record.otPay?.toLocaleString()}</strong></div>
                <div style={styles.statRow}><span>Advance Deductions:</span> <strong style={{ color: 'var(--color-danger)' }}>- ₹ {record.advanceDeductions?.toLocaleString()}</strong></div>
                <div style={{ ...styles.statRow, borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>Net Payable:</span>
                  <strong style={{ fontSize: '18px', color: 'var(--color-success)' }}>₹ {record.netPayable?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>

              <div>
                <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Department Clearances</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="flex-between" style={styles.clearanceRow}>
                    <span>Departmental Equipment Clearance</span>
                    <button
                      className={`btn ${record.departmentClearance ? 'btn-success' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => clearanceMutation.mutate({ departmentClearance: !record.departmentClearance })}
                    >
                      {record.departmentClearance ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {record.departmentClearance ? 'Cleared' : 'Pending'}
                    </button>
                  </div>

                  <div className="flex-between" style={styles.clearanceRow}>
                    <span>Finance & Advance Dues Clearance</span>
                    <button
                      className={`btn ${record.financeClearance ? 'btn-success' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => clearanceMutation.mutate({ financeClearance: !record.financeClearance })}
                    >
                      {record.financeClearance ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {record.financeClearance ? 'Cleared' : 'Pending'}
                    </button>
                  </div>

                  <div className="flex-between" style={styles.clearanceRow}>
                    <span>HR & Exit Documentation Clearance</span>
                    <button
                      className={`btn ${record.hrClearance ? 'btn-success' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => clearanceMutation.mutate({ hrClearance: !record.hrClearance })}
                    >
                      {record.hrClearance ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      {record.hrClearance ? 'Cleared' : 'Pending'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ShieldCheck size={40} color="var(--text-muted)" />
              <p style={{ marginTop: '12px' }}>Select an employee and generate settlement statement to view clearance status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  title: { fontSize: '16px', fontWeight: 700, marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  errorBox: { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '16px' },
  statementBox: { backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' },
  clearanceRow: { padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.01)' },
};
