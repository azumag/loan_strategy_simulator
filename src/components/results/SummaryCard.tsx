import {
  Wallet, Landmark, Percent, Flag, Calendar, CalendarClock,
  PiggyBank, ShieldCheck, TrendingUp, TrendingDown,
  LucideIcon,
} from 'lucide-react'
import { useScenario } from '../../store/scenario-store'

const fmt = (n: number) => Math.round(n).toLocaleString()
const fmtMan = (n: number) => Math.round(n / 10000).toLocaleString()

type Tone = 'brand' | 'safe' | 'warn' | 'danger' | 'neutral'

function KPI({
  icon: Icon, label, value, unit, delta, tone = 'neutral',
}: {
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  delta?: string
  tone?: Tone
}) {
  const toneBg =
    tone === 'safe' ? 'var(--safe-soft)' :
    tone === 'warn' ? 'var(--warn-soft)' :
    tone === 'danger' ? 'var(--danger-soft)' :
    tone === 'brand' ? 'var(--brand-soft)' :
    'var(--bg-inset)'
  const toneFg =
    tone === 'safe' ? 'var(--safe)' :
    tone === 'warn' ? 'var(--warn)' :
    tone === 'danger' ? 'var(--danger)' :
    tone === 'brand' ? 'var(--brand)' :
    'var(--fg-3)'

  const deltaTone = delta?.startsWith('−') || delta?.startsWith('-')
    ? 'var(--safe)'     // a decrease in interest/balance is good
    : 'var(--brand)'

  return (
    <div className="card p-5 relative overflow-hidden" style={{ minHeight: 138 }}>
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: toneBg, color: toneFg }}
        >
          <Icon size={14} />
        </span>
        <span className="text-[11px] font-bold t-fg3 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="kpi-num t-fg" style={{ fontSize: 26 }}>{value}</span>
        {unit && <span className="text-xs t-fg3 font-medium">{unit}</span>}
      </div>
      {delta && (
        <div className="mt-1 text-[11px] flex items-center gap-1" style={{ color: deltaTone }}>
          {delta.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span className="font-mono font-semibold">{delta}</span>
        </div>
      )}
    </div>
  )
}

export function SummaryCard() {
  const { result } = useScenario()
  const { summary, rows } = result
  const row65 = rows.find((r) => r.age === 65)
  const liquidAt65 = row65?.endingAssets ?? 0

  const short = summary.firstShortageAge

  return (
    <div className="stagger grid grid-cols-2 md:grid-cols-4 gap-3">
      <KPI icon={Wallet}   label="月返済額"   value={`¥${fmt(summary.currentMonthlyPayment)}`} tone="brand" />
      <KPI icon={Landmark} label="総返済額"   value={fmtMan(summary.totalRepayment)} unit="万円" />
      <KPI icon={Percent}  label="総利息"     value={fmtMan(summary.totalInterest)}   unit="万円" />
      <KPI icon={Flag}     label="完済年齢"   value={summary.payoffAge ? `${summary.payoffAge}` : '未'} unit={summary.payoffAge ? '歳' : '完済'} tone={summary.payoffAge ? 'brand' : 'danger'} />
      <KPI icon={Calendar}      label="60歳時残債" value={fmtMan(summary.balanceAt60)} unit="万円" />
      <KPI icon={CalendarClock} label="65歳時残債" value={fmtMan(summary.balanceAt65)} unit="万円" />
      <KPI icon={PiggyBank}     label="65歳時資産" value={fmtMan(liquidAt65)} unit="万円" tone="safe" />
      <KPI icon={ShieldCheck}   label="資金ショート" value={short ? `${short}歳` : 'なし'} tone={short ? 'danger' : 'safe'} />
    </div>
  )
}
