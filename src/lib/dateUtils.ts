export function getCustomMonthRange(billingDay: number, date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const currentDay = date.getDate();
  
  // If current day >= billing day, we're in the cycle that starts this month
  // If current day < billing day, we're in the cycle that started last month
  let startDate: Date;
  let endDate: Date;
  
  if (currentDay >= billingDay) {
    // We're in the cycle starting this month (e.g., May 29 - June 28)
    startDate = new Date(year, month, billingDay);
    endDate = new Date(year, month + 1, billingDay - 1);
  } else {
    // We're in the cycle that started last month (e.g., Apr 29 - May 28)
    startDate = new Date(year, month - 1, billingDay);
    endDate = new Date(year, month, billingDay - 1);
  }
  
  return { startDate, endDate };
}

export function formatCustomMonth(billingDay: number, date: Date = new Date()): string {
  const { endDate } = getCustomMonthRange(billingDay, date);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  // Show the month when the cycle ENDS
  // For cycle Apr 29 - May 28, show "Maio"
  return `${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
}

export function getCustomMonthForSelection(billingDay: number, date: Date = new Date()): string {
  // Returns the month number (1-12) that should be selected
  // For billing day 29 and today May 6, the cycle is Apr 29 - May 28, so select May (5)
  const { endDate } = getCustomMonthRange(billingDay, date);
  return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`;
}

export function isDateInCustomMonth(dateStr: string, billingDay: number, year: number, month: number): boolean {
  // month is 1-indexed (1=January, 12=December)
  // For billing day 29 and month=5 (May), the cycle is Apr 29 - May 28
  const cycleStart = new Date(year, month - 2, billingDay); // Previous month, billing day
  const cycleEnd = new Date(year, month - 1, billingDay - 1); // Current month, day before billing day
  
  const date = new Date(dateStr);
  return date >= cycleStart && date <= cycleEnd;
}