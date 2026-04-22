import type {
  Company,
  CompanyInput,
  GenerationOutput,
  SimulationResult,
} from './types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}: ${text || path}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  createCompany: (input: CompanyInput) =>
    request<{ company: Company }>('/company/create', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  generate: (companyId: string) =>
    request<{ output: GenerationOutput }>('/company/generate', {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    }),
  simulate: (companyId: string, scenario: string) =>
    request<{ result: SimulationResult }>('/company/simulate', {
      method: 'POST',
      body: JSON.stringify({ companyId, scenario }),
    }),
  getCompany: (id: string) => request<{ company: Company; output?: GenerationOutput }>(`/company/${id}`),
}
