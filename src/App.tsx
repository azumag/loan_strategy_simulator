import { useState, useEffect } from 'react'
import { ScenarioProvider } from './store/scenario-store'
import { ToastProvider } from './components/ui/ToastContext'
import { ThemeProvider } from './store/theme-store'
import { Header } from './components/layout/Header'
import { StepNavigation, StepId } from './components/layout/StepNavigation'
import { BasicConditionForm } from './components/inputs/BasicConditionForm'
import { LoanConditionForm } from './components/inputs/LoanConditionForm'
import { CareerStageEditor } from './components/inputs/CareerStageEditor'
import { TaxSettingForm } from './components/inputs/TaxSettingForm'
import { HousingCostForm } from './components/inputs/HousingCostForm'
import { LivingCostForm } from './components/inputs/LivingCostForm'
import { HomeOfficeExpenseForm } from './components/inputs/HomeOfficeExpenseForm'
import { AssetForm } from './components/inputs/AssetForm'
import { EventEditor } from './components/inputs/EventEditor'
import { PrepaymentStrategyEditor } from './components/inputs/PrepaymentStrategyEditor'
import { SummaryCard } from './components/results/SummaryCard'
import { BreakevenCard } from './components/results/BreakevenCard'
import { AnnualTable } from './components/results/AnnualTable'
import { ChartView } from './components/results/ChartView'
import { QuickAdjustPanel } from './components/results/QuickAdjustPanel'

const SIDEBAR_W = 220

function AppContent() {
  const [step, setStep] = useState<StepId>('basic')

  // The header is position:fixed and its height varies (extra row when a
  // scenario is loaded). Measure the live <header> element so the fixed
  // sidebar/main can sit flush beneath it.
  useEffect(() => {
    const findAndObserve = () => {
      const el = document.querySelector('header') as HTMLElement | null
      if (!el) return null
      const update = () => {
        document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
      }
      update()
      const ro = new ResizeObserver(update)
      ro.observe(el)
      window.addEventListener('resize', update)
      return () => { ro.disconnect(); window.removeEventListener('resize', update) }
    }
    let cleanup = findAndObserve()
    if (!cleanup) {
      // Header may mount after first paint; retry once on next tick.
      const t = setTimeout(() => { cleanup = findAndObserve() }, 0)
      return () => { clearTimeout(t); cleanup?.() }
    }
    return cleanup
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      <Header />
      <StepNavigation currentStep={step} onStepChange={setStep} />
      <main
        style={{
          position: 'fixed',
          top: 'var(--header-h, 110px)',
          left: SIDEBAR_W,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 36px 80px' }}>
          {step === 'basic' && <BasicConditionForm />}
          {step === 'loan' && <LoanConditionForm />}
          {step === 'career' && <CareerStageEditor />}
          {step === 'tax' && <TaxSettingForm />}
          {step === 'housing' && <HousingCostForm />}
          {step === 'living' && <LivingCostForm />}
          {step === 'home_office' && <HomeOfficeExpenseForm />}
          {step === 'assets' && <AssetForm />}
          {step === 'events' && <EventEditor />}
          {step === 'prepayment' && <PrepaymentStrategyEditor />}
          {step === 'result' && (
            <div className="flex flex-col gap-5">
              <SummaryCard />
              <BreakevenCard />
              <ChartView />
              <AnnualTable />
            </div>
          )}
        </div>
      </main>
      {step === 'result' && <QuickAdjustPanel />}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ScenarioProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ScenarioProvider>
    </ThemeProvider>
  )
}

export default App
