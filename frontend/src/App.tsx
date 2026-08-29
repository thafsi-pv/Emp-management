import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SimulatedAuthProvider, useAuth, type UserRole } from './context/SimulatedAuthContext';
import { Layout } from './components/Layout';
import { Login } from './views/Login';
import { Dashboard } from './views/Dashboard';
import { EmployeeDirectory } from './views/EmployeeDirectory';
import { EmployeeProfile } from './views/EmployeeProfile';
import { Attendance } from './views/Attendance';
import { LeaveManagement } from './views/LeaveManagement';
import { Appointments } from './views/Appointments';
import { Payroll } from './views/Payroll';
import { PayStructureMaster } from './views/PayStructureMaster';
import { Offboarding } from './views/Offboarding';
import { FinalSettlement } from './views/FinalSettlement';
import { Reports } from './views/Reports';
import { Settings } from './views/Settings';
import { OrgMaster } from './views/OrgMaster';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/** Route that redirects to /dashboard (or /my-profile for EMPLOYEE) if user doesn't have the required role */
const ProtectedRoute: React.FC<{
  element: React.ReactElement;
  allowedRoles: UserRole[];
}> = ({ element, allowedRoles }) => {
  const { simulatedRole } = useAuth();
  if (allowedRoles.includes(simulatedRole)) return element;
  // Redirect employees to their profile, others to dashboard
  return <Navigate to={simulatedRole === 'EMPLOYEE' ? '/my-profile' : '/dashboard'} replace />;
};

export const AppContent: React.FC = () => {
  const { token, user, simulatedRole, initialLoading, logout } = useAuth();

  if (initialLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!token) {
    return <Login />;
  }

  // Default landing page per role
  const defaultPath = simulatedRole === 'EMPLOYEE' ? '/my-profile' : '/dashboard';

  return (
    <Layout onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to={defaultPath} replace />} />

        {/* ADMIN / Staff-accessible pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              element={<Dashboard />}
              allowedRoles={['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT']}
            />
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute
              element={<EmployeeDirectory />}
              allowedRoles={['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT']}
            />
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute
              element={<EmployeeProfile />}
              allowedRoles={['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'MANAGEMENT']}
            />
          }
        />

        {/* Employee-only: own profile */}
        <Route
          path="/my-profile"
          element={<EmployeeProfile employeeId={user?.employeeId ?? null} />}
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute
              element={<Attendance />}
              allowedRoles={['ADMIN', 'SUPERVISOR', 'DEPARTMENT_OFFICER']}
            />
          }
        />
        <Route
          path="/leaves"
          element={
            <ProtectedRoute
              element={<LeaveManagement />}
              allowedRoles={['ADMIN', 'ESTABLISHMENT_OFFICER', 'SUPERVISOR', 'DEPARTMENT_OFFICER', 'EMPLOYEE']}
            />
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute
              element={<Appointments />}
              allowedRoles={['ADMIN', 'ESTABLISHMENT_OFFICER', 'MANAGEMENT']}
            />
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute
              element={<Payroll />}
              allowedRoles={['ADMIN', 'PAYROLL_OFFICER', 'MANAGEMENT']}
            />
          }
        />
        <Route
          path="/pay-master"
          element={
            <ProtectedRoute
              element={<PayStructureMaster />}
              allowedRoles={['ADMIN', 'PAYROLL_OFFICER']}
            />
          }
        />
        <Route
          path="/offboarding"
          element={
            <ProtectedRoute
              element={<Offboarding />}
              allowedRoles={['ADMIN', 'ESTABLISHMENT_OFFICER']}
            />
          }
        />
        <Route
          path="/final-settlement"
          element={
            <ProtectedRoute
              element={<FinalSettlement />}
              allowedRoles={['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER']}
            />
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute
              element={<Reports />}
              allowedRoles={['ADMIN', 'ESTABLISHMENT_OFFICER', 'PAYROLL_OFFICER', 'DEPARTMENT_OFFICER', 'MANAGEMENT']}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute
              element={<Settings />}
              allowedRoles={['ADMIN']}
            />
          }
        />
        <Route
          path="/org-master"
          element={
            <ProtectedRoute
              element={<OrgMaster />}
              allowedRoles={['ADMIN']}
            />
          }
        />

        {/* Catch-all: redirect to appropriate home */}
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <SimulatedAuthProvider>
          <AppContent />
        </SimulatedAuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
