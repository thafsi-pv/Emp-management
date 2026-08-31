import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../context/SimulatedAuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Briefcase,
  Calendar,
  Building2,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  ClipboardList,
  BookOpen,
  DollarSign,
  UserX,
  HandCoins,
  Bell,
  AlertTriangle,
  Layers,
} from 'lucide-react';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Super Admin',
  ESTABLISHMENT_OFFICER: 'Establishment Officer',
  PAYROLL_OFFICER: 'Payroll Officer',
  SUPERVISOR: 'Supervisory Officer',
  DEPARTMENT_OFFICER: 'Department Officer',
  MANAGEMENT: 'Management Dashboard',
  EMPLOYEE: 'Employee View',
};

// ── Nav Tree ─────────────────────────────────────────────────────────────────

type NavLeaf = {
  id: string;
  path: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  children: NavLeaf[];
};

type NavItem = NavLeaf | NavGroup;

const isGroup = (item: NavItem): item is NavGroup => 'children' in item;

const NAV_TREE: NavItem[] = [
  {
    id: 'dashboard',
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT'],
  },
  // Employee group
  {
    id: 'employeeGroup',
    label: 'Employees',
    icon: Users,
    roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT'],
    children: [
      {
        id: 'employees',
        path: '/employees',
        label: 'Employee Directory',
        icon: Users,
        roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT'],
      },
      {
        id: 'appointments',
        path: '/appointments',
        label: 'Appointments',
        icon: Briefcase,
        roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT'],
      },
      {
        id: 'attendance',
        path: '/attendance',
        label: 'Attendance',
        icon: CalendarCheck,
        roles: ['ADMIN', 'SUPERVISOR', 'DEPARTMENT_OFFICER'],
      },
      {
        id: 'leaves',
        path: '/leaves',
        label: 'Leave & Off',
        icon: Calendar,
        roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'EMPLOYEE'],
      },
    ],
  },
  // Payroll group
  {
    id: 'payrollGroup',
    label: 'Payroll',
    icon: CreditCard,
    roles: ['ADMIN', 'PAYROLL_OFFICER', 'MANAGEMENT'],
    children: [
      {
        id: 'payroll',
        path: '/payroll',
        label: 'Payroll Run',
        icon: DollarSign,
        roles: ['ADMIN', 'PAYROLL_OFFICER', 'MANAGEMENT'],
      },
      {
        id: 'payMaster',
        path: '/pay-master',
        label: 'Pay Structure Master',
        icon: BookOpen,
        roles: ['ADMIN', 'PAYROLL_OFFICER'],
      },
    ],
  },
  // Establishment group
  {
    id: 'establishmentGroup',
    label: 'Establishment',
    icon: ClipboardList,
    roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER'],
    children: [
      {
        id: 'offboarding',
        path: '/offboarding',
        label: 'Offboarding',
        icon: UserX,
        roles: ['ADMIN', 'ESTABLISHMENT_OFFICER'],
      },
      {
        id: 'finalSettlement',
        path: '/final-settlement',
        label: 'Final Settlement',
        icon: HandCoins,
        roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER'],
      },
      {
        id: 'serviceBreaks',
        path: '/service-breaks',
        label: 'Service Break Due',
        icon: AlertTriangle,
        roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT'],
      },
    ],
  },
  // Reports group
  {
    id: 'reportsGroup',
    label: 'Reports',
    icon: BarChart3,
    roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'],
    children: [
      {
        id: 'reports',
        path: '/reports',
        label: 'Reports Hub',
        icon: FileText,
        roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'],
      },
      { id: 'reportEstablishment', path: '/reports/establishment', label: 'Establishment Register', icon: FileText, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportEmployees', path: '/reports/employees', label: 'Employee List', icon: Users, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportAttendance', path: '/reports/attendance', label: 'Attendance Report', icon: CalendarCheck, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportBreak', path: '/reports/service-break', label: 'Service Break Report', icon: AlertTriangle, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportAppointments', path: '/reports/appointments', label: 'Appointment Report', icon: Briefcase, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportExtensions', path: '/reports/extensions', label: 'Extension Report', icon: FileText, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportPay', path: '/reports/pay-structure', label: 'Pay Structure Report', icon: DollarSign, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportPayroll', path: '/reports/payroll', label: 'Payroll Report', icon: CreditCard, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportSeparation', path: '/reports/separation', label: 'Separation Report', icon: UserX, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
      { id: 'reportSettlement', path: '/reports/final-settlement', label: 'Final Settlement Report', icon: HandCoins, roles: ['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT'] },
    ],
  },
  // Employee self view
  {
    id: 'profile',
    path: '/my-profile',
    label: 'My Profile',
    icon: User,
    roles: ['EMPLOYEE'],
  },
  // Admin group
  {
    id: 'adminGroup',
    label: 'Administration',
    icon: ShieldCheck,
    roles: ['ADMIN'],
    children: [
      {
        id: 'departmentsMaster',
        path: '/masters/departments',
        label: 'Departments',
        icon: Building2,
        roles: ['ADMIN'],
      },
      {
        id: 'sectionsMaster', path: '/masters/sections', label: 'Sections', icon: Layers, roles: ['ADMIN'],
      },
      {
        id: 'designationsMaster', path: '/masters/designations', label: 'Designations', icon: BookOpen, roles: ['ADMIN'],
      },
      {
        id: 'userManagement',
        path: '/users',
        label: 'User Management',
        icon: UserCog,
        roles: ['ADMIN'],
      },
      {
        id: 'settings',
        path: '/settings',
        label: 'Settings',
        icon: Settings,
        roles: ['ADMIN'],
      },
    ],
  },
];

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const { user, simulatedRole, logout, switchRole } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  // Auto-open group that contains the active route
  useEffect(() => {
    const currentPath = location.pathname;
    NAV_TREE.forEach((item) => {
      if (isGroup(item)) {
        const hasActive = item.children.some(
          (c) => currentPath === c.path || currentPath.startsWith(c.path + '/')
        );
        if (hasActive) {
          setOpenGroups((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleTheme = () => setTheme((p) => (p === 'dark' ? 'light' : 'dark'));
  const toggleSidebar = () => setCollapsed((p) => !p);
  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  const handleLogout = () => { logout(); onLogout(); };

  const currentPath = location.pathname;

  const isLeafActive = (path: string) =>
    currentPath === path || (path !== '/dashboard' && currentPath.startsWith(path + '/'));

  const isGroupActive = (group: NavGroup) =>
    group.children.some((c) => isLeafActive(c.path));

  // Filtered visible tree for current role
  const visibleTree = NAV_TREE
    .filter((item) => item.roles.includes(simulatedRole))
    .map((item) => {
      if (isGroup(item)) {
        return {
          ...item,
          children: item.children.filter((c) => c.roles.includes(simulatedRole)),
        };
      }
      return item;
    })
    .filter((item) => !isGroup(item) || (item as NavGroup).children.length > 0) as NavItem[];

  // Active label for header
  let activeLabel = 'System Hub';
  for (const item of visibleTree) {
    if (isGroup(item)) {
      const found = item.children.find((c) => isLeafActive(c.path));
      if (found) { activeLabel = found.label; break; }
    } else if (isLeafActive((item as NavLeaf).path)) {
      activeLabel = item.label; break;
    }
  }

  const sidebarWidth = collapsed ? 68 : 260;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>

      {/* ── SIDEBAR ─────────────────────────────────────────── */}
      <aside
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          backgroundColor: 'var(--bg-surface-glass)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 100,
          flexShrink: 0,
        }}
      >
        {/* Logo + Collapse Toggle */}
        <div
          style={{
            padding: '16px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '1px solid var(--border-color)',
            minHeight: 68,
            overflow: 'hidden',
          }}
        >
          <div style={styles.logoIcon}>HDS</div>
          {!collapsed && (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <h1 style={styles.logoText}>AMITY</h1>
              <span style={styles.logoSub}>Payroll & Establishment</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            style={{
              ...styles.collapseBtn,
              marginLeft: collapsed ? 'auto' : undefined,
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <PanelLeftOpen size={16} color="var(--text-muted)" />
              : <PanelLeftClose size={16} color="var(--text-muted)" />
            }
          </button>
        </div>

        {/* Nav — scrollable */}
        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '12px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
          className="sidebar-scroll"
        >
          {visibleTree.map((item) => {
            if (isGroup(item)) {
              const open = !!openGroups[item.id];
              const groupActive = isGroupActive(item);
              const Icon = item.icon;

              return (
                <div key={item.id}>
                  {/* Group header button */}
                  <button
                    onClick={() => { if (collapsed) setCollapsed(false); toggleGroup(item.id); }}
                    title={collapsed ? item.label : undefined}
                    style={{
                      ...styles.navItem,
                      ...(groupActive ? styles.navGroupActive : {}),
                      justifyContent: collapsed ? 'center' : 'space-between',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon size={18} color={groupActive ? 'var(--accent-secondary)' : 'var(--text-secondary)'} />
                      {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</span>}
                    </span>
                    {!collapsed && (
                      <span
                        style={{
                          display: 'flex',
                          transition: 'transform 0.2s ease',
                          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <ChevronRight size={14} />
                      </span>
                    )}
                  </button>

                  {/* Submenu — animated */}
                  {!collapsed && (
                    <div
                      style={{
                        overflow: 'hidden',
                        maxHeight: open ? item.children.length * 52 + 'px' : '0px',
                        transition: 'max-height 0.25s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    >
                      <div style={{ paddingLeft: 8, paddingBottom: open ? 4 : 0 }}>
                        {item.children.map((child) => {
                          const CIcon = child.icon;
                          const active = isLeafActive(child.path);
                          return (
                            <button
                              key={child.id}
                              onClick={() => navigate(child.path)}
                              style={{
                                ...styles.subNavItem,
                                ...(active ? styles.subNavItemActive : {}),
                              }}
                            >
                              <CIcon size={15} color={active ? 'var(--accent-secondary)' : 'var(--text-muted)'} />
                              <span>{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Flat nav leaf
            const leaf = item as NavLeaf;
            const active = isLeafActive(leaf.path);
            const Icon = leaf.icon;
            return (
              <button
                key={leaf.id}
                onClick={() => navigate(leaf.path)}
                title={collapsed ? leaf.label : undefined}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : {}),
                  justifyContent: collapsed ? 'center' : undefined,
                }}
              >
                <Icon size={18} color={active ? 'var(--accent-secondary)' : 'var(--text-secondary)'} />
                {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>{leaf.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer — user + logout */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            padding: collapsed ? '12px 8px' : '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflow: 'hidden',
          }}
        >
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={styles.avatar}>
                <User size={14} color="var(--text-primary)" />
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <p style={styles.userName}>{user?.name || 'System User'}</p>
                <p style={styles.userRole}>{ROLE_LABELS[simulatedRole]}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              ...styles.logoutBtn,
              justifyContent: collapsed ? 'center' : 'center',
              padding: collapsed ? '10px' : '10px',
            }}
          >
            <LogOut size={15} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN PANEL ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Sticky Header */}
        <header style={styles.header}>
          <div style={styles.headerTitle}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{activeLabel}</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/alerts')}
              className="btn btn-secondary"
              title="Open Alert Center"
              style={{ padding: 8, display: 'flex', alignItems: 'center' }}
            >
              <Bell size={16} />
            </button>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
            >
              {theme === 'dark'
                ? <Sun size={14} color="var(--color-warning)" />
                : <Moon size={14} color="var(--accent-primary)" />
              }
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {user?.role === 'ADMIN' && (
              <div style={styles.roleSwitcherContainer}>
                <div style={styles.roleSwitcherLabel}>
                  <ShieldCheck size={13} color="var(--accent-secondary)" />
                  <span>User Access Role:</span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <select
                    value={simulatedRole}
                    onChange={(e) => { switchRole(e.target.value as UserRole); navigate('/dashboard'); }}
                    style={styles.roleSelect}
                  >
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <option key={role} value={role}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} style={{ position: 'absolute', right: 0, pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main
          className="main-content animated-fade-in"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '28px 32px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  logoIcon: {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: 10,
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    color: '#fff',
    fontSize: 13,
    boxShadow: 'var(--shadow-glow)',
    flexShrink: 0,
  },
  logoText: {
    fontSize: 17,
    fontWeight: 800,
    background: 'var(--accent-gradient)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    whiteSpace: 'nowrap',
  },
  logoSub: {
    fontSize: 9,
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  collapseBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    transition: 'background 0.15s',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
    fontSize: 13,
    fontWeight: 500,
    transition: 'background 0.15s, color 0.15s',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  navItemActive: {
    color: 'var(--text-primary)',
    background: 'rgba(255,255,255,0.06)',
    borderLeft: '3px solid var(--accent-secondary)',
  },
  navGroupActive: {
    color: 'var(--text-primary)',
    background: 'rgba(255,255,255,0.03)',
  },
  subNavItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '8px 10px 8px 14px',
    borderRadius: 6,
    color: 'var(--text-muted)',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
    fontSize: 12.5,
    fontWeight: 500,
    transition: 'background 0.15s, color 0.15s',
    borderLeft: '1px solid var(--border-color)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  subNavItemActive: {
    color: 'var(--accent-secondary)',
    background: 'rgba(56,189,248,0.08)',
    borderLeft: '2px solid var(--accent-secondary)',
  },
  avatar: {
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: '50%',
    backgroundColor: 'var(--bg-surface-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid var(--border-color)',
  },
  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  userRole: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
    color: 'var(--color-danger)',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'background 0.15s',
  },
  header: {
    height: 66,
    minHeight: 66,
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-surface-glass)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 28px',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: 'var(--font-heading)',
  },
  roleSwitcherContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'var(--bg-surface-hover)',
    border: '1px solid var(--border-color)',
    padding: '6px 12px',
    borderRadius: 8,
  },
  roleSwitcherLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  },
  roleSelect: {
    appearance: 'none',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 700,
    paddingRight: 20,
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
  },
};
