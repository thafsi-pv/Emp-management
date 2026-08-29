import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { CreditCard, FileDown, CheckCircle, DollarSign, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface PayrollRecord {
  id: string;
  month: string;
  year: number;
  totalWorkingDays: number;
  workedDays: number;
  basicSalary: number;
  allowance: number;
  bonus: number;
  gratuity: number;
  deduction: number;
  overtime: number;
  netSalary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  employee: {
    id: string;
    name: string;
    code: string;
    department: { name: string };
    designation: { name: string };
  };
}

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
];

export const Payroll: React.FC = () => {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [genEmployeeId, setGenEmployeeId] = useState('');
  const [genAllowance, setGenAllowance] = useState('0');
  const [genBonus, setGenBonus] = useState('0');
  const [genDeduction, setGenDeduction] = useState('0');
  const [genOvertime, setGenOvertime] = useState('0');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Fetch payroll list for selected month/year
  const { data: payrollRes, isLoading } = useQuery({
    queryKey: ['payroll', month, year],
    queryFn: async () => {
      const res = await apiClient.get(`/api/payroll?month=${month}&year=${year}&limit=100`);
      return res.data;
    },
  });

  // Fetch monthly summary
  const { data: summary } = useQuery({
    queryKey: ['payrollSummary', month, year],
    queryFn: async () => {
      const res = await apiClient.get(`/api/payroll/summary?month=${month}&year=${year}`);
      return res.data;
    },
  });

  // Fetch active employees for generate form
  const { data: employeesRes } = useQuery({
    queryKey: ['activeEmployees'],
    queryFn: async () => {
      const res = await apiClient.get('/api/employees?status=ACTIVE&limit=200');
      return res.data;
    },
  });

  // Generate payroll mutation
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/api/payroll/generate', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payrollSummary'] });
      setIsGenerateOpen(false);
      setGenError(null);
    },
    onError: (err: any) => {
      setGenError(err.response?.data?.message || 'Failed to generate payroll');
    },
  });

  // Approve payroll mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/payroll/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payrollSummary'] });
    },
  });

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/api/payroll/${id}/paid`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payrollSummary'] });
    },
  });

  const payrolls: PayrollRecord[] = payrollRes?.data || [];
  const employees = employeesRes?.data || [];

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);
    generateMutation.mutate({
      employeeId: genEmployeeId,
      month,
      year: parseInt(year),
      allowance: parseFloat(genAllowance),
      bonus: parseFloat(genBonus),
      deduction: parseFloat(genDeduction),
      overtime: parseFloat(genOvertime),
    });
  };

  return (
    <div style={styles.container}>
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card" style={styles.summaryCard}>
            <CreditCard size={20} color="var(--accent-primary)" />
            <div>
              <span style={styles.sumLabel}>Total Employees</span>
              <strong style={styles.sumVal}>{summary.totalEmployees}</strong>
            </div>
          </div>
          <div className="card" style={styles.summaryCard}>
            <DollarSign size={20} color="var(--color-success)" />
            <div>
              <span style={styles.sumLabel}>Total Net Salary</span>
              <strong style={{ ...styles.sumVal, color: 'var(--color-success)' }}>
                ₹ {summary.totalNetSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>
          <div className="card" style={styles.summaryCard}>
            <CheckCircle size={20} color="var(--color-info)" />
            <div>
              <span style={styles.sumLabel}>Approved Payrolls</span>
              <strong style={styles.sumVal}>{summary.approved}</strong>
            </div>
          </div>
          <div className="card" style={styles.summaryCard}>
            <RefreshCw size={20} color="var(--color-warning)" />
            <div>
              <span style={styles.sumLabel}>Pending / Draft</span>
              <strong style={{ ...styles.sumVal, color: 'var(--color-warning)' }}>{summary.pending}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Controls Row */}
      <div className="card flex-between" style={{ padding: '16px 24px' }}>
        <div style={styles.filterRow}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Month</label>
            <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Year</label>
            <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
              {[2023, 2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setIsGenerateOpen((v) => !v)}
          className="btn btn-primary"
          style={{ gap: '8px' }}
        >
          <CreditCard size={16} />
          Generate Payroll
          {isGenerateOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Collapsible Generate Form */}
      {isGenerateOpen && (
        <div className="card animated-fade-in">
          <h4 style={styles.sectionTitle}>Generate New Payroll Record</h4>
          <p style={styles.hint}>
            System will auto-calculate earned basic from approved attendance. Enter additional components below.
          </p>

          {genError && <div style={styles.errorBox}>{genError}</div>}

          <form onSubmit={handleGenerate} style={styles.genForm}>
            <div className="form-group">
              <label className="form-label">Select Employee *</label>
              <select
                className="form-select"
                value={genEmployeeId}
                onChange={(e) => setGenEmployeeId(e.target.value)}
                required
              >
                <option value="">-- Select Employee --</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.code})</option>
                ))}
              </select>
            </div>
            <div style={styles.genGrid}>
              <div className="form-group">
                <label className="form-label">Allowance (₹)</label>
                <input type="number" className="form-input" value={genAllowance} onChange={(e) => setGenAllowance(e.target.value)} step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Bonus / Weightage (₹)</label>
                <input type="number" className="form-input" value={genBonus} onChange={(e) => setGenBonus(e.target.value)} step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Overtime (₹)</label>
                <input type="number" className="form-input" value={genOvertime} onChange={(e) => setGenOvertime(e.target.value)} step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Deductions (₹)</label>
                <input type="number" className="form-input" value={genDeduction} onChange={(e) => setGenDeduction(e.target.value)} step="0.01" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={generateMutation.isPending}>
              {generateMutation.isPending ? 'Generating...' : 'Generate & Save'}
            </button>
          </form>
        </div>
      )}

      {/* Payroll Register Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={styles.tableHeader}>
          <h4 style={styles.sectionTitle}>
            Monthly Payroll Register — {MONTHS.find((m) => m.value === month)?.label} {year}
          </h4>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{payrolls.length} records</span>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          {isLoading ? (
            <div style={styles.loader}><div style={styles.spinner} /></div>
          ) : payrolls.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department / Designation</th>
                  <th>Worked Days</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>OT / Bonus</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong style={{ display: 'block' }}>{p.employee?.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--accent-secondary)' }}>{p.employee?.code}</span>
                    </td>
                    <td>
                      <span style={{ display: 'block', fontSize: '12px' }}>{p.employee?.department?.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.employee?.designation?.name}</span>
                    </td>
                    <td>{p.workedDays} / {p.totalWorkingDays}</td>
                    <td>₹ {p.basicSalary?.toLocaleString()}</td>
                    <td>₹ {p.allowance?.toLocaleString()}</td>
                    <td>₹ {(p.overtime + p.bonus)?.toLocaleString()}</td>
                    <td style={{ color: 'var(--color-danger)' }}>₹ {p.deduction?.toLocaleString()}</td>
                    <td>
                      <strong style={{ color: 'var(--color-success)' }}>
                        ₹ {p.netSalary?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge badge-${
                        p.status === 'PAID' ? 'success' : p.status === 'APPROVED' ? 'info' : 'warning'
                      }`}>{p.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {p.status === 'DRAFT' && (
                          <button
                            onClick={() => approveMutation.mutate(p.id)}
                            className="btn btn-primary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            disabled={approveMutation.isPending}
                          >
                            Approve
                          </button>
                        )}
                        {p.status === 'APPROVED' && (
                          <button
                            onClick={() => markPaidMutation.mutate(p.id)}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px' }}
                            disabled={markPaidMutation.isPending}
                          >
                            Mark Paid
                          </button>
                        )}
                        <a
                          href={`/api/payroll/${p.id}/payslip`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '11px', textDecoration: 'none' }}
                        >
                          <FileDown size={12} />
                          Payslip
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={styles.empty}>
              <CreditCard size={40} color="var(--text-muted)" />
              <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
                No payroll records for {MONTHS.find((m) => m.value === month)?.label} {year}. Generate payroll to begin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  summaryCard: { display: 'flex', alignItems: 'center', gap: '14px', padding: '20px' },
  sumLabel: { fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' },
  sumVal: { fontSize: '22px', fontWeight: '800', display: 'block', marginTop: '2px' },
  filterRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', padding: '20px 24px' },
  hint: { fontSize: '13px', color: 'var(--text-secondary)', padding: '0 24px 16px' },
  errorBox: { backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '12px 24px', margin: '0 0 16px', borderRadius: 'var(--radius-sm)', fontSize: '13px' },
  genForm: { padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  genGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' },
  loader: { display: 'flex', justifyContent: 'center', padding: '60px' },
  spinner: { width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' },
};
