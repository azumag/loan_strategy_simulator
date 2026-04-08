import { useState } from 'react'
import { ScenarioProvider } from './store/scenario-store'
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
import { AnnualTable } from './components/results/AnnualTable'
import { ChartView } from './components/results/ChartView'



function AppContent() {
  const [step, setStep] = useState<StepId>('basic')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <StepNavigation currentStep={step} onStepChange={setStep} />
      <main className="max-w-7xl mx-auto px-4 py-6">
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
          <div className="space-y-6">
            <SummaryCard />
            <ChartView />
            <AnnualTable />
          </div>
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <ScenarioProvider>
      <AppContent />
    </ScenarioProvider>
  )
}

export default App
