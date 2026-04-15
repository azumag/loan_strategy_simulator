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
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useScenario } from '../../store/scenario-store'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

const CHART_OPTIONS = {
  responsive: true,
  plugins: { legend: { position: 'top' as const } },
  scales: { y: { ticks: { callback: (v: unknown) => `${Math.round(Number(v) / 10000)}万` } } },
}

export function ChartView() {
  const { result } = useScenario()
  const { rows } = result

  const labels = rows.map((r) => `${r.age}歳`)
  const toMan = (n: number) => Math.round(n / 10000)

  const hasNisa = rows.some((r) => r.endingNisaBalance > 0)
  const hasLiquid = rows.some((r) => r.endingLiquidAssets > 0)
  const hasSmallBiz = rows.some((r) => r.smallBusinessMutualAccumulated > 0)
  const hasBankruptcy = rows.some((r) => r.bankruptcyMutualAccumulated > 0)

  const balanceData = {
    labels,
    datasets: [
      {
        label: '現金残高',
        data: rows.map((r) => toMan(r.endingCash)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      ...(hasNisa ? [{
        label: 'NISA残高',
        data: rows.map((r) => toMan(r.endingNisaBalance)),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        borderDash: [4, 2],
      }] : []),
      ...(hasLiquid ? [{
        label: '課税口座',
        data: rows.map((r) => toMan(r.endingLiquidAssets)),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1,
        borderDash: [4, 2],
      }] : []),
      ...(hasSmallBiz ? [{
        label: '小規模企業共済',
        data: rows.map((r) => toMan(r.smallBusinessMutualAccumulated)),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.1,
        borderDash: [6, 3],
      }] : []),
      ...(hasBankruptcy ? [{
        label: '倒産防止共済',
        data: rows.map((r) => toMan(r.bankruptcyMutualAccumulated)),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.1,
        borderDash: [6, 3],
      }] : []),
      {
        label: '総資産',
        data: rows.map((r) => toMan(r.endingAssets)),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.1,
      },
      {
        label: 'ローン残債',
        data: rows.map((r) => toMan(r.loanBalance)),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const cashflowData = {
    labels,
    datasets: [
      {
        label: '年間収支',
        data: rows.map((r) => toMan(r.netCashflow)),
        backgroundColor: rows.map((r) =>
          r.netCashflow >= 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'
        ),
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-4">資産・残債推移（万円）</h3>
        <Line data={balanceData} options={CHART_OPTIONS} />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-4">年間収支推移（万円）</h3>
        <Bar data={cashflowData} options={CHART_OPTIONS} />
      </div>
    </div>
  )
}
