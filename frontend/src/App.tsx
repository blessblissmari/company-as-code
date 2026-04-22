import { useMemo, useState } from 'react'
import { CompanyBuilder } from './components/CompanyBuilder'
import { FlowCanvas } from './components/FlowCanvas'
import { OutputViewer } from './components/OutputViewer'
import { SimulationPanel } from './components/SimulationPanel'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { api } from './lib/api'
import { exportJson, exportYaml } from './lib/export'
import { I18nContext, useLanguageState } from './lib/i18n'
import type { Dict } from './lib/i18n'
import {
  Company,
  CompanyInput,
  GenerationOutput,
  SimulationResult,
} from './lib/types'

function buildDefaultCompany(t: Dict): CompanyInput {
  return {
    name: t.defaults.companyName,
    industry: t.defaults.industry,
    size: t.defaults.size,
    goals: t.defaults.goals,
    strategyStyle: 'product-led',
    departments: [
      {
        id: 'sales-default',
        type: 'sales',
        name: t.defaults.sales,
        roles: [t.defaults.rolesHeadOfSales, t.defaults.rolesAE, t.defaults.rolesSDR],
      },
      {
        id: 'marketing-default',
        type: 'marketing',
        name: t.defaults.marketing,
        roles: [t.defaults.rolesHeadOfMarketing, t.defaults.rolesContentLead, t.defaults.rolesGrowth],
      },
      {
        id: 'support-default',
        type: 'support',
        name: t.defaults.support,
        roles: [t.defaults.rolesHeadOfSupport, t.defaults.rolesCSM],
      },
    ],
  }
}

export default function App() {
  const { lang, setLang, t } = useLanguageState()
  const defaultCompany = useMemo(() => buildDefaultCompany(t), [t])
  const [company, setCompany] = useState<CompanyInput>(defaultCompany)
  const [created, setCreated] = useState<Company | null>(null)
  const [output, setOutput] = useState<GenerationOutput | null>(null)
  const [simulation, setSimulation] = useState<SimulationResult | null>(null)
  const [status, setStatus] = useState<'idle' | 'creating' | 'generating' | 'simulating'>('idle')
  const [error, setError] = useState<string | null>(null)

  const runGenerate = async () => {
    setError(null)
    try {
      setStatus('creating')
      const { company: newCompany } = await api.createCompany(company)
      setCreated(newCompany)
      setStatus('generating')
      const { output: gen } = await api.generate(newCompany, lang)
      setOutput(gen)
      setSimulation(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setStatus('idle')
    }
  }

  const runSimulate = async (scenario: string) => {
    if (!created) return
    setError(null)
    try {
      setStatus('simulating')
      const { result } = await api.simulate(created, scenario, lang, output)
      setSimulation(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setStatus('idle')
    }
  }

  const generateLabel =
    status === 'creating' ? t.creating : status === 'generating' ? t.generating : t.generate

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      <div className="app">
        <header className="topbar">
          <h1>
            <span className="brand-mark">◆</span>
            {t.appTitle}
          </h1>
          <div className="actions">
            <LanguageSwitcher />
            <button
              className="btn"
              onClick={() => exportJson('company-input', company)}
              title={t.exportJson}
            >
              {t.exportJson}
            </button>
            <button
              className="btn"
              onClick={() => exportYaml('company-input', company)}
              title={t.exportYaml}
            >
              {t.exportYaml}
            </button>
            <button
              className="btn primary"
              onClick={runGenerate}
              disabled={status !== 'idle'}
            >
              {generateLabel}
            </button>
          </div>
        </header>

        <main className="main">
          <section className="panel">
            {error && <div className="err">{error}</div>}
            <CompanyBuilder value={company} onChange={setCompany} />
            <SimulationPanel
              disabled={!created}
              running={status === 'simulating'}
              onRun={runSimulate}
            />
          </section>

          <section className="canvas">
            <FlowCanvas company={company} />
          </section>

          <section className="panel">
            <OutputViewer output={output} simulation={simulation} companyName={company.name} />
          </section>
        </main>
      </div>
    </I18nContext.Provider>
  )
}
