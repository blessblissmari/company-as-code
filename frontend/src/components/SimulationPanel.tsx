import { useState } from 'react'

interface Props {
  disabled: boolean
  onRun: (scenario: string) => Promise<void> | void
  running: boolean
}

const EXAMPLES = [
  'Lose our top sales rep next month',
  'Marketing budget cut by 40% for Q2',
  'Support team grows 3x in 6 months',
  'Launch a new enterprise tier',
]

export function SimulationPanel({ disabled, onRun, running }: Props) {
  const [scenario, setScenario] = useState('')

  return (
    <div style={{ marginTop: 24 }}>
      <h2>Simulation</h2>
      <div className="field">
        <label>What happens if…</label>
        <textarea
          placeholder="Describe a scenario, e.g. 'We lose our top sales rep next month'"
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {EXAMPLES.map((ex) => (
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
        {running ? 'Simulating…' : 'Run simulation'}
      </button>
      {disabled && <div className="note">Create a company first.</div>}
    </div>
  )
}
