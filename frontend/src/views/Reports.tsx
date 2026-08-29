import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { FileText, Download, Filter, BarChart3 } from 'lucide-react';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'establishment' | 'serviceBreak' | 'payStructure'>('establishment');
  const [deptFilter, setDeptFilter] = useState('');

  // Fetch departments for filtering
  const { data: deptRes } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await apiClient.get('/api/departments');
      return res.data;
    },
  });

  // Establishment Register report query
  const { data: estRes, isLoading: loadingEst } = useQuery({
    queryKey: ['reportEst', deptFilter],
    queryFn: async () => {
      const res = await apiClient.get(`/api/reports/establishment?departmentId=${deptFilter}`);
      return res.data;
    },
    enabled: activeTab === 'establishment',
  });

  // Service Break report query
  const { data: breakRes, isLoading: loadingBreak } = useQuery({
    queryKey: ['reportBreak'],
    queryFn: async () => {
      const res = await apiClient.get('/api/reports/service-break');
      return res.data;
    },
    enabled: activeTab === 'serviceBreak',
  });

  // Pay Structure report query
  const { data: payRes, isLoading: loadingPay } = useQuery({
    queryKey: ['reportPay', deptFilter],
    queryFn: async () => {
      const res = await apiClient.get(`/api/reports/pay-structure?departmentId=${deptFilter}`);
      return res.data;
    },
    enabled: activeTab === 'payStructure',
  });

  const departments = deptRes?.data || [];

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csvContent = [
      keys.join(','),
      ...data.map((row) => keys.map((k) => `"${row[k] ?? ''}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      {/* Header Tabs */}
      <div className="card flex-between" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'establishment' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('establishment')}
          >
            <FileText size={16} /> Establishment Register
          </button>
          <button
            className={`btn ${activeTab === 'serviceBreak' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('serviceBreak')}
          >
            <BarChart3 size={16} /> Service Break Audit
          </button>
          <button
            className={`btn ${activeTab === 'payStructure' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('payStructure')}
          >
            <Filter size={16} /> Pay Structure Matrix
          </button>
        </div>

        {activeTab !== 'serviceBreak' && (
          <select className="form-select" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ width: '220px' }}>
            <option value="">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tab 1: Establishment Register */}
      {activeTab === 'establishment' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="flex-between" style={styles.tableHeadRow}>
            <h4 style={styles.sectionTitle}>Master Establishment Register</h4>
            <button className="btn btn-secondary" onClick={() => handleExportCSV(estRes?.data || [], 'Establishment_Register')}>
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            {loadingEst ? (
              <div style={styles.loader}><div style={styles.spinner} /></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp Code</th>
                    <th>Name</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Joining Date</th>
                    <th>Service Tenure</th>
                    <th>Wage Type</th>
                    <th>Basic Pay</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(estRes?.data || []).map((row: any) => (
                    <tr key={row.id}>
                      <td><strong style={{ color: 'var(--accent-secondary)' }}>{row.code}</strong></td>
                      <td>{row.name}</td>
                      <td>{row.designation?.name}</td>
                      <td>{row.department?.name}</td>
                      <td>{new Date(row.joiningDate).toLocaleDateString()}</td>
                      <td>{row.tenureMonths || 0} Months</td>
                      <td><span className="badge badge-info">{row.employmentType}</span></td>
                      <td>₹ {row.basicSalary?.toLocaleString()}</td>
                      <td><span className={`badge badge-${row.status === 'ACTIVE' ? 'success' : 'warning'}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Service Break Audit */}
      {activeTab === 'serviceBreak' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="flex-between" style={styles.tableHeadRow}>
            <div>
              <h4 style={styles.sectionTitle}>Mandatory Service Break Audit (89 / 178 Days Rule)</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 24px' }}>
                Monitors contract durations to prevent legal tenure violations.
              </p>
            </div>
            <button className="btn btn-secondary" onClick={() => handleExportCSV(breakRes?.data || [], 'Service_Break_Audit')}>
              <Download size={14} /> Export Audit CSV
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            {loadingBreak ? (
              <div style={styles.loader}><div style={styles.spinner} /></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp Code</th>
                    <th>Employee Name</th>
                    <th>Joining Date</th>
                    <th>Total Active Days</th>
                    <th>Milestone Status</th>
                    <th>Next Mandatory Break Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(breakRes?.data || []).map((row: any) => (
                    <tr key={row.id}>
                      <td><strong style={{ color: 'var(--accent-secondary)' }}>{row.code}</strong></td>
                      <td>{row.name}</td>
                      <td>{new Date(row.joiningDate).toLocaleDateString()}</td>
                      <td><strong>{row.activeDays} Days</strong></td>
                      <td>
                        <span className={`badge badge-${row.activeDays >= 170 ? 'danger' : row.activeDays >= 80 ? 'warning' : 'success'}`}>
                          {row.activeDays >= 178 ? '178 Days Exceeded' : row.activeDays >= 89 ? '89 Days Reached' : 'Within Limits'}
                        </span>
                      </td>
                      <td>{row.nextBreakDueDate || 'N/A'}</td>
                      <td><span className="badge badge-info">{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Pay Structure Matrix */}
      {activeTab === 'payStructure' && (
        <div className="card" style={{ padding: 0 }}>
          <div className="flex-between" style={styles.tableHeadRow}>
            <h4 style={styles.sectionTitle}>Pay Structure & Wage Allocation Matrix</h4>
            <button className="btn btn-secondary" onClick={() => handleExportCSV(payRes?.data || [], 'Pay_Structure_Matrix')}>
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            {loadingPay ? (
              <div style={styles.loader}><div style={styles.spinner} /></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Emp Code</th>
                    <th>Name</th>
                    <th>Wage Model</th>
                    <th>Base Pay Rate</th>
                    <th>Daily Allowance</th>
                    <th>Special Weightage</th>
                    <th>Estimated Monthly Net</th>
                  </tr>
                </thead>
                <tbody>
                  {(payRes?.data || []).map((row: any) => (
                    <tr key={row.id}>
                      <td><strong style={{ color: 'var(--accent-secondary)' }}>{row.code}</strong></td>
                      <td>{row.name}</td>
                      <td><span className="badge badge-info">{row.employmentType}</span></td>
                      <td>₹ {row.basicSalary?.toLocaleString()} / {row.employmentType === 'DAILY_WAGE' ? 'Day' : 'Mo'}</td>
                      <td>₹ {row.allowance?.toLocaleString() || '0.00'}</td>
                      <td>₹ {row.weightage?.toLocaleString() || '0.00'}</td>
                      <td><strong style={{ color: 'var(--color-success)' }}>₹ {row.estimatedNetPay?.toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: 700, padding: '20px 24px 4px' },
  tableHeadRow: { paddingRight: '24px' },
  loader: { display: 'flex', justifyContent: 'center', padding: '60px' },
  spinner: { width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};
