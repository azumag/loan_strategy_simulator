import { createContext, useContext, useReducer, useMemo, ReactNode } from 'react'
import { Scenario, SimulationResult } from '../types'
import { simulate } from '../core/engine'
import { DEFAULT_SCENARIO } from '../utils/defaults'

type ScenarioAction =
  | { type: 'UPDATE_SCENARIO'; payload: Partial<Scenario['scenario']> }
  | { type: 'UPDATE_LOAN'; payload: Partial<Scenario['loan']> }
  | { type: 'UPDATE_CAREER_STAGES'; payload: Scenario['careerStages'] }
  | { type: 'UPDATE_TAX'; payload: Partial<Scenario['tax']> }
  | { type: 'UPDATE_HOUSING'; payload: Partial<Scenario['housing']> }
  | { type: 'UPDATE_LIVING'; payload: Partial<Scenario['living']> }
  | { type: 'UPDATE_ASSETS'; payload: Partial<Scenario['assets']> }
  | { type: 'UPDATE_EVENTS'; payload: Scenario['events'] }
  | { type: 'UPDATE_STRATEGY'; payload: Partial<Scenario['strategy']> }
  | { type: 'RESET' }
  | { type: 'LOAD'; payload: Scenario }

function scenarioReducer(state: Scenario, action: ScenarioAction): Scenario {
  switch (action.type) {
    case 'UPDATE_SCENARIO':
      return { ...state, scenario: { ...state.scenario, ...action.payload } }
    case 'UPDATE_LOAN':
      return { ...state, loan: { ...state.loan, ...action.payload } }
    case 'UPDATE_CAREER_STAGES':
      return { ...state, careerStages: action.payload }
    case 'UPDATE_TAX':
      return { ...state, tax: { ...state.tax, ...action.payload } }
    case 'UPDATE_HOUSING':
      return { ...state, housing: { ...state.housing, ...action.payload } }
    case 'UPDATE_LIVING':
      return { ...state, living: { ...state.living, ...action.payload } }
    case 'UPDATE_ASSETS':
      return { ...state, assets: { ...state.assets, ...action.payload } }
    case 'UPDATE_EVENTS':
      return { ...state, events: action.payload }
    case 'UPDATE_STRATEGY':
      return { ...state, strategy: { ...state.strategy, ...action.payload } }
    case 'RESET':
      return DEFAULT_SCENARIO
    case 'LOAD':
      return action.payload
    default:
      return state
  }
}

interface ScenarioContextValue {
  scenario: Scenario
  result: SimulationResult
  dispatch: React.Dispatch<ScenarioAction>
}

const ScenarioContext = createContext<ScenarioContextValue | null>(null)

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, dispatch] = useReducer(scenarioReducer, DEFAULT_SCENARIO)
  const result = useMemo(() => simulate(scenario), [scenario])

  return (
    <ScenarioContext.Provider value={{ scenario, result, dispatch }}>
      {children}
    </ScenarioContext.Provider>
  )
}

export function useScenario() {
  const ctx = useContext(ScenarioContext)
  if (!ctx) throw new Error('useScenario must be used within ScenarioProvider')
  return ctx
}
