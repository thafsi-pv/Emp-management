import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput: React.FC<FormInputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label>{label}</Label>
      <Input {...props} className={error ? 'border-destructive' : ''} />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
