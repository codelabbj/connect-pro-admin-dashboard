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

export const getImageUrl = (path: string | null) => {
  if (!path) return null;
  // If it's already a full URL, return it
  if (path.startsWith('http')) return path;

  // Otherwise, prefix it with your API Base URL
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  const cleanPath = path.toString().replace(/^\//, "");
  return `${baseUrl}/${cleanPath}`;
};
