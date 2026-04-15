import { useState } from 'react'
import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

export function QuickAdjustPanel() {
  const { scenario, dispatch } = useScenario()
  const [open, setOpen] = useState(false)

  const sc = scenario.scenario
  const loan = scenario.loan
  const assets = scenario.assets
  const living = scenario.living
  const isUnified = (assets.investmentContributionMode ?? 'separate') === 'unified'

  const updateRate = (value: number) => {
    const newSchedule = [...loan.rateSchedule]
    newSchedule[0] = { ...newSchedule[0], rate: value / 100 }
    dispatch({ type: 'UPDATE_LOAN', payload: { rateSchedule: newSchedule } })
  }

  return (
    <div className="sticky top-[41px] z-30 bg-indigo-50/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-2 text-sm font-semibold text-indigo-800 hover:text-indigo-600 transition-colors"
        >
          <span>クイック調整</span>
          <span className="text-xs">{open ? '▲ 閉じる' : '▼ 開く'}</span>
        </button>

        {open && (
          <div className="pb-4 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SliderInput
            label="運用利回り"
            value={parseFloat((sc.investmentReturnRate * 100).toFixed(1))}
            onChange={(v) => dispatch({ type: 'UPDATE_SCENARIO', payload: { investmentReturnRate: v / 100 } })}
            min={0} max={10} step={0.1} unit="%"
          />
          <SliderInput
            label="インフレ率"
            value={parseFloat((sc.inflationRate * 100).toFixed(1))}
            onChange={(v) => dispatch({ type: 'UPDATE_SCENARIO', payload: { inflationRate: v / 100 } })}
            min={0} max={5} step={0.1} unit="%"
          />
          <SliderInput
            label="金利"
            value={parseFloat((loan.rateSchedule[0].rate * 100).toFixed(2))}
            onChange={updateRate}
            min={0} max={5} step={0.01} unit="%"
          />
          <SliderInput
            label="月間生活費"
            value={living.monthlyBaseCost / 10000}
            onChange={(v) => dispatch({ type: 'UPDATE_LIVING', payload: { monthlyBaseCost: v * 10000 } })}
            min={0} max={100} step={1} unit="万円/月"
          />

          {isUnified ? (
            <SliderInput
              label="年間投資総額"
              value={(assets.totalAnnualInvestment ?? 0) / 10000}
              onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { totalAnnualInvestment: v * 10000 } })}
              min={0} max={600} step={12} unit="万円/年"
            />
          ) : (
            <>
              <SliderInput
                label="NISA年間積立"
                value={(assets.annualNisaContribution ?? 0) / 10000}
                onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { annualNisaContribution: v * 10000 } })}
                min={0} max={360} step={12} unit="万円/年"
              />
              <SliderInput
                label="課税口座年間積立"
                value={assets.annualSavingsContribution / 10000}
                onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { annualSavingsContribution: v * 10000 } })}
                min={0} max={500} step={10} unit="万円/年"
              />
            </>
          )}

          <SliderInput
            label="配当利回り"
            value={parseFloat(((assets.stockDividendYield ?? 0.03) * 100).toFixed(1))}
            onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { stockDividendYield: v / 100 } })}
            min={0} max={10} step={0.1} unit="%"
          />
          <SliderInput
            label="退職後取り崩し"
            value={(assets.annualRetirementDrawdown ?? 0) / 10000}
            onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { annualRetirementDrawdown: v * 10000 } })}
            min={0} max={500} step={10} unit="万円/年"
          />
          </div>
        )}
      </div>
    </div>
  )
}
