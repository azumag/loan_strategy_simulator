import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

export function HomeOfficeExpenseForm() {
  const { scenario, dispatch } = useScenario()
  const hoe = scenario.homeOfficeExpense
  const living = scenario.living

  const update = (key: keyof typeof hoe, value: number) =>
    dispatch({ type: 'UPDATE_HOME_OFFICE_EXPENSE', payload: { [key]: value } })

  const monthlyUtility = living.monthlyUtilityCost ?? 0
  const utilityAnnual = monthlyUtility * 12
  const utilityDeduction = Math.round(utilityAnnual * hoe.utilityRatio)

  // ローン利息の概算（初年の想定利息）
  const loan = scenario.loan
  const principal = Math.max(0, loan.principal - (loan.downPayment ?? 0))
  const rate = loan.rateSchedule[0]?.rate ?? 0
  const approxAnnualInterest = Math.round(principal * rate)
  const interestDeduction = Math.round(approxAnnualInterest * hoe.loanInterestRatio)

  const totalDeduction = utilityDeduction + interestDeduction

  const isSelfEmployed = scenario.careerStages.some(
    (s) => s.workStyle === 'self_employed' || s.workStyle === 'micro_corporation'
  )

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">家事按分</h2>
      <p className="text-sm text-gray-500">
        自宅を事業に使用する個人事業主・マイクロ法人向けの設定です。光熱費・住宅ローン利息の一部を経費として計上できます。
      </p>

      {!isSelfEmployed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          キャリアに個人事業主またはマイクロ法人のステージがないため、按分設定は反映されません。
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderInput
          label="光熱費 按分率"
          value={Math.round(hoe.utilityRatio * 100)}
          onChange={(v) => update('utilityRatio', v / 100)}
          min={0} max={100} step={5} unit="%"
        />
        <SliderInput
          label="住宅ローン利息 按分率"
          value={Math.round(hoe.loanInterestRatio * 100)}
          onChange={(v) => update('loanInterestRatio', v / 100)}
          min={0} max={100} step={5} unit="%"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-800">按分経費 概算（初年ベース）</p>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-blue-100">
              <td className="py-1 text-gray-600">光熱費按分</td>
              <td className="py-1 text-right text-gray-500">
                {(utilityAnnual / 10000).toFixed(1)} 万円 × {Math.round(hoe.utilityRatio * 100)}%
              </td>
              <td className="py-1 text-right font-medium text-blue-700">
                {(utilityDeduction / 10000).toFixed(1)} 万円/年
              </td>
            </tr>
            <tr className="border-b border-blue-100">
              <td className="py-1 text-gray-600">ローン利息按分</td>
              <td className="py-1 text-right text-gray-500">
                {(approxAnnualInterest / 10000).toFixed(1)} 万円 × {Math.round(hoe.loanInterestRatio * 100)}%
              </td>
              <td className="py-1 text-right font-medium text-blue-700">
                {(interestDeduction / 10000).toFixed(1)} 万円/年
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-blue-800" colSpan={2}>合計 経費計上額</td>
              <td className="py-1 text-right font-semibold text-blue-800">
                {(totalDeduction / 10000).toFixed(1)} 万円/年
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-1">※ローン利息は年数とともに減少します。上記は元本×金利での概算です。</p>
      </div>
    </div>
  )
}
