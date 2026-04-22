import { useState } from 'react'
import { GenerationOutput, SimulationResult } from '../lib/types'
import { exportJson, exportYaml } from '../lib/export'
import { useI18n } from '../lib/i18n'

interface Props {
  output: GenerationOutput | null
  simulation: SimulationResult | null
  companyName: string
}

type Tab = 'playbooks' | 'workflows' | 'sops' | 'org' | 'insights' | 'simulation'

export function OutputViewer({ output, simulation, companyName }: Props) {
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('playbooks')

  if (!output && !simulation) {
    return (
      <div className="output">
        <h2>{t.aiOutput}</h2>
        <div className="empty">{t.emptyOutput}</div>
      </div>
    )
  }

  const base = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'company'

  const tabLabels: Record<Tab, string> = {
    playbooks: t.tabPlaybooks,
    workflows: t.tabWorkflows,
    sops: t.tabSops,
    org: t.tabOrg,
    insights: t.tabInsights,
    simulation: t.tabSimulation,
  }

  return (
    <div className="output">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{t.aiOutput}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn"
            onClick={() => exportJson(base, { output, simulation })}
            disabled={!output && !simulation}
          >
            JSON
          </button>
          <button
            className="btn"
            onClick={() => exportYaml(base, { output, simulation })}
            disabled={!output && !simulation}
          >
            YAML
          </button>
        </div>
      </div>

      <div className="tabs">
        {(Object.keys(tabLabels) as Tab[]).map((k) => (
          <div
            key={k}
            className={`tab ${tab === k ? 'active' : ''}`}
            onClick={() => setTab(k)}
          >
            {tabLabels[k]}
          </div>
        ))}
      </div>

      {tab === 'playbooks' && (
        <div>
          {output?.playbooks?.length ? (
            output.playbooks.map((p, i) => (
              <div className="dept-card" key={i}>
                <div className="dept-card-head">
                  <strong>{p.title}</strong>
                  <span className="badge">{p.department}</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                  {p.steps.map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              </div>
            ))
          ) : (
            <div className="empty">{t.noPlaybooks}</div>
          )}
        </div>
      )}

      {tab === 'workflows' && (
        <div>
          {output?.workflows?.length ? (
            output.workflows.map((w, i) => (
              <div className="dept-card" key={i}>
                <div className="dept-card-head">
                  <strong>{w.name}</strong>
                  <span className="badge">{t.owner}: {w.owner}</span>
                </div>
                <div className="note">{t.triggers}: {w.triggers.join(', ') || '—'}</div>
                <ol style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                  {w.steps.map((s, j) => (
                    <li key={j}>
                      {s.step} <span className="pill">{s.responsible}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))
          ) : (
            <div className="empty">{t.noWorkflows}</div>
          )}
        </div>
      )}

      {tab === 'sops' && (
        <div>
          {output?.sops?.length ? (
            output.sops.map((s, i) => (
              <div className="dept-card" key={i}>
                <div className="dept-card-head">
                  <strong>{s.title}</strong>
                  <span className="badge">{s.department}</span>
                </div>
                <div className="note">{t.purpose}: {s.purpose}</div>
                <ol style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                  {s.procedure.map((p, j) => <li key={j}>{p}</li>)}
                </ol>
              </div>
            ))
          ) : (
            <div className="empty">{t.noSops}</div>
          )}
        </div>
      )}

      {tab === 'org' && (
        <div>
          {output?.orgStructure?.length ? (
            <pre>{JSON.stringify(output.orgStructure, null, 2)}</pre>
          ) : (
            <div className="empty">{t.noOrg}</div>
          )}
        </div>
      )}

      {tab === 'insights' && (
        <div>
          <h3>{t.bottlenecks}</h3>
          {output?.bottlenecks?.length ? (
            <ul style={{ paddingLeft: 18, fontSize: 13 }}>
              {output.bottlenecks.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          ) : (
            <div className="empty">{t.noBottlenecks}</div>
          )}
          <h3>{t.optimizations}</h3>
          {output?.optimizations?.length ? (
            <ul style={{ paddingLeft: 18, fontSize: 13 }}>
              {output.optimizations.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          ) : (
            <div className="empty">{t.noOptimizations}</div>
          )}
        </div>
      )}

      {tab === 'simulation' && (
        <div>
          {simulation ? (
            <div className="dept-card">
              <div className="dept-card-head">
                <strong>{t.scenario}</strong>
              </div>
              <div className="note">{simulation.scenario}</div>
              <h3>{t.impacts}</h3>
              {simulation.impacts.map((im, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 6 }}>
                  <span className="pill">{im.severity}</span>
                  <strong>{im.area}:</strong> {im.effect}
                </div>
              ))}
              <h3>{t.recommendations}</h3>
              <ul style={{ paddingLeft: 18, fontSize: 13 }}>
                {simulation.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          ) : (
            <div className="empty">{t.runSimFromLeft}</div>
          )}
        </div>
      )}
    </div>
  )
}
