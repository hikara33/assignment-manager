export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  path: string;
  timestamp: string;
}
