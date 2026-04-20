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
  const { startDate } = getCustomMonthRange(billingDay, date);
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
}

export function isDateInCustomMonth(dateStr: string, billingDay: number, year: number, month: number): boolean {
  const date = new Date(dateStr);
  const { startDate, endDate } = getCustomMonthRange(billingDay, new Date(year, month - 1, billingDay));
  return date >= startDate && date <= endDate;
}