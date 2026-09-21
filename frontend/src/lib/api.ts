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

// Sem chave de API aqui, de propósito. Tudo que passa por import.meta.env.VITE_*
// é inlinado no bundle em build time e fica legível para qualquer visitante —
// enviar o segredo do serviço daqui seria publicá-lo.
//
// Este dashboard fala com um backend em ENVIRONMENT=dev, onde a auth está
// desligada. Para apontar para uma instância autenticada, a chamada precisa
// sair de um servidor: é o BFF (Route Handler do Next) previsto na Fatia 5.
async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) {
    throw new ApiError(response.status, `${path} failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export function fetchLeads(limit = 50, offset = 0): Promise<LeadRecord[]> {
  return request<LeadRecord[]>(`/leads?limit=${limit}&offset=${offset}`);
}
