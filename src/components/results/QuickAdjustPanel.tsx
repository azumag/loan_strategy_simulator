import { useState, useEffect } from 'react'
import { SlidersHorizontal, X, Zap, LucideIcon, TrendingUp, Flame, Percent, ShoppingBasket, PiggyBank, Coins, ArrowDown } from 'lucide-react'
import { useScenario } from '../../store/scenario-store'

/**
 * Floating side-panel variant of the Quick-Adjust surface.
 *
 * Replaces the old sticky-bar design (`top-[41px] bg-indigo-50/95`) with a
 * right-side drawer triggered by a FAB button. All dispatches are unchanged.
 */
export function QuickAdjustPanel() {
  const { scenario, dispatch } = useScenario()
  const [open, setOpen] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)

  const sc = scenario.scenario
  const loan = scenario.loan
  const assets = scenario.assets
  const living = scenario.living
  const isUnified = (assets.investmentContributionMode ?? 'separate') === 'unified'

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  // Release dragging state on global pointer up (covers releases outside the panel)
  useEffect(() => {
    if (!dragId) return
    const stop = () => setDragId(null)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [dragId])

  const isAnyDragging = dragId !== null
  const fadeIfNotActive = (id: string): number => isAnyDragging && dragId !== id ? 0.3 : 1

  const updateRate = (value: number) => {
    const newSchedule = [...loan.rateSchedule]
    newSchedule[0] = { ...newSchedule[0], rate: value / 100 }
    dispatch({ type: 'UPDATE_LOAN', payload: { rateSchedule: newSchedule } })
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary"
        style={{
          position: 'fixed', right: 20, bottom: 20, zIndex: 40,
          padding: '12px 18px', boxShadow: 'var(--shadow-pop)',
        }}
      >
        <SlidersHorizontal size={16} />
        クイック調整
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.25)',
            opacity: isAnyDragging ? 0 : 1,
            zIndex: 50,
            transition: 'opacity 150ms ease-out',
            animation: 'fadeIn .2s ease-out',
          }}
        />
      )}

      {/* Drawer */}
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 'min(360px, 100vw)',
          background: isAnyDragging ? 'transparent' : 'var(--card)',
          borderLeft: isAnyDragging ? '1px solid transparent' : '1px solid var(--border)',
          boxShadow: isAnyDragging ? 'none' : 'var(--shadow-pop)',
          zIndex: 60,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--dur) var(--ease-out), background 150ms ease-out, box-shadow 150ms ease-out, border-color 150ms ease-out',
          display: 'flex', flexDirection: 'column',
        }}
        aria-hidden={!open}
      >
        <div
          className="flex items-center gap-2 px-5 py-4"
          style={{
            borderBottom: '1px solid var(--border)',
            opacity: isAnyDragging ? 0.3 : 1,
            transition: 'opacity 150ms ease-out',
          }}
        >
          <SlidersHorizontal size={18} style={{ color: 'var(--brand)' }} />
          <span className="font-display font-bold t-fg text-[15px]">クイック調整</span>
          <span className="chip t-brand-soft ml-2">Live</span>
          <button className="btn btn-ghost !p-1.5 ml-auto" onClick={() => setOpen(false)} aria-label="閉じる">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto">
          <DrawerSlider
            id="returnRate"
            icon={TrendingUp} label="運用利回り" unit="%"
            value={parseFloat((sc.investmentReturnRate * 100).toFixed(1))}
            min={0} max={10} step={0.1}
            onChange={(v) => dispatch({ type: 'UPDATE_SCENARIO', payload: { investmentReturnRate: v / 100 } })}
            opacity={fadeIfNotActive('returnRate')}
            onDragStart={setDragId}
          />
          <DrawerSlider
            id="inflation"
            icon={Flame} label="インフレ率" unit="%"
            value={parseFloat((sc.inflationRate * 100).toFixed(1))}
            min={0} max={5} step={0.1}
            onChange={(v) => dispatch({ type: 'UPDATE_SCENARIO', payload: { inflationRate: v / 100 } })}
            opacity={fadeIfNotActive('inflation')}
            onDragStart={setDragId}
          />
          <DrawerSlider
            id="loanRate"
            icon={Percent} label="借入金利" unit="%"
            value={parseFloat((loan.rateSchedule[0].rate * 100).toFixed(2))}
            min={0} max={5} step={0.01}
            onChange={updateRate}
            opacity={fadeIfNotActive('loanRate')}
            onDragStart={setDragId}
          />
          <DrawerSlider
            id="livingCost"
            icon={ShoppingBasket} label="月間生活費" unit="万円/月"
            value={living.monthlyBaseCost / 10000}
            min={0} max={100} step={1}
            onChange={(v) => dispatch({ type: 'UPDATE_LIVING', payload: { monthlyBaseCost: v * 10000 } })}
            opacity={fadeIfNotActive('livingCost')}
            onDragStart={setDragId}
          />

          {isUnified ? (
            <DrawerSlider
              id="totalInvestment"
              icon={PiggyBank} label="年間投資総額" unit="万円/年"
              value={(assets.totalAnnualInvestment ?? 0) / 10000}
              min={0} max={600} step={12}
              onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { totalAnnualInvestment: v * 10000 } })}
              opacity={fadeIfNotActive('totalInvestment')}
              onDragStart={setDragId}
            />
          ) : (
            <>
              <DrawerSlider
                id="nisa"
                icon={PiggyBank} label="NISA年間積立" unit="万円/年"
                value={(assets.annualNisaContribution ?? 0) / 10000}
                min={0} max={360} step={12}
                onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { annualNisaContribution: v * 10000 } })}
                opacity={fadeIfNotActive('nisa')}
                onDragStart={setDragId}
              />
              <DrawerSlider
                id="taxable"
                icon={PiggyBank} label="課税口座年間積立" unit="万円/年"
                value={assets.annualSavingsContribution / 10000}
                min={0} max={500} step={10}
                onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { annualSavingsContribution: v * 10000 } })}
                opacity={fadeIfNotActive('taxable')}
                onDragStart={setDragId}
              />
            </>
          )}

          <DrawerSlider
            id="dividend"
            icon={Coins} label="配当利回り" unit="%"
            value={parseFloat(((assets.stockDividendYield ?? 0.03) * 100).toFixed(1))}
            min={0} max={10} step={0.1}
            onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { stockDividendYield: v / 100 } })}
            opacity={fadeIfNotActive('dividend')}
            onDragStart={setDragId}
          />
          <DrawerSlider
            id="drawdown"
            icon={ArrowDown} label="退職後取り崩し" unit="万円/年"
            value={(assets.annualRetirementDrawdown ?? 0) / 10000}
            min={0} max={500} step={10}
            onChange={(v) => dispatch({ type: 'UPDATE_ASSETS', payload: { annualRetirementDrawdown: v * 10000 } })}
            opacity={fadeIfNotActive('drawdown')}
            onDragStart={setDragId}
          />
        </div>

        <div
          className="mt-auto p-4"
          style={{
            borderTop: '1px solid var(--border)',
            opacity: isAnyDragging ? 0.3 : 1,
            transition: 'opacity 150ms ease-out',
          }}
        >
          <div className="flex items-center gap-2 text-[11px] t-fg3">
            <Zap size={12} style={{ color: 'var(--accent)' }} />
            変更は結果にリアルタイム反映されます
          </div>
        </div>
      </aside>
    </>
  )
}

function DrawerSlider({
  id, icon: Icon, label, value, onChange, min, max, step, unit,
  opacity = 1, onDragStart,
}: {
  id: string
  icon: LucideIcon
  label: string
  value: number
  onChange: (v: number) => void
  min: number; max: number; step: number
  unit: string
  opacity?: number
  onDragStart?: (id: string) => void
}) {
  return (
    <div style={{ opacity, transition: 'opacity 150ms ease-out' }}>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-xs font-bold t-fg2 flex items-center gap-1.5">
          <Icon size={12} style={{ color: 'var(--fg-3)' }} />
          {label}
        </label>
        <div className="flex items-baseline gap-1">
          <span className="kpi-num t-brand" style={{ fontSize: 20 }}>{value}</span>
          <span className="text-[10px] t-fg4">{unit}</span>
        </div>
      </div>
      <input
        className="range"
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onPointerDown={() => onDragStart?.(id)}
      />
      <div className="flex justify-between text-[10px] t-fg4 mt-1 font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
