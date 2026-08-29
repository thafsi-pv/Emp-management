import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormDatePickerProps {
  label: string;
  value: string; // ISO date string "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  fromYear?: number;
  toYear?: number;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Pick a date',
  error,
  className,
  disabled,
  required,
  fromYear = 1960,
  toYear = new Date().getFullYear() + 5,
}) => {
  const [open, setOpen] = useState(false);

  // Parse the string date, accounting for timezone issues
  const selected = value ? new Date(value + 'T00:00:00') : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
      setOpen(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-start gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal transition-colors outline-none',
            !selected ? 'text-muted-foreground' : 'text-foreground',
            error && 'border-destructive',
            'focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-ring',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
          {selected ? format(selected, 'dd/MM/yyyy') : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            captionLayout="dropdown"
            startMonth={new Date(fromYear, 0)}
            endMonth={new Date(toYear, 11)}
            defaultMonth={selected || new Date(Math.min(toYear, new Date().getFullYear()), 0)}
          />
        </PopoverContent>
      </Popover>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
};
