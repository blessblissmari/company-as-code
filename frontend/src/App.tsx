import { useState } from 'react'
import { CompanyBuilder } from './components/CompanyBuilder'
import { FlowCanvas } from './components/FlowCanvas'
import { OutputViewer } from './components/OutputViewer'
import { SimulationPanel } from './components/SimulationPanel'
import { api } from './lib/api'
import { exportJson, exportYaml } from './lib/export'
import {
  Company,
  CompanyInput,
  GenerationOutput,
  SimulationResult,
} from './lib/types'

const defaultCompany: CompanyInput = {
  name: 'Acme Robotics',
  industry: 'B2B SaaS',
  size: '25',
  goals: 'Reach $1M ARR in 12 months; expand into EU; double self-serve signups.',
  strategyStyle: 'product-led',
  departments: [
    { id: 'sales-default', type: 'sales', name: 'Sales', roles: ['Head of Sales', 'AE', 'SDR'] },
    {
      id: 'marketing-default',
      type: 'marketing',
      name: 'Marketing',
      roles: ['Head of Marketing', 'Content Lead', 'Growth'],
    },
    { id: 'support-default', type: 'support', name: 'Support', roles: ['Head of Support', 'CSM'] },
  ],
}

export default function App() {
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
      const { output: gen } = await api.generate(newCompany)
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
      const { result } = await api.simulate(created, scenario, output)
      setSimulation(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setStatus('idle')
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          <span className="brand-mark">◆</span>Company-as-Code
        </h1>
        <div className="actions">
          <button
            className="btn"
            onClick={() => exportJson('company-input', company)}
            title="Export company definition as JSON"
          >
            Export JSON
          </button>
          <button
            className="btn"
            onClick={() => exportYaml('company-input', company)}
            title="Export company definition as YAML"
          >
            Export YAML
          </button>
          <button
            className="btn primary"
            onClick={runGenerate}
            disabled={status !== 'idle'}
          >
            {status === 'creating'
              ? 'Creating…'
              : status === 'generating'
                ? 'Generating…'
                : 'Generate'}
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
  )
}
