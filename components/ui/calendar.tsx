"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { format, parse, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

export type CalendarProps = {
  value?: Date;
  onChange?: (date: Date) => void;
  className?: string;
  disabled?: boolean;
}

export function Calendar({
  value,
  onChange,
  className,
  disabled = false,
}: CalendarProps) {
  const [month, setMonth] = React.useState(value ? value.getMonth() : new Date().getMonth());
  const [day, setDay] = React.useState(value ? value.getDate().toString() : '');
  const [year, setYear] = React.useState(value ? value.getFullYear().toString() : new Date().getFullYear().toString());
  const [time, setTime] = React.useState(value ? format(value, 'HH:mm') : '00:00');
  const [error, setError] = React.useState('');

  const validateAndSubmit = () => {
    if (!month || !day || !year) {
      setError('All fields are required');
      return;
    }

    const dateStr = `${MONTHS[month]} ${day}, ${year}`;
    const parsedDate = parse(dateStr, 'MMMM d, yyyy', new Date());
    
    if (!isValid(parsedDate)) {
      setError('Invalid date');
      return;
    }

    const today = new Date();
    if (parsedDate < today) {
      setError('Date cannot be in the past');
      return;
    }

    // Set the time
    const [hours, minutes] = time.split(':');
    parsedDate.setHours(parseInt(hours, 10));
    parsedDate.setMinutes(parseInt(minutes, 10));

    onChange?.(parsedDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("h-8 px-2", className)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Select value={month.toString()} onValueChange={(v) => setMonth(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="number"
              placeholder="Day"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              min="1"
              max={getDaysInMonth(month, parseInt(year) || new Date().getFullYear())}
              className="w-20"
            />
            <Input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={new Date().getFullYear()}
              className="w-24"
            />
          </div>

          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full"
          />

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">Cancel</Button>
            <Button size="sm" className="flex-1" onClick={validateAndSubmit}>Confirm</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 