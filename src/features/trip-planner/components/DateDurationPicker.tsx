import { useState, useCallback } from "react";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateDurationPickerProps {
  onConfirm: (startDate: Date, endDate: Date, days: number) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function DateDurationPicker({ onConfirm, onCancel, isOpen }: DateDurationPickerProps) {
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const endDate = addDays(startDate, days - 1);

  const handleDaysChange = useCallback((delta: number) => {
    setDays(prev => Math.min(14, Math.max(1, prev + delta)));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(startDate, endDate, days);
  }, [onConfirm, startDate, endDate, days]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="bg-card border border-border rounded-xl p-4 shadow-lg max-w-sm mx-auto"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Plan your trip
      </h3>

      {/* Days selector */}
      <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
        <span className="text-sm text-muted-foreground">Number of days</span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleDaysChange(-1)}
            disabled={days <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-6 text-center">{days}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleDaysChange(1)}
            disabled={days >= 14}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Date picker */}
      <div className="mb-4">
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                if (date) {
                  setStartDate(date);
                  setShowCalendar(false);
                }
              }}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Optional note */}
      <p className="text-xs text-muted-foreground mb-4">
        You can adjust the dates and duration later
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="default"
          className="flex-1"
          onClick={handleConfirm}
        >
          Generate
        </Button>
      </div>
    </motion.div>
  );
}
