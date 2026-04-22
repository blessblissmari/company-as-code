import { useState } from 'react'
import { useI18n } from '../lib/i18n'

interface Props {
  disabled: boolean
  onRun: (scenario: string) => Promise<void> | void
  running: boolean
}

export function SimulationPanel({ disabled, onRun, running }: Props) {
  const { t } = useI18n()
  const [scenario, setScenario] = useState('')

  return (
    <div style={{ marginTop: 24 }}>
      <h2>{t.simulation}</h2>
      <div className="field">
        <label>{t.whatIfLabel}</label>
        <textarea
          placeholder={t.whatIfPlaceholder}
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {t.examples.map((ex) => (
          <span
            key={ex}
            className="pill"
            style={{ cursor: 'pointer' }}
            onClick={() => setScenario(ex)}
          >
            {ex}
          </span>
        ))}
      </div>
      <button
        className="btn primary"
        disabled={disabled || running || !scenario.trim()}
        onClick={() => onRun(scenario.trim())}
      >
        {running ? t.simulating : t.runSimulation}
      </button>
      {disabled && <div className="note">{t.createCompanyFirst}</div>}
    </div>
  )
}
