import { Department, CompanyInput, StrategyStyle } from '../lib/types'
import { useI18n } from '../lib/i18n'

interface Props {
  value: CompanyInput
  onChange: (v: CompanyInput) => void
}

const STRATEGY_VALUES: StrategyStyle[] = [
  'aggressive-growth',
  'lean-efficiency',
  'customer-obsessed',
  'product-led',
  'enterprise-sales',
]

export function CompanyBuilder({ value, onChange }: Props) {
  const { t } = useI18n()
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
      sales: {
        name: t.defaults.sales,
        roles: [t.defaults.rolesHeadOfSales, t.defaults.rolesAE, t.defaults.rolesSDR],
      },
      marketing: {
        name: t.defaults.marketing,
        roles: [t.defaults.rolesHeadOfMarketing, t.defaults.rolesContentLead, t.defaults.rolesGrowth],
      },
      support: {
        name: t.defaults.support,
        roles: [t.defaults.rolesHeadOfSupport, t.defaults.rolesCSM],
      },
      custom: { name: t.defaults.deptNew, roles: [t.defaults.rolesLead] },
    }
    const preset = defaults[type]
    update({
      departments: [...value.departments, { id, type, name: preset.name, roles: preset.roles }],
    })
  }

  return (
    <div>
      <h2>{t.company}</h2>
      <div className="field">
        <label>{t.name}</label>
        <input value={value.name} onChange={(e) => update({ name: e.target.value })} />
      </div>
      <div className="field">
        <label>{t.industry}</label>
        <input value={value.industry} onChange={(e) => update({ industry: e.target.value })} />
      </div>
      <div className="field">
        <label>{t.teamSize}</label>
        <input value={value.size} onChange={(e) => update({ size: e.target.value })} />
      </div>
      <div className="field">
        <label>{t.goals}</label>
        <textarea value={value.goals} onChange={(e) => update({ goals: e.target.value })} />
      </div>
      <div className="field">
        <label>{t.strategyStyle}</label>
        <select
          value={value.strategyStyle}
          onChange={(e) => update({ strategyStyle: e.target.value as StrategyStyle })}
        >
          {STRATEGY_VALUES.map((s) => (
            <option key={s} value={s}>
              {t.strategyOptions[s]}
            </option>
          ))}
        </select>
      </div>

      <h3>{t.departments}</h3>
      {value.departments.map((d) => (
        <div key={d.id} className="dept-card">
          <div className="dept-card-head">
            <strong>{d.name}</strong>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="badge">{d.type}</span>
              <button className="btn ghost" onClick={() => removeDept(d.id)} aria-label={t.removeAria}>
                ×
              </button>
            </div>
          </div>
          <div className="field">
            <label>{t.name}</label>
            <input value={d.name} onChange={(e) => updateDept(d.id, { name: e.target.value })} />
          </div>
          <div className="field">
            <label>{t.rolesLabel}</label>
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
        <button className="btn" onClick={() => addDept('sales')}>{t.addSales}</button>
        <button className="btn" onClick={() => addDept('marketing')}>{t.addMarketing}</button>
        <button className="btn" onClick={() => addDept('support')}>{t.addSupport}</button>
        <button className="btn" onClick={() => addDept('custom')}>{t.addCustom}</button>
      </div>
    </div>
  )
}
