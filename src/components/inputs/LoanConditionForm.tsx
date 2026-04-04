import { useScenario } from '../../store/scenario-store'
import { RateScheduleEntry } from '../../types'
import { SliderInput } from '../ui/SliderInput'

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderInput
          label="物件価格"
          value={loan.principal / 10000}
          onChange={(v) => updateLoan('principal', v * 10000)}
          min={0} max={20000} step={100} unit="万円"
        />

        <SliderInput
          label="頭金"
          value={(loan.downPayment ?? 0) / 10000}
          onChange={(v) => updateLoan('downPayment', v * 10000)}
          min={0} max={5000} step={50} unit="万円"
        />
      </div>

      <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm text-gray-700">
        借入額：<span className="font-semibold text-blue-700">{((loan.principal - (loan.downPayment ?? 0)) / 10000).toLocaleString()} 万円</span>
        <span className="text-xs text-gray-400 ml-2">（物件価格 − 頭金）</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderInput
          label="借入開始年齢"
          value={loan.startAge}
          onChange={(v) => updateLoan('startAge', v)}
          min={20} max={65} step={1} unit="歳"
        />

        <SliderInput
          label="返済期間"
          value={loan.loanTermYears}
          onChange={(v) => updateLoan('loanTermYears', v)}
          min={1} max={50} step={1} unit="年"
        />

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
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p><strong>元利均等返済</strong>: 毎月の返済額が一定。返済計画が立てやすい。</p>
            <p><strong>元金均等返済</strong>: 毎月の元金が一定。総利息が少ない。</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">金利スケジュール</h3>
          <button onClick={addRate} className="text-xs text-blue-600 hover:underline">+ 追加</button>
        </div>
        <div className="space-y-3">
          {loan.rateSchedule.map((entry, i) => (
            <div key={i} className="flex items-end gap-4 bg-gray-50 rounded-lg p-3">
              <SliderInput
                label="開始年次"
                value={entry.fromYear}
                onChange={(v) => updateRate(i, 'fromYear', v)}
                min={1} max={loan.loanTermYears} step={1} unit="年目〜"
                className="flex-1"
              />
              <SliderInput
                label="金利"
                value={parseFloat((entry.rate * 100).toFixed(2))}
                onChange={(v) => updateRate(i, 'rate', v / 100)}
                min={0} max={5} step={0.01} unit="%"
                className="flex-1"
              />
              {loan.rateSchedule.length > 1 && (
                <button onClick={() => removeRate(i)} className="text-red-500 text-xs hover:underline mb-1 shrink-0">
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
