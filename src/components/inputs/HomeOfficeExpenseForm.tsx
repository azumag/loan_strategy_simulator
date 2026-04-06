import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

const fmt = (n: number) => (n / 10000).toFixed(1)

export function HomeOfficeExpenseForm() {
  const { scenario, dispatch } = useScenario()
  const hoe = scenario.homeOfficeExpense
  const housing = scenario.housing
  const living = scenario.living
  const loan = scenario.loan

  const update = (key: keyof typeof hoe, value: number) =>
    dispatch({ type: 'UPDATE_HOME_OFFICE_EXPENSE', payload: { [key]: value } })

  const spaceRatio = hoe.businessSpaceRatio ?? 0
  const utilityRatio = hoe.utilityRatio ?? 0

  // 住宅費系按分
  const housingBase = housing.fixedAssetTaxAnnual + housing.cityPlanningTaxAnnual
    + housing.homeInsuranceAnnual + housing.maintenanceAnnual
  const housingDeduction = Math.round(housingBase * spaceRatio)

  // ローン利息概算（初年）
  const principal = Math.max(0, loan.principal - (loan.downPayment ?? 0))
  const rate = loan.rateSchedule[0]?.rate ?? 0
  const approxInterest = Math.round(principal * rate)
  const interestDeduction = Math.round(approxInterest * spaceRatio)

  // 建物減価償却費
  const usefulLife = Math.max(1, hoe.buildingUsefulLife ?? 22)
  const annualDepreciation = hoe.buildingPrice > 0
    ? Math.round(hoe.buildingPrice * 0.9 / usefulLife * spaceRatio)
    : 0

  // 光熱費按分
  const utilityAnnual = (living.monthlyUtilityCost ?? 0) * 12
  const utilityDeduction = Math.round(utilityAnnual * utilityRatio)

  // 住宅ローン控除への影響
  const deductionImpact = spaceRatio > 0
    ? `住宅ローン控除は居住用部分（${Math.round((1 - spaceRatio) * 100)}%）のみ対象になります`
    : null

  const totalDeduction = housingDeduction + interestDeduction + annualDepreciation + utilityDeduction

  const isSelfEmployed = scenario.careerStages.some(
    (s) => s.workStyle === 'self_employed' || s.workStyle === 'micro_corporation'
  )

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">家事按分</h2>
      <p className="text-sm text-gray-500">
        自宅を事業に使用する個人事業主・マイクロ法人向けの設定です。事業使用面積割合と光熱費の按分率を設定すると、該当経費が事業経費として所得から控除されます。
      </p>

      {!isSelfEmployed && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          キャリアに個人事業主またはマイクロ法人のステージがないため、按分設定は反映されません。
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">按分率の設定</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SliderInput
              label="事業使用面積割合"
              value={Math.round(spaceRatio * 100)}
              onChange={(v) => update('businessSpaceRatio', v / 100)}
              min={0} max={100} step={5} unit="%"
            />
            <p className="text-xs text-gray-400 mt-1">
              住宅ローン利息・固定資産税・都市計画税・火災保険・修繕費・減価償却費に適用
            </p>
          </div>
          <div>
            <SliderInput
              label="光熱費 按分率"
              value={Math.round(utilityRatio * 100)}
              onChange={(v) => update('utilityRatio', v / 100)}
              min={0} max={100} step={5} unit="%"
            />
            <p className="text-xs text-gray-400 mt-1">
              電気・ガス・水道。使用時間など実態で面積と別に設定可
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 border-b pb-1">建物の減価償却費</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderInput
            label="建物取得価額"
            value={Math.round((hoe.buildingPrice ?? 0) / 10000)}
            onChange={(v) => update('buildingPrice', v * 10000)}
            min={0} max={10000} step={100} unit="万円"
          />
          <SliderInput
            label="建物の耐用年数"
            value={hoe.buildingUsefulLife ?? 22}
            onChange={(v) => update('buildingUsefulLife', v)}
            min={10} max={50} step={1} unit="年"
          />
        </div>
        <p className="text-xs text-gray-400">
          木造22年 / 軽量鉄骨造27年 / 鉄骨造34年 / RC造47年。定額法（取得価額×0.9÷耐用年数）で算出。土地代は含めないでください。
        </p>
        {hoe.buildingPrice > 0 && (
          <p className="text-xs text-blue-600">
            年間償却費（全体）: {fmt(Math.round(hoe.buildingPrice * 0.9 / usefulLife))} 万円 → 事業用: {fmt(annualDepreciation)} 万円/年
          </p>
        )}
      </div>

      {deductionImpact && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          ⚠ {deductionImpact}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-800">按分経費 概算（初年ベース・インフレ調整前）</p>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-blue-100">
              <td className="py-1 text-gray-600">住宅費系按分</td>
              <td className="py-1 text-right text-gray-500">
                {fmt(housingBase)} 万円 × {Math.round(spaceRatio * 100)}%
              </td>
              <td className="py-1 text-right font-medium text-blue-700">
                {fmt(housingDeduction)} 万円/年
              </td>
            </tr>
            <tr className="border-b border-blue-100">
              <td className="py-1 text-gray-600 pl-4 text-xs">（固定資産税 {fmt(housing.fixedAssetTaxAnnual)} + 都市計画税 {fmt(housing.cityPlanningTaxAnnual)} + 火災保険 {fmt(housing.homeInsuranceAnnual)} + 修繕費 {fmt(housing.maintenanceAnnual)} 万円）</td>
              <td colSpan={2}></td>
            </tr>
            <tr className="border-b border-blue-100">
              <td className="py-1 text-gray-600">ローン利息按分</td>
              <td className="py-1 text-right text-gray-500">
                {fmt(approxInterest)} 万円 × {Math.round(spaceRatio * 100)}%
              </td>
              <td className="py-1 text-right font-medium text-blue-700">
                {fmt(interestDeduction)} 万円/年
              </td>
            </tr>
            <tr className="border-b border-blue-100">
              <td className="py-1 text-gray-600">建物減価償却費</td>
              <td className="py-1 text-right text-gray-500">
                {hoe.buildingPrice > 0 ? `${fmt(Math.round(hoe.buildingPrice * 0.9 / usefulLife))} 万円 × ${Math.round(spaceRatio * 100)}%` : '建物価額未設定'}
              </td>
              <td className="py-1 text-right font-medium text-blue-700">
                {fmt(annualDepreciation)} 万円/年
              </td>
            </tr>
            <tr className="border-b border-blue-100">
              <td className="py-1 text-gray-600">光熱費按分</td>
              <td className="py-1 text-right text-gray-500">
                {fmt(utilityAnnual)} 万円 × {Math.round(utilityRatio * 100)}%
              </td>
              <td className="py-1 text-right font-medium text-blue-700">
                {fmt(utilityDeduction)} 万円/年
              </td>
            </tr>
            <tr>
              <td className="py-1 font-semibold text-blue-800" colSpan={2}>合計 経費計上額</td>
              <td className="py-1 text-right font-semibold text-blue-800">
                {fmt(totalDeduction)} 万円/年
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-gray-400">※ローン利息は年数とともに減少します。上記は元本×金利の初年概算です。</p>
      </div>
    </div>
  )
}
