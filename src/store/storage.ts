import { Scenario } from '../types'

const STORAGE_KEY = 'loan-strategy-simulator'
const VERSION = 1

interface StorageData {
  version: number
  currentScenarioId: string
  scenarios: { id: string; name: string; data: Scenario }[]
}

function load(): StorageData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as StorageData
    if (data.version !== VERSION) return null
    return data
  } catch {
    return null
  }
}

function save(data: StorageData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function saveScenario(scenario: Scenario, id = 'main'): void {
  const existing = load() ?? {
    version: VERSION,
    currentScenarioId: id,
    scenarios: [],
  }
  const idx = existing.scenarios.findIndex((s) => s.id === id)
  const entry = { id, name: scenario.scenario.name, data: scenario }
  if (idx >= 0) {
    existing.scenarios[idx] = entry
  } else {
    existing.scenarios.push(entry)
  }
  existing.currentScenarioId = id
  save(existing)
}

export function loadCurrentScenario(): Scenario | null {
  const data = load()
  if (!data) return null
  const current = data.scenarios.find((s) => s.id === data.currentScenarioId)
  return current?.data ?? null
}

export function listScenarios(): { id: string; name: string }[] {
  const data = load()
  return data?.scenarios.map((s) => ({ id: s.id, name: s.name })) ?? []
}

export function deleteScenario(id: string): void {
  const data = load()
  if (!data) return
  data.scenarios = data.scenarios.filter((s) => s.id !== id)
  save(data)
}
