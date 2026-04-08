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

export const STEPS: { id: StepId; label: string; shortLabel: string }[] = [
  { id: 'basic', label: '基本条件', shortLabel: '基本' },
  { id: 'loan', label: 'ローン', shortLabel: 'ローン' },
  { id: 'career', label: 'キャリア', shortLabel: 'キャリア' },
  { id: 'tax', label: '税・控除', shortLabel: '税' },
  { id: 'housing', label: '住宅費', shortLabel: '住宅' },
  { id: 'living', label: '生活費', shortLabel: '生活' },
  { id: 'home_office', label: '家事按分', shortLabel: '按分' },
  { id: 'assets', label: '資産', shortLabel: '資産' },
  { id: 'events', label: 'イベント', shortLabel: 'イベント' },
  { id: 'prepayment', label: '繰上返済', shortLabel: '繰上' },
  { id: 'result', label: '結果', shortLabel: '結果' },
]

interface StepNavigationProps {
  currentStep: StepId
  onStepChange: (step: StepId) => void
}

export function StepNavigation({ currentStep, onStepChange }: StepNavigationProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex overflow-x-auto">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepChange(step.id)}
              className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                currentStep === step.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center bg-gray-100 text-gray-600 shrink-0">
                {index + 1}
              </span>
              <span className="hidden md:inline">{step.label}</span>
              <span className="md:hidden">{step.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
