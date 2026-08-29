import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { DollarSign, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Designation {
  id: string;
  name: string;
  code: string;
  payType: 'DAILY' | 'MONTHLY';
  basicPay: number;
  weightage: number;
  allowance: number;
  otRate: number;
}

export const PayStructureMaster: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDesigId, setSelectedDesigId] = useState('');
  const [payType, setPayType] = useState<'DAILY' | 'MONTHLY'>('MONTHLY');
  const [basicPay, setBasicPay] = useState('0');
  const [weightage, setWeightage] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [otRate, setOtRate] = useState('0');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch designations
  const { data: desigRes, isLoading } = useQuery({
    queryKey: ['designationsPayMaster'],
    queryFn: async () => {
      const res = await apiClient.get('/api/designations');
      return res.data;
    },
  });

  // Save pay structure mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/api/pay-structures', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designationsPayMaster'] });
      setMsg({ type: 'success', text: 'Pay structure saved successfully!' });
      setTimeout(() => setMsg(null), 3000);
    },
    onError: (err: any) => {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save pay structure' });
    },
  });

  const designations: Designation[] = desigRes?.data || [];

  const handleSelectDesignation = (desig: Designation) => {
    setSelectedDesigId(desig.id);
    setPayType(desig.payType || 'MONTHLY');
    setBasicPay(String(desig.basicPay || 0));
    setWeightage(String(desig.weightage || 0));
    setAllowance(String(desig.allowance || 0));
    setOtRate(String(desig.otRate || 0));
    setMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesigId) return;

    saveMutation.mutate({
      designationId: selectedDesigId,
      payType,
      basicPay: parseFloat(basicPay),
      weightage: parseFloat(weightage),
      allowance: parseFloat(allowance),
      otRate: parseFloat(otRate),
      effectiveFrom,
    });
  };

  return (
    <div style={styles.container}>
      <div className="card flex-between" style={{ padding: '20px 24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Designation Pay Structure Master</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Configure default Daily vs Monthly pay rates, weightage, allowances, and OT rates per designation.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column: Designation Selector */}
        <div className="card" style={{ padding: 0 }}>
          <div style={styles.headerTitle}>Select Designation</div>
          {isLoading ? (
            <div style={styles.loader}><div style={styles.spinner} /></div>
          ) : (
            <div style={styles.list}>
              {designations.map((d) => (
                <div
                  key={d.id}
                  onClick={() => handleSelectDesignation(d)}
                  style={{
                    ...styles.listItem,
                    ...(selectedDesigId === d.id ? styles.listItemActive : {}),
                  }}
                >
                  <div>
                    <strong style={{ display: 'block' }}>{d.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.code}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`badge badge-${d.payType === 'DAILY' ? 'warning' : 'info'}`} style={{ fontSize: '10px' }}>
                      {d.payType || 'MONTHLY'}
                    </span>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
                      ₹ {d.basicPay?.toLocaleString() || 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Edit Pay Structure Form */}
        <div className="card">
          <h4 style={styles.formTitle}>
            {selectedDesigId ? 'Edit Designation Pay Rates' : 'Select a designation from the list to edit'}
          </h4>

          {msg && (
            <div style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '16px',
              backgroundColor: msg.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
              color: msg.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              {msg.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />}
              {msg.text}
            </div>
          )}

          {selectedDesigId ? (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div className="form-group">
                <label className="form-label">Pay Wage Model *</label>
                <select className="form-select" value={payType} onChange={(e) => setPayType(e.target.value as any)}>
                  <option value="MONTHLY">Monthly Salary Model</option>
                  <option value="DAILY">Daily Wage Model</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Basic Pay (₹) *</label>
                  <input type="number" step="0.01" className="form-input" value={basicPay} onChange={(e) => setBasicPay(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Special Weightage (₹)</label>
                  <input type="number" step="0.01" className="form-input" value={weightage} onChange={(e) => setWeightage(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Standard Allowance (₹)</label>
                  <input type="number" step="0.01" className="form-input" value={allowance} onChange={(e) => setAllowance(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">OT Hourly Rate (₹)</label>
                  <input type="number" step="0.01" className="form-input" value={otRate} onChange={(e) => setOtRate(e.target.value)} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Effective Date *</label>
                <input type="date" className="form-input" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: '12px', gap: '8px' }} disabled={saveMutation.isPending}>
                <Save size={16} />
                {saveMutation.isPending ? 'Saving...' : 'Save Pay Structure'}
              </button>
            </form>
          ) : (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <DollarSign size={40} color="var(--text-muted)" />
              <p style={{ marginTop: '12px' }}>Please choose a designation to configure wage parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px' },
  headerTitle: { padding: '16px 24px', fontSize: '15px', fontWeight: 700, borderBottom: '1px solid var(--border-color)' },
  list: { display: 'flex', flexDirection: 'column' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'var(--transition-smooth)' },
  listItemActive: { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid var(--accent-secondary)' },
  formTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  loader: { display: 'flex', justifyContent: 'center', padding: '60px' },
  spinner: { width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--accent-secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};
