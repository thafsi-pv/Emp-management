import React, { useState } from 'react';
import { useAuth } from '../context/SimulatedAuthContext';
import { Lock, Mail, ShieldAlert, Loader2 } from 'lucide-react';
import ShootingStars from '../components/animata/background/shooting-stars';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@hospital.in');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Incorrect credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShootingStars className="min-h-screen">
      {/* Login card centred over the star field */}
      <div style={styles.overlay}>
        <div className="card animated-fade-in glass-card" style={styles.loginCard}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>HDS</div>
          <h2 style={styles.title}>Welcome to AMITY</h2>
          <p style={styles.subtitle}>Sign in to manage Payroll &amp; Establishment</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <ShieldAlert size={18} color="var(--color-danger)" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-input glass-input"
                placeholder="e.g. admin@hospital.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className="form-input glass-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          {/* Animated submit button — shrinks to icon pill when loading */}
          <div style={styles.submitRow}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={submitting ? styles.btnLoading : styles.btnNormal}
            >
              {submitting ? (
                <Loader2
                  size={20}
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div style={styles.helpText}>
          <p>Demo Logins:</p>
          <div style={styles.demoGrid}>
            <div>Admin: <strong>admin@hospital.in</strong> / admin123</div>
            <div>Supervisor: <strong>supervisor@hospital.in</strong> / super123</div>
            <div>Employee: <strong>ramesh@hospital.in</strong> / emp123</div>
          </div>
        </div>
        </div>
      </div>
    </ShootingStars>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
  },
  loginCard: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '440px',
    padding: '40px',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg), 0 0 30px rgba(99, 102, 241, 0.1)',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '24px',
    textAlign: 'center',
  },
  logoIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    background: 'var(--accent-gradient)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    color: '#fff',
    fontSize: '16px',
    boxShadow: 'var(--shadow-glow)',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    marginBottom: '4px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'var(--color-danger-bg)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    color: 'var(--color-danger)',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  submitRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '16px',
  },
  // Normal full-width button
  btnNormal: {
    width: '100%',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  // Shrunk pill / circle when loading
  btnLoading: {
    width: '44px',
    height: '44px',
    padding: '0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minWidth: 'unset',
    overflow: 'hidden',
  },
  helpText: {
    marginTop: '24px',
    fontSize: '11px',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '16px',
  },
  demoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '6px',
  },
};
