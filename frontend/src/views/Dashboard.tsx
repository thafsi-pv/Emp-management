import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { DonutChart, BarChart } from '../components/SVGCharts';
import {
  Users,
  CheckCircle,
  AlertCircle,
  FileMinus,
  Briefcase,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  terminatedEmployees: number;
  contractsExpiringSoon: number;
  activeContracts: number;
  attendanceToday: {
    total: number;
    present: number;
    absent: number;
    percentage: number;
  };
  pendingApprovals: number;
  payrollThisMonth: number;
}

export const Dashboard: React.FC<{ onNavigateToEmployee?: (empId: string) => void }> = () => {

  // Fetch Dashboard Stats from reports module
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await apiClient.get('/api/reports/dashboard');
      return res.data;
    },
    refetchInterval: 30000, // refresh every 30s
  });

  // Fetch all employees to calculate alert lists and custom breakdowns
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['dashboardEmployees'],
    queryFn: async () => {
      const res = await apiClient.get('/api/employees?limit=200');
      return res.data;
    },
  });

  // Fetch appointments to check expirations
  const { data: appointmentsData } = useQuery({
    queryKey: ['dashboardAppointments'],
    queryFn: async () => {
      const res = await apiClient.get('/api/appointments?limit=200');
      return res.data;
    },
  });

  if (statsLoading || employeesLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading HDS Dashboard metrics...</p>
      </div>
    );
  }

  const employees = employeesData?.data || [];
  const appointments = appointmentsData?.data || [];

  // Calculate stats
  const totalCount = employees.length;
  const activeCount = employees.filter((e: any) => e.status === 'ACTIVE').length;
  const terminatedCount = employees.filter((e: any) => e.status === 'TERMINATED').length;
  const resignedCount = employees.filter((e: any) => e.status === 'RESIGNED').length;
  const onLeaveCount = employees.filter((e: any) => e.status === 'INACTIVE').length; // Map INACTIVE to On Leave for display

  // Department-wise distribution
  const deptMap: Record<string, number> = {};
  employees.forEach((e: any) => {
    if (e.status === 'ACTIVE') {
      const deptName = e.department?.name || 'Unassigned';
      deptMap[deptName] = (deptMap[deptName] || 0) + 1;
    }
  });
  const deptChartData = Object.entries(deptMap).map(([label, value]) => ({ label, value }));

  // Designation-wise distribution
  const desigMap: Record<string, number> = {};
  employees.forEach((e: any) => {
    if (e.status === 'ACTIVE') {
      const desigName = e.designation?.name || 'Unassigned';
      desigMap[desigName] = (desigMap[desigName] || 0) + 1;
    }
  });

  // Calculate alerts based on settings
  const today = new Date();
  const alertLogs: { type: string; message: string; severity: 'danger' | 'warning' | 'info'; daysLeft: number }[] = [];

  // 1. Check Appointment / Contract Expiries (89-Day, 178-Day, One Year)
  appointments.forEach((apt: any) => {
    if (apt.status === 'ACTIVE') {
      const endDate = new Date(apt.endDate);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Alert thresholds: 60, 30, 15, 7 days
      if (diffDays <= 60 && diffDays >= -10) {
        let severity: 'danger' | 'warning' | 'info' = 'info';
        if (diffDays <= 7) severity = 'danger';
        else if (diffDays <= 30) severity = 'warning';

        let alertType = 'Contract Expiry';
        if (apt.contractType === 'THREE_MONTHS') alertType = '89 Days Appointment Expiry';
        else if (apt.contractType === 'SIX_MONTHS') alertType = '178 Days Completion';
        else if (apt.contractType === 'ONE_YEAR') alertType = 'One Year Appointment Expiry';

        const daysMsg = diffDays < 0 ? `Expired ${Math.abs(diffDays)} days ago` : `expires in ${diffDays} days`;

        alertLogs.push({
          type: alertType,
          message: `${apt.employee?.name || 'Employee'} (${apt.employee?.code || 'Code'}) contract (${apt.contractType}) ${daysMsg} (Date: ${apt.endDate.split('T')[0]})`,
          severity,
          daysLeft: diffDays,
        });
      }
    }
  });

  // 2. Check Service Breaks due (ACTIVE employees whose continuous service is nearing 178 days or they already reached it and need service break)
  employees.forEach((emp: any) => {
    if (emp.status === 'ACTIVE' && emp.joiningDate) {
      const joiningDate = new Date(emp.joiningDate);
      const diffTime = today.getTime() - joiningDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Reaching 178 days is a milestone. Alert if they are within 30 days of 178 (i.e. service days is 148 to 178)
      if (diffDays >= 148 && diffDays <= 178) {
        const daysToBreak = 178 - diffDays;
        alertLogs.push({
          type: 'Service Break Due',
          message: `${emp.name} is due for a mandatory Service Break in ${daysToBreak} days (Service: ${diffDays} days)`,
          severity: daysToBreak <= 7 ? 'danger' : 'warning',
          daysLeft: daysToBreak,
        });
      }
    }
  });

  // Sort alerts by severity & urgency
  alertLogs.sort((a, b) => a.daysLeft - b.daysLeft);

  // Stats Card Config
  const statsCards = [
    { label: 'Total Employees', value: totalCount, icon: Users, color: 'var(--accent-primary)' },
    { label: 'Active Staff', value: activeCount, icon: CheckCircle, color: 'var(--color-success)' },
    { label: 'On Leave', value: onLeaveCount, icon: Clock, color: 'var(--color-warning)' },
    { label: 'Terminated', value: terminatedCount, icon: FileMinus, color: 'var(--color-danger)' },
    { label: 'Resigned', value: resignedCount, icon: AlertCircle, color: 'var(--color-info)' },
    { label: 'Active Contracts', value: stats?.activeContracts || 0, icon: Briefcase, color: 'var(--accent-secondary)' },
  ];

  return (
    <div style={styles.dashboardContainer}>
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.slice(0, 4).map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="card" style={styles.statCard}>
              <div>
                <span style={styles.statLabel}>{card.label}</span>
                <h3 style={styles.statValue}>{card.value}</h3>
              </div>
              <div style={{ ...styles.statIconWrapper, backgroundColor: card.color + '15' }}>
                <Icon size={22} color={card.color} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginTop: '12px' }}>
        {statsCards.slice(4).map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="card" style={styles.statCard}>
              <div>
                <span style={styles.statLabel}>{card.label}</span>
                <h3 style={styles.statValue}>{card.value}</h3>
              </div>
              <div style={{ ...styles.statIconWrapper, backgroundColor: card.color + '15' }}>
                <Icon size={22} color={card.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Charts & Alerts */}
      <div style={styles.mainGrid}>
        {/* Left Column: Visual Analytics */}
        <div style={styles.chartsCol}>
          <div className="card" style={{ flex: 1 }}>
            <h3 style={styles.cardTitle}>Today's Attendance</h3>
            <div style={styles.chartWrapper}>
              <DonutChart
                data={[
                  { label: 'Present', value: stats?.attendanceToday.present || 0, color: 'var(--color-success)' },
                  { label: 'Absent', value: stats?.attendanceToday.absent || 0, color: 'var(--color-danger)' },
                  { label: 'On Leave', value: onLeaveCount, color: 'var(--color-warning)' },
                ]}
              />
            </div>
          </div>

          <div className="card" style={{ flex: 1 }}>
            <h3 style={styles.cardTitle}>Department Strength</h3>
            <div style={styles.chartWrapper}>
              {deptChartData.length > 0 ? (
                <BarChart data={deptChartData} />
              ) : (
                <p style={styles.emptyText}>No active department distribution data.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Automatic Alerts System */}
        <div className="card" style={styles.alertsCol}>
          <div className="flex-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ ...styles.cardTitle, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--color-warning)" />
              Automatic System Alerts
            </h3>
            <span className="badge badge-danger">{alertLogs.length} Pending</span>
          </div>

          <div style={styles.alertsScrollContainer}>
            {alertLogs.length > 0 ? (
              alertLogs.map((alert, i) => (
                <div key={i} className={`alert-card ${alert.severity}`}>
                  <div style={styles.alertContent}>
                    <div style={styles.alertHeader}>
                      <strong style={styles.alertType}>{alert.type}</strong>
                      <span className={`badge badge-${alert.severity}`} style={{ fontSize: '9px' }}>
                        {alert.daysLeft < 0 ? 'Overdue' : `${alert.daysLeft}d left`}
                      </span>
                    </div>
                    <p style={styles.alertMsg}>{alert.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.noAlerts}>
                <CheckCircle size={32} color="var(--color-success)" />
                <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>All contracts and service cycles are up to date!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Designation & Pending items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginTop: '24px' }}>
        <div className="card">
          <h3 style={styles.cardTitle}>Designation-wise Strength</h3>
          <div style={styles.listContainer}>
            {Object.entries(desigMap).map(([name, count]) => (
              <div key={name} style={styles.listItem}>
                <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                <span className="badge badge-info">{count} Active</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={styles.cardTitle}>Workflow Pending Actions</h3>
          <div style={styles.listContainer}>
            <div style={styles.listItem}>
              <span style={{ color: 'var(--text-primary)' }}>Pending Attendance Approvals</span>
              <span className={`badge ${stats?.pendingApprovals ? 'badge-warning' : 'badge-success'}`}>
                {stats?.pendingApprovals || 0} Approvals
              </span>
            </div>
            <div style={styles.listItem}>
              <span style={{ color: 'var(--text-primary)' }}>Contracts Expiring Soon (&lt;30d)</span>
              <span className={`badge ${stats?.contractsExpiringSoon ? 'badge-danger' : 'badge-info'}`}>
                {stats?.contractsExpiringSoon || 0} Expiring
              </span>
            </div>
            <div style={styles.listItem}>
              <span style={{ color: 'var(--text-primary)' }}>Pending Monthly Payrolls</span>
              <span className="badge badge-warning">Draft Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.05)',
    borderTopColor: 'var(--accent-secondary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '800',
    marginTop: '4px',
  },
  statIconWrapper: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '24px',
  },
  chartsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  chartWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '160px',
    marginTop: '16px',
  },
  alertsCol: {
    display: 'flex',
    flexDirection: 'column',
    height: '470px',
  },
  alertsScrollContainer: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '6px',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertType: {
    fontSize: '13px',
    color: 'var(--text-primary)',
  },
  alertMsg: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '4px',
    lineHeight: '1.4',
  },
  noAlerts: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '40px',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
  },
  emptyText: {
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '12px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '14px',
  },
};
