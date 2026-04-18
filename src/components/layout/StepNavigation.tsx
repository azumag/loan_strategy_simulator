import {
  Settings2, Landmark, Briefcase, Receipt, Home, ShoppingBasket, Building2,
  TrendingUp, Calendar, FastForward, LayoutDashboard, Check,
  LucideIcon,
} from 'lucide-react'

export type StepId =
  | 'basic'
  | 'loan'
  | 'career'
  | 'tax'
  | 'housing'
  | 'living'
  | 'home_office'
  | 'assets'
  | 'events'
  | 'prepayment'
  | 'result'

export const STEPS: { id: StepId; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { id: 'basic',      label: '基本条件',       shortLabel: '基本',     icon: Settings2 },
  { id: 'loan',       label: 'ローン',         shortLabel: 'ローン',   icon: Landmark },
  { id: 'career',     label: 'キャリア',       shortLabel: 'キャリア', icon: Briefcase },
  { id: 'tax',        label: '税・控除',       shortLabel: '税',       icon: Receipt },
  { id: 'housing',    label: '住宅費',         shortLabel: '住宅',     icon: Home },
  { id: 'living',     label: '生活費',         shortLabel: '生活',     icon: ShoppingBasket },
  { id: 'home_office',label: '家事按分',       shortLabel: '按分',     icon: Building2 },
  { id: 'assets',     label: '資産',           shortLabel: '資産',     icon: TrendingUp },
  { id: 'events',     label: 'イベント',       shortLabel: 'イベント', icon: Calendar },
  { id: 'prepayment', label: '繰上返済',       shortLabel: '繰上',     icon: FastForward },
  { id: 'result',     label: '結果',           shortLabel: '結果',     icon: LayoutDashboard },
]

interface StepNavigationProps {
  currentStep: StepId
  onStepChange: (step: StepId) => void
  /** marks a step as completed / visited. Defaults to "all steps before result are done". */
  isDone?: (id: StepId) => boolean
}

export function StepNavigation({ currentStep, onStepChange, isDone }: StepNavigationProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep)
  const defaultDone = (id: StepId) => {
    const idx = STEPS.findIndex((s) => s.id === id)
    return idx < currentIdx && id !== 'result'
  }
  const done = isDone ?? defaultDone

  return (
    <nav
      aria-label="ステップ"
      style={{
        position: 'fixed',
        top: 'var(--header-h, 110px)',
        left: 0,
        bottom: 0,
        width: 220,
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
        padding: '20px 12px',
        overflowY: 'auto',
        zIndex: 20,
      }}
    >
      <ul className="flex flex-col gap-1">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const active = currentStep === step.id
          const completed = done(step.id)
          return (
            <li key={step.id}>
              <button
                onClick={() => onStepChange(step.id)}
                className={`step-row w-full ${active ? 'active' : ''} ${completed ? 'done' : ''}`}
                aria-current={active ? 'step' : undefined}
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  fontSize: 14,
                  padding: '10px 12px',
                }}
              >
                <span className="step-dot">
                  {completed ? <Check size={12} /> : index + 1}
                </span>
                <Icon size={15} className="opacity-70" />
                <span>{step.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
