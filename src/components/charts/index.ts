import { lazy } from 'react';

export const CategoryPieChart = lazy(() => import('@/components/charts/CategoryPieChart').then(mod => ({ default: mod.CategoryPieChart })));
export const MonthlyTrendChart = lazy(() => import('@/components/charts/MonthlyTrendChart').then(mod => ({ default: mod.MonthlyTrendChart })));
export const ProgressRing = lazy(() => import('@/components/charts/ProgressRing').then(mod => ({ default: mod.ProgressRing })));
export const ExpenseChart = lazy(() => import('@/components/charts/ExpenseChart').then(mod => ({ default: mod.ExpenseChart })));
