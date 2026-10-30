/**
 * Converts 24-hour time format to 12-hour format with AM/PM
 * @param time - Time string in various formats (e.g., "14:30", "8:00am", "08:00")
 * @returns Time in 12-hour format (e.g., "2:30 PM", "8:00 AM")
 */
export function formatTo12Hour(time: string): string {
  if (!time) return time;
  
  // Already has AM/PM - just clean it up
  if (/am|pm/i.test(time)) {
    return time.replace(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i, (_, h, m, period) => {
      const hour = parseInt(h, 10);
      const minutes = m || "00";
      return `${hour}:${minutes} ${period.toUpperCase()}`;
    });
  }
  
  // Parse 24-hour format
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;
  
  let hour = parseInt(match[1], 10);
  const minutes = match[2];
  
  if (hour < 0 || hour > 23) return time;
  
  const period = hour >= 12 ? "PM" : "AM";
  
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour = hour - 12;
  }
  
  return `${hour}:${minutes} ${period}`;
}
