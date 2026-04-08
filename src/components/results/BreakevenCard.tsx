import { useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { useScenario } from '../../store/scenario-store'
import { BreakevenMetrics } from '../../types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const fmtMan = (n: number) => `${Math.round(n / 10000).toLocaleString()}万円`

type Tab = 'comparison' | 'interest' | 'cash-loan' | 'all'

const CHART_OPTIONS = {
  responsive: true,
  plugins: { legend: { position: 'top' as const } },
  scales: {
    y: { ticks: { callback: (v: unknown) => `${Math.round(Number(v) / 10000)}万` } },
  },
}

function ComparisonTable({ m }: { m: BreakevenMetrics }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left font-medium text-gray-700 border-b border-gray-200"></th>
            <th className="px-4 py-2 text-center font-medium text-gray-700 border-b border-gray-200">繰上げ返済なし</th>
            <th className="px-4 py-2 text-center font-medium text-gray-700 border-b border-gray-200">繰上げ返済あり</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="px-4 py-2 text-gray-600">完済年齢</td>
            <td className="px-4 py-2 text-center font-semibold text-gray-900">
              {m.payoffAgeWithoutPrepayment ? `${m.payoffAgeWithoutPrepayment}歳` : '未完済'}
            </td>
            <td className="px-4 py-2 text-center font-semibold text-blue-700">
              {m.payoffAgeWithPrepayment ? `${m.payoffAgeWithPrepayment}歳` : '未完済'}
            </td>
          </tr>
          <tr className="border-b border-gray-100">
            <td className="px-4 py-2 text-gray-600">総利息</td>
            <td className="px-4 py-2 text-center font-semibold text-gray-900">{fmtMan(m.totalInterestWithoutPrepayment)}</td>
            <td className="px-4 py-2 text-center font-semibold text-blue-700">{fmtMan(m.totalInterestWithPrepayment)}</td>
          </tr>
          <tr className="bg-blue-50">
            <td className="px-4 py-2 font-medium text-blue-800">利息削減効果</td>
            <td className="px-4 py-2 text-center" colSpan={2}>
              <span className="text-lg font-bold text-blue-700">{fmtMan(m.interestSavings)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function InterestSavingsChart({ m }: { m: BreakevenMetrics }) {
  const data = {
    labels: m.cumulativeInterestSavingsByAge.map(r => `${r.age}歳`),
    datasets: [{
      label: '累積利息削減額',
      data: m.cumulativeInterestSavingsByAge.map(r => Math.round(r.savings / 10000)),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.1,
    }],
  }
  return <Line options={CHART_OPTIONS} data={data} />
}

function CashLoanChart({ m }: { m: BreakevenMetrics }) {
  const data = {
    labels: m.cashVsLoanBalanceByAge.map(r => `${r.age}歳`),
    datasets: [
      {
        label: '現金（繰上げ返済あり）',
        data: m.cashVsLoanBalanceByAge.map(r => Math.round(r.cashWithPrepayment / 10000)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: '現金（繰上げ返済なし）',
        data: m.cashVsLoanBalanceByAge.map(r => Math.round(r.cashWithoutPrepayment / 10000)),
        borderColor: 'rgb(147, 197, 253)',
        backgroundColor: 'rgba(147, 197, 253, 0.1)',
        tension: 0.1,
        borderDash: [4, 2],
      },
      {
        label: '借入残高（繰上げ返済あり）',
        data: m.cashVsLoanBalanceByAge.map(r => Math.round(r.loanBalanceWithPrepayment / 10000)),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
      },
      {
        label: '借入残高（繰上げ返済なし）',
        data: m.cashVsLoanBalanceByAge.map(r => Math.round(r.loanBalanceWithoutPrepayment / 10000)),
        borderColor: 'rgb(252, 165, 165)',
        backgroundColor: 'rgba(252, 165, 165, 0.1)',
        tension: 0.1,
        borderDash: [4, 2],
      },
    ],
  }
  return <Line options={CHART_OPTIONS} data={data} />
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'comparison', label: '完済年齢比較' },
  { key: 'interest', label: '利息削減効果' },
  { key: 'cash-loan', label: '残高と現金' },
  { key: 'all', label: '全部' },
]

export function BreakevenCard() {
  const { result } = useScenario()
  const m = result.breakeven
  const [tab, setTab] = useState<Tab>('comparison')

  if (!m) return null

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-blue-800">繰上げ返済 損益分岐点分析</h2>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                tab === t.key ? 'bg-white text-blue-700 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'comparison' && <ComparisonTable m={m} />}
      {tab === 'interest' && (
        <div className="h-64">
          <InterestSavingsChart m={m} />
        </div>
      )}
      {tab === 'cash-loan' && (
        <div className="h-64">
          <CashLoanChart m={m} />
        </div>
      )}
      {tab === 'all' && (
        <div className="space-y-6">
          <ComparisonTable m={m} />
          <div className="h-64">
            <p className="text-sm font-medium text-gray-700 mb-2">利息削減効果（累積）</p>
            <InterestSavingsChart m={m} />
          </div>
          <div className="h-64">
            <p className="text-sm font-medium text-gray-700 mb-2">借入残高と手持ち現金の推移</p>
            <CashLoanChart m={m} />
          </div>
        </div>
      )}
    </div>
  )
}
