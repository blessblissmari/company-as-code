export type StrategyStyle =
  | 'aggressive-growth'
  | 'lean-efficiency'
  | 'customer-obsessed'
  | 'product-led'
  | 'enterprise-sales'

export interface Department {
  id: string
  type: 'sales' | 'marketing' | 'support' | 'custom'
  name: string
  roles: string[]
  notes?: string
}

export interface CompanyInput {
  name: string
  industry: string
  size: string
  goals: string
  strategyStyle: StrategyStyle
  departments: Department[]
}

export interface Company extends CompanyInput {
  id: string
  createdAt: string
}

export interface Playbook {
  department: string
  title: string
  steps: string[]
}

export interface Workflow {
  name: string
  owner: string
  triggers: string[]
  steps: { step: string; responsible: string }[]
}

export interface SOP {
  title: string
  department: string
  purpose: string
  procedure: string[]
}

export interface GenerationOutput {
  playbooks: Playbook[]
  workflows: Workflow[]
  sops: SOP[]
  orgStructure: { role: string; reportsTo: string | null; department: string }[]
  bottlenecks: string[]
  optimizations: string[]
}

export interface SimulationResult {
  scenario: string
  impacts: { area: string; effect: string; severity: 'low' | 'medium' | 'high' }[]
  recommendations: string[]
}
