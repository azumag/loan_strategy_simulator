import { useState } from 'react'
import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

export function HousingCostForm() {
  const { scenario, dispatch } = useScenario()
  const housing = scenario.housing
  const loanPrincipal = scenario.loan.principal

  const [showCalc, setShowCalc] = useState(false)
  const [propertyPrice, setPropertyPrice] = useState(Math.round(loanPrincipal / 10000))
  const [assessmentRatio, setAssessmentRatio] = useState(70)

  const update = (key: keyof typeof housing, value: number) =>
    dispatch({ type: 'UPDATE_HOUSING', payload: { [key]: value } })

  const calcAndApply = () => {
    const priceYen = propertyPrice * 10000
    const assessed = priceYen * (assessmentRatio / 100)
    dispatch({ type: 'UPDATE_HOUSING', payload: {
      fixedAssetTaxAnnual: Math.round(assessed * 0.014),
      cityPlanningTaxAnnual: Math.round(assessed * 0.003),
    }})
    setShowCalc(false)
  }

  const assessed = propertyPrice * (assessmentRatio / 100)
  const previewFixed = Math.round(assessed * 0.014 * 100) / 100
  const previewCity = Math.round(assessed * 0.003 * 100) / 100

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">住宅費</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">固定資産税</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={housing.fixedAssetTaxAnnual / 10000}
                onChange={(e) => update('fixedAssetTaxAnnual', Number(e.target.value) * 10000)}
                className="w-24 border border-gray-300 rounded px-2 py-0.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                min={0}
              />
              <span className="text-xs text-gray-500">万円/年</span>
              <button onClick={() => setShowCalc((v) => !v)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                概算計算
              </button>
            </div>
          </div>
          <input
            type="range" min={0} max={100} step={1}
            value={Math.min(100, housing.fixedAssetTaxAnnual / 10000)}
            onChange={(e) => update('fixedAssetTaxAnnual', Number(e.target.value) * 10000)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600"
            style={{ background: `linear-gradient(to right, #2563eb ${Math.min(100, housing.fixedAssetTaxAnnual / 10000)}%, #e5e7eb ${Math.min(100, housing.fixedAssetTaxAnnual / 10000)}%)` }}
          />
        </div>

        <SliderInput
          label="都市計画税"
          value={housing.cityPlanningTaxAnnual / 10000}
          onChange={(v) => update('cityPlanningTaxAnnual', v * 10000)}
          min={0} max={50} step={1} unit="万円/年"
        />
        <SliderInput
          label="火災保険料"
          value={housing.homeInsuranceAnnual / 10000}
          onChange={(v) => update('homeInsuranceAnnual', v * 10000)}
          min={0} max={30} step={1} unit="万円/年"
        />
        <SliderInput
          label="修繕積立・維持費"
          value={housing.maintenanceAnnual / 10000}
          onChange={(v) => update('maintenanceAnnual', v * 10000)}
          min={0} max={200} step={5} unit="万円/年"
        />
        <SliderInput
          label="その他住宅費"
          value={housing.otherHousingCostAnnual / 10000}
          onChange={(v) => update('otherHousingCostAnnual', v * 10000)}
          min={0} max={100} step={1} unit="万円/年"
        />
      </div>

      {showCalc && (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
          <p className="text-xs text-gray-600">物件価格と評価割合から固定資産税・都市計画税を概算します（固定資産税1.4%、都市計画税0.3%）。</p>
          <div className="grid grid-cols-2 gap-4">
            <SliderInput
              label="物件価格"
              value={propertyPrice}
              onChange={setPropertyPrice}
              min={500} max={20000} step={100} unit="万円"
            />
            <SliderInput
              label="評価割合"
              value={assessmentRatio}
              onChange={setAssessmentRatio}
              min={50} max={100} step={5} unit="%"
            />
          </div>
          <div className="text-xs text-gray-700 space-y-0.5 bg-white rounded p-2 border border-blue-100">
            <div>固定資産税: <span className="font-semibold">{previewFixed.toFixed(1)} 万円/年</span></div>
            <div>都市計画税: <span className="font-semibold">{previewCity.toFixed(1)} 万円/年</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={calcAndApply} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">
              この値を適用
            </button>
            <button onClick={() => setShowCalc(false)} className="text-sm text-gray-500 hover:underline">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
