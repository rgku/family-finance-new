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
  
  console.log('[getCustomMonthRange] Input:', { billingDay, date: date.toISOString(), year, month, currentDay });
  
  let cycleStartYear: number;
  let cycleStartMonth: number; // 0-indexed
  let cycleEndYear: number;
  let cycleEndMonth: number; // 0-indexed
  
  if (currentDay >= billingDay) {
    // We're ON or AFTER the billing day in current month
    // Cycle started THIS month on billingDay, ends NEXT month on billingDay-1
    // Example: May 28 → June 27 = "June" cycle (display June)
    cycleStartYear = year;
    cycleStartMonth = month;
    cycleEndYear = month === 11 ? year + 1 : year;
    cycleEndMonth = month === 11 ? 0 : month + 1;
    console.log('[getCustomMonthRange] Path: currentDay >= billingDay');
  } else {
    // We're BEFORE the billing day in current month
    // Cycle started PREVIOUS month on billingDay, ends THIS month on billingDay-1
    // Example: May 1 with billing day 28 → Cycle is April 28 → May 27 = "May" cycle (display May)
    cycleStartYear = month === 0 ? year - 1 : year;
    cycleStartMonth = month === 0 ? 11 : month - 1;
    cycleEndYear = year;
    cycleEndMonth = month;
    console.log('[getCustomMonthRange] Path: currentDay < billingDay');
  }
  
  const startDate = new Date(cycleStartYear, cycleStartMonth, billingDay);
  const endDate = new Date(cycleEndYear, cycleEndMonth, billingDay - 1);
  
  console.log('[getCustomMonthRange] Result:', {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    displayMonth: cycleEndMonth,
    displayYear: cycleEndYear,
    displayMonthName: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"][cycleEndMonth]
  });
  
  // displayMonth is 0-indexed (the month where cycle ENDS)
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
  
  // Calculate cycle start based on display month
  // If display month is May (index 4), cycle started April 28
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
  const endDay = billingDay - 1;
  const endMonth = cycleEndMonth + 1;
  const endStr = `${cycleEndYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
  
  return dateStr >= startStr && dateStr <= endStr;
}

export function getCustomMonthForDate(dateStr: string, billingDay: number): { year: number, month: number } {
  // Given a transaction date, determine which billing cycle month it belongs to
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
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
