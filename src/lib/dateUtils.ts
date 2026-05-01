export function getCustomMonthRange(billingDay: number, date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  let startDate: Date;
  let endDate: Date;
  
  const currentDay = date.getDate();
  
  if (currentDay >= billingDay) {
    startDate = new Date(year, month, billingDay);
    endDate = new Date(year, month + 1, billingDay - 1);
  } else {
    startDate = new Date(year, month - 1, billingDay);
    endDate = new Date(year, month, billingDay - 1);
  }
  
  return { startDate, endDate };
}

export function formatCustomMonth(billingDay: number, date: Date = new Date()): string {
  const { endDate } = getCustomMonthRange(billingDay, date);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;
}

export function isDateInCustomMonth(dateStr: string, billingDay: number, year: number, month: number): boolean {
  // selectedMonth (year-month) is the END month of the cycle
  // Cycle runs from (previous month)/billingDay to (current month)/billingDay-1
  let startYear = year;
  let startMonth = month - 1;
  if (startMonth === 0) {
    startMonth = 12;
    startYear -= 1;
  }
  
  const startStr = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(billingDay).padStart(2, '0')}`;
  const endStr = `${year}-${String(month).padStart(2, '0')}-${String(billingDay - 1).padStart(2, '0')}`;
  
  return dateStr >= startStr && dateStr <= endStr;
}