import { createContext, useContext, useReducer, useMemo, ReactNode } from 'react'
import { Scenario, SimulationResult } from '../types'
import { simulate } from '../core/engine'
import { DEFAULT_SCENARIO } from '../utils/defaults'
import { loadFirstScenario } from './storage'

/** 旧バージョンの保存データに欠けているフィールドをデフォルト値で補完する */
function migrateScenario(loaded: unknown): Scenario {
  const s = loaded as Partial<Scenario>
  return {
    ...DEFAULT_SCENARIO,
    ...s,
    scenario: { ...DEFAULT_SCENARIO.scenario, ...(s.scenario ?? {}) },
    loan: { ...DEFAULT_SCENARIO.loan, ...(s.loan ?? {}) },
    tax: { ...DEFAULT_SCENARIO.tax, ...(s.tax ?? {}) },
    housing: { ...DEFAULT_SCENARIO.housing, ...(s.housing ?? {}) },
    living: {
      ...DEFAULT_SCENARIO.living,
      ...(s.living ?? {}),
      monthlyUtilityCost: (s.living as any)?.monthlyUtilityCost ?? DEFAULT_SCENARIO.living.monthlyUtilityCost,
    },
    assets: {
      ...DEFAULT_SCENARIO.assets,
      ...(s.assets ?? {}),
      initialNisaBalance: (s.assets as { initialNisaBalance?: number })?.initialNisaBalance ?? 0,
      annualNisaContribution: (s.assets as { annualNisaContribution?: number })?.annualNisaContribution ?? 0,
      annualRetirementDrawdown: (s.assets as any)?.annualRetirementDrawdown ?? 0,
      nisaStockRatio: (s.assets as any)?.nisaStockRatio ?? 0,
      liquidStockRatio: (s.assets as any)?.liquidStockRatio ?? 0,
      stockDividendYield: (s.assets as any)?.stockDividendYield ?? 0.03,
    },
    strategy: { ...DEFAULT_SCENARIO.strategy, ...(s.strategy ?? {}) },
    mutualAid: { ...DEFAULT_SCENARIO.mutualAid, ...(s.mutualAid ?? {}) },
    homeOfficeExpense: { ...DEFAULT_SCENARIO.homeOfficeExpense, ...(s.homeOfficeExpense ?? {}) },
    careerStages: (s.careerStages ?? DEFAULT_SCENARIO.careerStages).map(stage => {
      if (stage.workStyle === 'self_employed') {
        return { ...{ bankruptcyMutualAnnual: 0 }, ...stage }
      }
      return stage
    }),
    spouseCareerStages: (s.spouseCareerStages ?? []).map(stage => {
      if (stage.workStyle === 'self_employed') {
        return { ...{ bankruptcyMutualAnnual: 0 }, ...stage }
      }
      return stage
    }),
  }
}

type ScenarioAction =
  | { type: 'UPDATE_SCENARIO'; payload: Partial<Scenario['scenario']> }
  | { type: 'UPDATE_LOAN'; payload: Partial<Scenario['loan']> }
  | { type: 'UPDATE_CAREER_STAGES'; payload: Scenario['careerStages'] }
  | { type: 'UPDATE_SPOUSE_CAREER_STAGES'; payload: Scenario['spouseCareerStages'] }
  | { type: 'UPDATE_TAX'; payload: Partial<Scenario['tax']> }
  | { type: 'UPDATE_HOUSING'; payload: Partial<Scenario['housing']> }
  | { type: 'UPDATE_LIVING'; payload: Partial<Scenario['living']> }
  | { type: 'UPDATE_ASSETS'; payload: Partial<Scenario['assets']> }
  | { type: 'UPDATE_EVENTS'; payload: Scenario['events'] }
  | { type: 'UPDATE_STRATEGY'; payload: Partial<Scenario['strategy']> }
  | { type: 'UPDATE_MUTUAL_AID'; payload: Partial<Scenario['mutualAid']> }
  | { type: 'UPDATE_HOME_OFFICE_EXPENSE'; payload: Partial<Scenario['homeOfficeExpense']> }
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
    case 'UPDATE_SPOUSE_CAREER_STAGES':
      return { ...state, spouseCareerStages: action.payload }
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
    case 'UPDATE_MUTUAL_AID':
      return { ...state, mutualAid: { ...state.mutualAid, ...action.payload } }
    case 'UPDATE_HOME_OFFICE_EXPENSE':
      return { ...state, homeOfficeExpense: { ...state.homeOfficeExpense, ...action.payload } }
    case 'RESET':
      return DEFAULT_SCENARIO
    case 'LOAD':
      return migrateScenario(action.payload)
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

function getInitialScenario(): Scenario {
  const saved = loadFirstScenario()
  return saved ? migrateScenario(saved) : DEFAULT_SCENARIO
}

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, dispatch] = useReducer(scenarioReducer, undefined, getInitialScenario)
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
