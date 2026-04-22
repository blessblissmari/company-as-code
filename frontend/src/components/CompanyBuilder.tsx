import { Department, CompanyInput, StrategyStyle } from '../lib/types'

interface Props {
  value: CompanyInput
  onChange: (v: CompanyInput) => void
}

const STRATEGY_OPTIONS: { value: StrategyStyle; label: string }[] = [
  { value: 'aggressive-growth', label: 'Aggressive Growth' },
  { value: 'lean-efficiency', label: 'Lean Efficiency' },
  { value: 'customer-obsessed', label: 'Customer-Obsessed' },
  { value: 'product-led', label: 'Product-Led' },
  { value: 'enterprise-sales', label: 'Enterprise Sales' },
]

export function CompanyBuilder({ value, onChange }: Props) {
  const update = (patch: Partial<CompanyInput>) => onChange({ ...value, ...patch })

  const updateDept = (id: string, patch: Partial<Department>) => {
    update({
      departments: value.departments.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })
  }

  const removeDept = (id: string) => {
    update({ departments: value.departments.filter((d) => d.id !== id) })
  }

  const addDept = (type: Department['type']) => {
    const id = `${type}-${Date.now()}`
    const defaults: Record<Department['type'], { name: string; roles: string[] }> = {
      sales: { name: 'Sales', roles: ['Head of Sales', 'Account Executive', 'SDR'] },
      marketing: { name: 'Marketing', roles: ['Head of Marketing', 'Content Lead', 'Growth'] },
      support: { name: 'Support', roles: ['Head of Support', 'Support Lead', 'CSM'] },
      custom: { name: 'New Department', roles: ['Lead'] },
    }
    const preset = defaults[type]
    update({
      departments: [...value.departments, { id, type, name: preset.name, roles: preset.roles }],
    })
  }

  return (
    <div>
      <h2>Company</h2>
      <div className="field">
        <label>Name</label>
        <input
          value={value.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Acme Robotics"
        />
      </div>
      <div className="field">
        <label>Industry</label>
        <input
          value={value.industry}
          onChange={(e) => update({ industry: e.target.value })}
          placeholder="B2B SaaS, FinTech, ..."
        />
      </div>
      <div className="field">
        <label>Team size</label>
        <input
          value={value.size}
          onChange={(e) => update({ size: e.target.value })}
          placeholder="10, 50, 200+"
        />
      </div>
      <div className="field">
        <label>Goals</label>
        <textarea
          value={value.goals}
          onChange={(e) => update({ goals: e.target.value })}
          placeholder="Reach $1M ARR in 12 months; expand to EU; improve NPS..."
        />
      </div>
      <div className="field">
        <label>Strategy style</label>
        <select
          value={value.strategyStyle}
          onChange={(e) => update({ strategyStyle: e.target.value as StrategyStyle })}
        >
          {STRATEGY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <h3>Departments</h3>
      {value.departments.map((d) => (
        <div key={d.id} className="dept-card">
          <div className="dept-card-head">
            <strong>{d.name}</strong>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="badge">{d.type}</span>
              <button className="btn ghost" onClick={() => removeDept(d.id)} aria-label="remove">
                ×
              </button>
            </div>
          </div>
          <div className="field">
            <label>Name</label>
            <input value={d.name} onChange={(e) => updateDept(d.id, { name: e.target.value })} />
          </div>
          <div className="field">
            <label>Roles (comma-separated)</label>
            <input
              value={d.roles.join(', ')}
              onChange={(e) =>
                updateDept(d.id, {
                  roles: e.target.value
                    .split(',')
                    .map((r) => r.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button className="btn" onClick={() => addDept('sales')}>+ Sales</button>
        <button className="btn" onClick={() => addDept('marketing')}>+ Marketing</button>
        <button className="btn" onClick={() => addDept('support')}>+ Support</button>
        <button className="btn" onClick={() => addDept('custom')}>+ Custom</button>
      </div>
    </div>
  )
}
