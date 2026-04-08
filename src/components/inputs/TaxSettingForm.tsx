import { useScenario } from '../../store/scenario-store'
import { HousingLoanScheme } from '../../types'
import { HOUSING_LOAN_SCHEMES } from '../../core/engine'
import { SliderInput } from '../ui/SliderInput'

const SCHEME_OPTIONS: { value: HousingLoanScheme; label: string }[] = [
  { value: 'long_term', label: '認定長期優良住宅・低炭素住宅（上限4,500万円・13年）' },
  { value: 'zeh',       label: 'ZEH水準省エネ住宅（上限3,500万円・13年）' },
  { value: 'eco',       label: '省エネ基準適合住宅（上限3,000万円・13年）' },
  { value: 'general',   label: 'その他の住宅（上限2,000万円・10年）' },
]

export function TaxSettingForm() {
  const { scenario, dispatch } = useScenario()
  const tax = scenario.tax
  const loan = scenario.loan

  const update = (key: keyof typeof tax, value: number | boolean | string) =>
    dispatch({ type: 'UPDATE_TAX', payload: { [key]: value } })

  const mode = tax.housingLoanDeductionMode ?? 'auto'
  const scheme = tax.housingLoanScheme ?? 'eco'
  const schemeInfo = HOUSING_LOAN_SCHEMES[scheme]

  // 控除額プレビュー（初年度・年末残高 = 元本全額で計算）
  const previewDeduction = Math.floor(Math.min(loan.principal, schemeInfo.limit) * schemeInfo.rate)

  const otherFields: { key: keyof typeof tax; label: string }[] = [
    { key: 'basicDeductionAnnual', label: '基礎控除（万円）' },
    { key: 'spouseDeductionAnnual', label: '配偶者控除（万円）' },
    { key: 'dependentDeductionAnnual', label: '扶養控除（万円）' },
    { key: 'lifeInsuranceDeductionAnnual', label: '生命保険料控除（万円）' },
    { key: 'earthquakeInsuranceDeductionAnnual', label: '地震保険料控除（万円）' },
    { key: 'medicalDeductionAnnual', label: '医療費控除（万円）' },
    { key: 'otherDeductionAnnual', label: 'その他控除（万円）' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">税・控除設定</h2>
        <p className="text-xs text-amber-600">※税計算は概算です</p>
      </div>

      {/* 住宅ローン控除 */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-blue-800">住宅ローン控除（2024年現行制度）</h3>
          <div className="flex gap-1 text-xs bg-white border border-blue-200 rounded overflow-hidden">
            <button
              onClick={() => update('housingLoanDeductionMode', 'auto')}
              className={`px-3 py-1 ${mode === 'auto' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              自動計算
            </button>
            <button
              onClick={() => update('housingLoanDeductionMode', 'manual')}
              className={`px-3 py-1 ${mode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              手動入力
            </button>
          </div>
        </div>

        {mode === 'auto' && (
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">住宅の種別</label>
              <select
                value={scheme}
                onChange={(e) => update('housingLoanScheme', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white"
              >
                {SCHEME_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="text-xs text-gray-600 space-y-0.5 bg-white rounded p-2 border border-blue-100">
              <div>控除率: <span className="font-semibold">年末残高 × 0.7%</span></div>
              <div>控除期間: <span className="font-semibold">{schemeInfo.years}年間</span></div>
              <div>借入限度額: <span className="font-semibold">{(schemeInfo.limit / 10000).toLocaleString()}万円</span></div>
              <div className="text-blue-700 font-medium pt-0.5">
                初年度の控除額（概算）: {(previewDeduction / 10000).toFixed(1)} 万円／年
              </div>
            </div>
            <p className="text-xs text-gray-400">
              ※ 年末ローン残高 × 0.7% を毎年自動計算。残高が減るにつれ控除額も逓減します。
            </p>
          </div>
        )}

        {mode === 'manual' && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">住宅ローン控除額（万円/年）</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={tax.housingLoanDeductionAnnual / 10000}
              onChange={(e) => update('housingLoanDeductionAnnual', Number(e.target.value.replace(/\D/g, '')) * 10000)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              min={0}
            />
            <p className="text-xs text-gray-400 mt-1">毎年固定額で適用されます。</p>
          </div>
        )}
      </div>

      {/* その他の控除 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {otherFields.map(({ key, label }) => (
          <SliderInput
            key={key}
            label={label.replace('（万円）', '')}
            value={(tax[key] as number) / 10000}
            onChange={(v) => update(key, v * 10000)}
            min={0} max={key === 'basicDeductionAnnual' ? 100 : key === 'medicalDeductionAnnual' ? 200 : 80}
            step={1} unit="万円"
          />
        ))}
      </div>
    </div>
  )
}
