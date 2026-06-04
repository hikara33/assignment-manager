import { WorkloadResult } from './workload.interface';

export interface DashboardResult {
  workload: WorkloadResult;
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  urgent: number;
}
