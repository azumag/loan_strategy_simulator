import { useState, useEffect, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { FastForward, Minus, Zap, PiggyBank, ArrowDown } from 'lucide-react'
import { useScenario } from '../../store/scenario-store'
import { useTheme } from '../../store/theme-store'
import { BreakevenMetrics } from '../../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const fmtMan = (n: number) => `${Math.round(n / 10000).toLocaleString()}万円`

type Tab = 'comparison' | 'interest' | 'cash-loan'

function useChartOptions() {
  const { variant, mode } = useTheme()
  const [tokens, setTokens] = useState({ fg2: '#444', fg3: '#777', borderS: '#ddd' })
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    setTokens({
      fg2: styles.getPropertyValue('--fg-2').trim() || '#444',
      fg3: styles.getPropertyValue('--fg-3').trim() || '#777',
      borderS: styles.getPropertyValue('--border-s').trim() || '#ddd',
    })
  }, [variant, mode])
  return useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: tokens.fg2, font: { family: 'inherit' } } },
    },
    scales: {
      x: { ticks: { color: tokens.fg3 }, grid: { color: tokens.borderS } },
      y: {
        ticks: { color: tokens.fg3, callback: (v: unknown) => `${Number(v).toLocaleString()}万` },
        grid: { color: tokens.borderS },
      },
    },
  }), [tokens])
}

