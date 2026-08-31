import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Clock3 } from 'lucide-react';
import apiClient from '../api/client';

type AlertRecord = {
  id: string;
  alertType: string;
  dueDate: string;
  daysBefore: number;
  sentAt?: string | null;
  employee?: { name: string; code: string } | null;
};

const labelFor = (type: string) => type.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export const AlertCenter: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => (await apiClient.get('/api/alerts')).data as AlertRecord[],
  });
  const readMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/alerts/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });
  const alerts = data ?? [];

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bell size={26} color="var(--accent-secondary)" />
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Alert Center</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              Contract and establishment actions that need attention.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? <div style={{ padding: 40, textAlign: 'center' }}>Loading alerts…</div> : alerts.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>No alerts right now.</div>
        ) : alerts.map((alert) => (
          <div key={alert.id} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--border-color)', opacity: alert.sentAt ? 0.65 : 1 }}>
            <Clock3 size={19} color="var(--accent-secondary)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 650 }}>{labelFor(alert.alertType)}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 3 }}>
                {alert.employee ? `${alert.employee.name} (${alert.employee.code}) · ` : ''}
                Due {new Date(alert.dueDate).toLocaleDateString()} · {alert.daysBefore} days remaining
              </div>
            </div>
            {alert.sentAt ? <span className="badge badge-success">Read</span> : (
              <button className="btn btn-secondary" disabled={readMutation.isPending} onClick={() => readMutation.mutate(alert.id)}>
                <Check size={15} /> Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
