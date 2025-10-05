// Simple debounce function to limit the rate at which a function gets called.
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !DATE_REGEX.test(dateStr)) {
        console.warn(`Invalid date format provided: "${dateStr}". Expected YYYY-MM-DD.`);
        return null;
    }
    return new Date(`${dateStr}T00:00:00Z`);
}

export const formatDate = (dateStr: string, options?: Intl.DateTimeFormatOptions): string => {
    const date = parseDate(dateStr);
    if (!date) return 'Invalid Date';
    const defaultOptions: Intl.DateTimeFormatOptions = { timeZone: 'UTC', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
}

export const formatDateRange = (startDateStr: string, endDateStr: string): string => {
    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (!startDate || !endDate) return '';
    
    if (startDateStr === endDateStr) {
      return formatDate(startDateStr, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    const startYear = startDate.getUTCFullYear();
    const endYear = endDate.getUTCFullYear();
    
    if (startYear === endYear) {
      // e.g. "Mar 4 - Oct 1, 2024"
      const formattedStart = formatDate(startDateStr, { month: 'short', day: 'numeric' });
      const formattedEnd = formatDate(endDateStr, { year: 'numeric', month: 'short', day: 'numeric' });
      return `${formattedStart} - ${formattedEnd}`;
    } else {
      // e.g. "Mar 4, 2023 - Oct 1, 2024"
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      const formattedStart = formatDate(startDateStr, options);
      const formattedEnd = formatDate(endDateStr, options);
      return `${formattedStart} - ${formattedEnd}`;
    }
}


export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(undefined, options).format(num);
};

// Generates a vibrant, consistent color palette
export const generateChartColors = (numColors: number): string[] => {
    const colors: string[] = [];
    const hueStep = 360 / numColors;
    for (let i = 0; i < numColors; i++) {
        // Using HSL for vibrant, evenly spaced colors
        // Adjust saturation (70%) and lightness (60%) for good visibility on a dark theme
        const hue = (hueStep * i + 240) % 360; // Start near blue/indigo for consistency
        colors.push(`hsl(${hue}, 70%, 60%)`);
    }
    return colors;
};