function ComparisonPanel({ m }: { m: BreakevenMetrics }) {
  const withoutPayoff = m.payoffAgeWithoutPrepayment
  const withPayoff = m.payoffAgeWithPrepayment
  const saving = m.interestSavings
  const yearsSaved = withoutPayoff && withPayoff ? withoutPayoff - withPayoff : null

  const span = (withoutPayoff ?? 85) - 40
  const withSpan = withPayoff ? withPayoff - 40 : span
  const withPct = Math.min(100, Math.max(0, (withSpan / span) * 100))

  return (
    <div className="flex flex-col gap-5">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Without */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-inset)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="chip t-fg3" style={{ background: 'var(--bg-muted)' }}>
              <Minus size={10} /> 繰上げなし
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="kpi-num t-fg" style={{ fontSize: 38 }}>
              {withoutPayoff ?? '−'}
            </span>
            <span className="text-sm t-fg3">歳完済</span>
          </div>
          <div className="text-xs t-fg3 mb-4">
            総利息 <span className="font-mono font-bold t-fg">{fmtMan(m.totalInterestWithoutPrepayment)}</span>
          </div>
          <div className="bar">
            <span style={{ width: '100%', background: 'var(--fg-3)' }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono t-fg4 mt-1">
            <span>40歳</span>
            <span>{withoutPayoff ?? '−'}歳</span>
          </div>
        </div>

        {/* With */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--brand-soft)', border: '1px dashed var(--brand)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="chip t-brand-soft" style={{ fontWeight: 700 }}>
              <Zap size={10} /> 繰上げあり
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="kpi-num t-brand" style={{ fontSize: 38 }}>
              {withPayoff ?? '−'}
            </span>
            <span className="text-sm t-brand">歳完済</span>
            {yearsSaved != null && yearsSaved > 0 && (
              <span className="chip ml-2" style={{ background: 'var(--card)', color: 'var(--safe)', fontWeight: 700 }}>
                <ArrowDown size={10} />
                −{yearsSaved}年
              </span>
            )}
          </div>
          <div className="text-xs t-fg2 mb-4">
            総利息 <span className="font-mono font-bold t-brand">{fmtMan(m.totalInterestWithPrepayment)}</span>
          </div>
          <div className="bar">
            <span style={{ width: `${withPct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] font-mono t-fg4 mt-1">
            <span>40歳</span>
            <span>{withPayoff ?? '−'}歳</span>
          </div>
        </div>
      </div>

      {/* Savings hero */}
      <div
        className="rounded-2xl p-5 flex items-center gap-5"
        style={{ background: 'linear-gradient(90deg, var(--brand-soft), transparent)' }}
      >
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl"
          style={{ background: 'var(--brand)', color: 'var(--bg-2)' }}
        >
          <PiggyBank size={24} />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-widest t-fg3">利息削減効果</div>
          <div className="flex items-baseline gap-1">
            <span className="kpi-num t-brand" style={{ fontSize: 40 }}>
              {Math.round(saving / 10000).toLocaleString()}
            </span>
            <span className="text-sm t-fg2 font-semibold">万円</span>
            <span className="text-xs t-fg3 ml-2">節約できます</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function InterestSavingsChart({ m }: { m: BreakevenMetrics }) {
  const options = useChartOptions()
  const data = {
    labels: m.cumulativeInterestSavingsByAge.map((r) => `${r.age}歳`),
    datasets: [{
      label: '累積利息削減額',
      data: m.cumulativeInterestSavingsByAge.map((r) => Math.round(r.savings / 10000)),
      borderColor: 'rgb(22,163,74)',
      backgroundColor: 'rgba(22,163,74,0.15)',
      fill: true,
      tension: 0.3,
    }],
  }
  return <Line options={options} data={data} />
}

function CashLoanChart({ m }: { m: BreakevenMetrics }) {
  const options = useChartOptions()
  const data = {
    labels: m.cashVsLoanBalanceByAge.map((r) => `${r.age}歳`),
    datasets: [
      { label: '現金（繰上げあり）', data: m.cashVsLoanBalanceByAge.map((r) => Math.round(r.cashWithPrepayment / 10000)), borderColor: 'rgb(59,130,246)', backgroundColor: 'rgba(59,130,246,0.1)', tension: 0.3 },
      { label: '現金（なし）',       data: m.cashVsLoanBalanceByAge.map((r) => Math.round(r.cashWithoutPrepayment / 10000)), borderColor: 'rgb(147,197,253)', backgroundColor: 'rgba(147,197,253,0.1)', borderDash: [4, 2], tension: 0.3 },
      { label: '借入残（繰上げあり）', data: m.cashVsLoanBalanceByAge.map((r) => Math.round(r.loanBalanceWithPrepayment / 10000)), borderColor: 'rgb(239,68,68)', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.3 },
      { label: '借入残（なし）',     data: m.cashVsLoanBalanceByAge.map((r) => Math.round(r.loanBalanceWithoutPrepayment / 10000)), borderColor: 'rgb(252,165,165)', backgroundColor: 'rgba(252,165,165,0.1)', borderDash: [4, 2], tension: 0.3 },
    ],
  }
  return <Line options={options} data={data} />
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'comparison', label: '比較' },
  { key: 'interest',   label: '削減効果' },
  { key: 'cash-loan',  label: '残高推移' },
]

export function BreakevenCard() {
  const { result } = useScenario()
  const m = result.breakeven
  const [tab, setTab] = useState<Tab>('comparison')

  if (!m) return null

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FastForward size={16} style={{ color: 'var(--brand)' }} />
            <span className="font-display font-bold t-fg text-[17px]">繰上げ返済 · 損益分岐点</span>
          </div>
          <div className="text-xs t-fg3">繰上げありとなしを並べて比較。節約効果と完済短縮の可視化。</div>
        </div>
        <div className="flex gap-1 t-inset p-1 rounded-full">
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  color: active ? 'var(--brand)' : 'var(--fg-3)',
                  background: active ? 'var(--card)' : 'transparent',
                  boxShadow: active ? 'var(--shadow-1)' : 'none',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'comparison' && <ComparisonPanel m={m} />}
      {tab === 'interest' && (
        <div style={{ height: 320 }}>
          <InterestSavingsChart m={m} />
        </div>
      )}
      {tab === 'cash-loan' && (
        <div style={{ height: 320 }}>
          <CashLoanChart m={m} />
        </div>
      )}
    </div>
  )
}
