import { useScenario } from '../../store/scenario-store'
import { RateScheduleEntry } from '../../types'

export function LoanConditionForm() {
  const { scenario, dispatch } = useScenario()
  const loan = scenario.loan

  const updateLoan = (key: keyof typeof loan, value: unknown) =>
    dispatch({ type: 'UPDATE_LOAN', payload: { [key]: value } })

  const updateRate = (index: number, field: keyof RateScheduleEntry, value: number) => {
    const newSchedule = loan.rateSchedule.map((r, i) =>
      i === index ? { ...r, [field]: value } : r
    )
    updateLoan('rateSchedule', newSchedule)
  }

  const addRate = () =>
    updateLoan('rateSchedule', [...loan.rateSchedule, { fromYear: loan.loanTermYears, rate: 0.01 }])

  const removeRate = (index: number) =>
    updateLoan('rateSchedule', loan.rateSchedule.filter((_, i) => i !== index))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">ローン条件</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">借入元本（万円）</label>
          <input
            type="number"
            value={loan.principal / 10000}
            onChange={(e) => updateLoan('principal', Number(e.target.value) * 10000)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={0}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">借入開始年齢</label>
          <input
            type="number"
            value={loan.startAge}
            onChange={(e) => updateLoan('startAge', Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">返済期間（年）</label>
          <input
            type="number"
            value={loan.loanTermYears}
            onChange={(e) => updateLoan('loanTermYears', Number(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={1}
            max={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">返済方式</label>
          <select
            value={loan.repaymentType}
            onChange={(e) => updateLoan('repaymentType', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="equal_payment">元利均等返済</option>
            <option value="equal_principal">元金均等返済</option>
          </select>
          <div className="text-xs text-gray-600 mt-2 space-y-1">
            <p><strong>元利均等返済</strong>: 毎月の返済額が一定。初期は利息が多く、後期は元金が多くなる。返済計画が立てやすい。</p>
            <p><strong>元金均等返済</strong>: 毎月の元金返済が一定。初期の返済額が高く、時間とともに減少。利息負担が少ない。</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">金利スケジュール</h3>
          <button
            onClick={addRate}
            className="text-xs text-blue-600 hover:underline"
          >
            + 追加
          </button>
        </div>
        <table className="w-full text-sm border border-gray-200 rounded-md overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 text-xs text-gray-600">開始年次</th>
              <th className="text-left px-3 py-2 text-xs text-gray-600">金利（%）</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loan.rateSchedule.map((entry, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={entry.fromYear}
                    onChange={(e) => updateRate(i, 'fromYear', Number(e.target.value))}
                    className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    min={1}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={(entry.rate * 100).toFixed(2)}
                    onChange={(e) => updateRate(i, 'rate', Number(e.target.value) / 100)}
                    className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                    step={0.01}
                    min={0}
                  />
                </td>
                <td className="px-3 py-2">
                  {loan.rateSchedule.length > 1 && (
                    <button
                      onClick={() => removeRate(i)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      削除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
