import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { Settings as SettingsIcon, Save, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput } from '@/components/form/FormInput';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
}

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch settings from API
  const { data: settingsRes, isLoading } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: async () => {
      const res = await apiClient.get('/api/settings');
      return res.data;
    },
  });

  const settings: SystemSetting[] = settingsRes?.data || settingsRes || [];

  useEffect(() => {
    if (settings.length > 0) {
      const initial: Record<string, string> = {};
      settings.forEach((s) => {
        initial[s.key] = s.value;
      });
      setFormState(initial);
    }
  }, [settingsRes]);

  // Bulk update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: { key: string; value: string }[]) => {
      const res = await apiClient.put('/api/settings', { settings: payload });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleChange = (key: string, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = Object.entries(formState).map(([key, value]) => ({ key, value }));
    updateMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <SettingsIcon size={32} className="text-primary" />
          <div>
            <CardTitle>Master System Settings & Constants</CardTitle>
            <CardDescription>
              Configure global rates, service break milestone limits, OT multipliers, and system behaviors.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {saveSuccess && (
        <Alert variant="default" className="border-success text-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 stroke-success" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Settings saved successfully!</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.map((s) => (
                  <div key={s.id} className="flex flex-col space-y-1">
                    <FormInput
                      label={s.key}
                      value={formState[s.key] ?? s.value}
                      onChange={(e) => handleChange(s.key, e.target.value)}
                    />
                    <span className="text-xs text-muted-foreground">{s.description}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
                  <Save size={16} />
                  {updateMutation.isPending ? 'Saving Settings...' : 'Save All Settings'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
