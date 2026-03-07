import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatApiDateTime(dateString: string | undefined | null) {
  if (!dateString) return "-";
  try {
    // If the date string has a timezone 'Z' and 'T', replace 'T' with space and remove everything from fractional seconds onwards
    if (dateString.includes('T')) {
      return dateString.replace('T', ' ').split('.')[0].replace('Z', '');
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString("en-GB").replace(',', ''); // fallback to standard format if it's a normal string
  } catch {
    return dateString;
  }
}
