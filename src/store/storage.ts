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

export function saveScenario(scenario: Scenario, id: string): void {
  const existing = load() ?? { version: VERSION, currentScenarioId: id, scenarios: [] }
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

export function saveNewScenario(scenario: Scenario): string {
  const id = `scenario-${Date.now()}`
  saveScenario(scenario, id)
  return id
}

export function loadScenarioById(id: string): Scenario | null {
  const data = load()
  if (!data) return null
  return data.scenarios.find((s) => s.id === id)?.data ?? null
}

export function loadFirstScenario(): Scenario | null {
  const data = load()
  if (!data || data.scenarios.length === 0) return null
  return data.scenarios[0].data
}

export function loadCurrentScenario(): Scenario | null {
  const data = load()
  if (!data) return null
  const current = data.scenarios.find((s) => s.id === data.currentScenarioId)
  return current?.data ?? data.scenarios[0]?.data ?? null
}

export function listScenarios(): { id: string; name: string }[] {
  const data = load()
  return data?.scenarios.map((s) => ({ id: s.id, name: s.name })) ?? []
}

export function getCurrentScenarioId(): string | null {
  return load()?.currentScenarioId ?? null
}

export function setCurrentScenarioId(id: string): void {
  const data = load()
  if (!data) return
  data.currentScenarioId = id
  save(data)
}

export function reorderScenario(id: string, direction: 'up' | 'down'): void {
  const data = load()
  if (!data) return
  const idx = data.scenarios.findIndex((s) => s.id === id)
  if (idx < 0) return
  const newIdx = direction === 'up' ? idx - 1 : idx + 1
  if (newIdx < 0 || newIdx >= data.scenarios.length) return
  const arr = [...data.scenarios]
  ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
  data.scenarios = arr
  save(data)
}

export function deleteScenario(id: string): void {
  const data = load()
  if (!data) return
  data.scenarios = data.scenarios.filter((s) => s.id !== id)
  if (data.currentScenarioId === id) {
    data.currentScenarioId = data.scenarios[0]?.id ?? ''
  }
  save(data)
}
