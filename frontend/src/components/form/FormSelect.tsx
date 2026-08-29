import React from 'react';
import { Label } from '@/components/ui/label';

interface FormSelectProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  className,
  disabled,
}) => {
  return (
    <div className={`space-y-2 ${className || ''}`}>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className={`flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors
          focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30
          disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-destructive' : 'border-input'}`}
      >
        <option value="" disabled hidden>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
