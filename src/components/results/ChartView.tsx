import { useEffect, useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { LineChart as LineIcon, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { useScenario } from '../../store/scenario-store'
import { useTheme } from '../../store/theme-store'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

/** Read CSS custom properties off <html> as concrete colors. Chart.js cannot
 *  resolve `var(--x)` strings itself. We re-read whenever variant/mode change. */
function useCssTokens(keys: string[], deps: unknown[]) {
  const [vals, setVals] = useState<Record<string, string>>({})
  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const next: Record<string, string> = {}
    for (const k of keys) next[k] = styles.getPropertyValue(k).trim() || '#888'
    setVals(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return vals
}

const withAlpha = (color: string, a: number) => {
  // Accept #rrggbb or rgb(...) and convert to rgba()
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `,${a})`)
  return color
}

export function ChartView() {
  const { result } = useScenario()
  const { rows } = result
  const { variant, mode } = useTheme()

  const t = useCssTokens(
    ['--chart-1','--chart-2','--chart-3','--chart-4','--chart-5','--chart-6',
     '--fg-2','--fg-3','--border-s','--safe','--danger'],
    [variant, mode],
  )

  const labels = rows.map((r) => `${r.age}歳`)
  const toMan = (n: number) => Math.round(n / 10000)

  const hasNisa = rows.some((r) => r.endingNisaBalance > 0)
  const hasLiquid = rows.some((r) => r.endingLiquidAssets > 0)
  const hasSmallBiz = rows.some((r) => r.smallBusinessMutualAccumulated > 0)
  const hasBankruptcy = rows.some((r) => r.bankruptcyMutualAccumulated > 0)

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: t['--fg-2'], font: { family: 'inherit' } } },
    },
    scales: {
      x: { ticks: { color: t['--fg-3'] }, grid: { color: t['--border-s'] } },
      y: {
        ticks: { color: t['--fg-3'], callback: (v: unknown) => `${Number(v).toLocaleString()}万` },
        grid: { color: t['--border-s'] },
      },
    },
  }), [t])

  const balanceData = useMemo(() => ({
    labels,
    datasets: [
      {
        label: '現金残高',
        data: rows.map((r) => toMan(r.endingCash)),
        borderColor: t['--chart-1'],
        backgroundColor: withAlpha(t['--chart-1'] || '#888', 0.12),
        tension: 0.25,
        fill: true,
      },
      ...(hasNisa ? [{
        label: 'NISA残高',
        data: rows.map((r) => toMan(r.endingNisaBalance)),
        borderColor: t['--chart-2'],
        backgroundColor: withAlpha(t['--chart-2'] || '#888', 0.10),
        tension: 0.25,
        borderDash: [4, 2],
      }] : []),
      ...(hasLiquid ? [{
        label: '課税口座',
        data: rows.map((r) => toMan(r.endingLiquidAssets)),
        borderColor: t['--chart-5'],
        backgroundColor: withAlpha(t['--chart-5'] || '#888', 0.10),
        tension: 0.25,
        borderDash: [4, 2],
      }] : []),
      ...(hasSmallBiz ? [{
        label: '小規模企業共済',
        data: rows.map((r) => toMan(r.smallBusinessMutualAccumulated)),
        borderColor: t['--chart-3'],
        tension: 0.25,
        borderDash: [6, 3],
      }] : []),
      ...(hasBankruptcy ? [{
        label: '倒産防止共済',
        data: rows.map((r) => toMan(r.bankruptcyMutualAccumulated)),
        borderColor: t['--chart-6'],
        tension: 0.25,
        borderDash: [6, 3],
      }] : []),
      {
        label: '総資産',
        data: rows.map((r) => toMan(r.endingAssets)),
        borderColor: t['--chart-3'],
        backgroundColor: withAlpha(t['--chart-3'] || '#888', 0.10),
        tension: 0.25,
        borderWidth: 2.5,
      },
      {
        label: 'ローン残債',
        data: rows.map((r) => toMan(r.loanBalance)),
        borderColor: t['--chart-4'],
        backgroundColor: withAlpha(t['--chart-4'] || '#888', 0.10),
        tension: 0.25,
      },
    ],
  }), [t, rows, labels, hasNisa, hasLiquid, hasSmallBiz, hasBankruptcy])

  const cashflowData = useMemo(() => ({
    labels,
    datasets: [{
      label: '年間収支',
      data: rows.map((r) => toMan(r.netCashflow)),
      backgroundColor: rows.map((r) => r.netCashflow >= 0 ? t['--safe'] : t['--danger']),
      borderRadius: 3,
    }],
  }), [t, rows, labels])

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <LineIcon size={16} style={{ color: 'var(--brand)' }} />
          <span className="font-display font-bold t-fg text-[17px]">資産・残債の推移</span>
          <span className="text-xs t-fg3 ml-2">年齢ごとのキャッシュ / 投資 / 借入残高（万円）</span>
        </div>
        <div style={{ height: 340 }}>
          <Line data={balanceData} options={chartOptions} />
        </div>
      </div>
      <CashflowChart data={cashflowData} options={chartOptions} />
    </div>
  )
}

function CashflowChart({ data, options }: { data: Parameters<typeof Bar>[0]['data']; options: Parameters<typeof Bar>[0]['options'] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 p-5 font-display font-bold t-fg text-[15px] hover:t-inset transition-colors rounded-lg"
      >
        <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
        年間収支推移（万円）
        <span className="ml-auto text-xs t-fg3 flex items-center gap-1">
          {open ? '閉じる' : '開く'}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ height: 260 }}>
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  )
}
