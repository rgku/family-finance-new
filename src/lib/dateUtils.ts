// ============================================
// DATE UTILS - BILLING CYCLE LOGIC
// ============================================
// Rule: If billing day is 28, each month runs from 28th to 27th of next month
// Example: "May" cycle = April 28 to May 27
// The displayed month is the END month (where you spend/receive money)

export function getCustomMonthRange(billingDay: number, date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = January, 4 = May)
  const currentDay = date.getDate();
  
  // Determine which cycle we're in based on current day
  let cycleStartYear: number;
  let cycleStartMonth: number; // 0-indexed
  let cycleEndYear: number;
  let cycleEndMonth: number; // 0-indexed
  
  if (currentDay >= billingDay) {
    // We're AFTER or ON the billing day in current month
    // Cycle started this month on billingDay, ends next month on billingDay-1
    // Example: May 28 → June 27 = "June" cycle
    cycleStartYear = year;
    cycleStartMonth = month;
    cycleEndYear = year;
    cycleEndMonth = month + 1;
  } else {
    // We're BEFORE the billing day in current month
    // Cycle started previous month on billingDay, ends this month on billingDay-1
    // Example: May 1 with billing day 28 → Cycle is April 28 → May 27 = "May" cycle
    cycleStartYear = month === 0 ? year - 1 : year;
    cycleStartMonth = month === 0 ? 11 : month - 1;
    cycleEndYear = year;
    cycleEndMonth = month;
  }
  
  const startDate = new Date(cycleStartYear, cycleStartMonth, billingDay);
  const endDate = new Date(cycleEndYear, cycleEndMonth, billingDay - 1);
  
  return { startDate, endDate, displayMonth: cycleEndMonth, displayYear: cycleEndYear };
}

export function formatCustomMonth(billingDay: number, date: Date = new Date()): string {
  const { displayMonth, displayYear } = getCustomMonthRange(billingDay, date);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${monthNames[displayMonth]} ${displayYear}`;
}

export function isDateInCustomMonth(dateStr: string, billingDay: number, displayYear: number, displayMonth: number): boolean {
  // displayMonth is 1-indexed (1-12), convert to 0-indexed
  const displayMonthIdx = displayMonth - 1;
  
  // Calculate cycle start and end based on display month
  // If display month is May (4), cycle is April 28 → May 27
  let cycleStartYear = displayYear;
  let cycleStartMonth = displayMonthIdx - 1; // Previous month
  if (cycleStartMonth < 0) {
    cycleStartMonth = 11;
    cycleStartYear -= 1;
  }
  
  const cycleEndYear = displayYear;
  const cycleEndMonth = displayMonthIdx;
  
  // Create date strings for comparison (YYYY-MM-DD format)
  const startStr = `${cycleStartYear}-${String(cycleStartMonth + 1).padStart(2, '0')}-${String(billingDay).padStart(2, '0')}`;
  const endStr = `${cycleEndYear}-${String(cycleEndMonth + 1).padStart(2, '0')}-${String(billingDay - 1).padStart(2, '0')}`;
  
  return dateStr >= startStr && dateStr <= endStr;
}

export function getCustomMonthForDate(dateStr: string, billingDay: number): { year: number, month: number } {
  // Given a transaction date, determine which billing cycle month it belongs to
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  if (day >= billingDay) {
    // Transaction is on or after billing day → belongs to NEXT month
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    return { year: nextYear, month: nextMonth + 1 }; // Return 1-indexed month
  } else {
    // Transaction is before billing day → belongs to CURRENT month
    return { year, month: month + 1 }; // Return 1-indexed month
  }
}
