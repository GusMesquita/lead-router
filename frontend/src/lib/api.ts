export interface LeadRecord {
  id: string;
  name: string;
  email: string;
  company: string | null;
  score: number;
  reasoning: string;
  dispatched: boolean;
  created_at: string;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: API_KEY ? { "X-API-Key": API_KEY } : {},
  });
  if (!response.ok) {
    throw new ApiError(response.status, `${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export function fetchLeads(limit = 50, offset = 0): Promise<LeadRecord[]> {
  return request<LeadRecord[]>(`/leads?limit=${limit}&offset=${offset}`);
}
