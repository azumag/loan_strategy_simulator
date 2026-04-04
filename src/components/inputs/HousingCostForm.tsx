import { useState } from 'react'
import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

export function HousingCostForm() {
  const { scenario, dispatch } = useScenario()
  const housing = scenario.housing
  const loanPrincipal = scenario.loan.principal

  const [showCalc, setShowCalc] = useState(false)
  const [propertyPrice, setPropertyPrice] = useState(Math.round(loanPrincipal / 10000))
  const [landRatio, setLandRatio] = useState(50)
  const [landAssessmentRatio, setLandAssessmentRatio] = useState(70)
  const [buildingAssessmentRatio, setBuildingAssessmentRatio] = useState(60)
  const [smallLand, setSmallLand] = useState(true) // 200㎡以下の小規模住宅用地
  const [cityPlanningTaxRate, setCityPlanningTaxRate] = useState(0.3) // 都市計画税率（%）

  const update = (key: keyof typeof housing, value: number) =>
    dispatch({ type: 'UPDATE_HOUSING', payload: { [key]: value } })

  // 住宅用地特例を考慮した概算計算
  // 土地: 小規模住宅用地(200㎡以下)は課税標準が評価額×1/6(固定資産税)・1/3(都市計画税)
  //       一般住宅用地(200㎡超)は評価額×1/3(固定資産税)・2/3(都市計画税)
  // 建物: 評価額×税率（特例なし）
  const calcPreview = () => {
    const landAssessed = propertyPrice * (landRatio / 100) * (landAssessmentRatio / 100)
    const buildingAssessed = propertyPrice * (1 - landRatio / 100) * (buildingAssessmentRatio / 100)

    const landFixedBase = smallLand ? landAssessed * (1 / 6) : landAssessed * (1 / 3)
    const landCityBase = smallLand ? landAssessed * (1 / 3) : landAssessed * (2 / 3)

    const previewFixed = Math.round((landFixedBase + buildingAssessed) * 0.014 * 10) / 10
    const previewCity = Math.round((landCityBase + buildingAssessed) * (cityPlanningTaxRate / 100) * 10) / 10
    return { previewFixed, previewCity }
  }

  const { previewFixed, previewCity } = calcPreview()

  const calcAndApply = () => {
    dispatch({ type: 'UPDATE_HOUSING', payload: {
      fixedAssetTaxAnnual: Math.round(previewFixed * 10000),
      cityPlanningTaxAnnual: Math.round(previewCity * 10000),
    }})
    setShowCalc(false)
  }

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

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">都市計画税</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={housing.cityPlanningTaxAnnual / 10000}
                onChange={(e) => update('cityPlanningTaxAnnual', Number(e.target.value) * 10000)}
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
            type="range" min={0} max={50} step={1}
            value={Math.min(50, housing.cityPlanningTaxAnnual / 10000)}
            onChange={(e) => update('cityPlanningTaxAnnual', Number(e.target.value) * 10000)}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600"
            style={{ background: `linear-gradient(to right, #2563eb ${Math.min(50, housing.cityPlanningTaxAnnual / 10000) * 2}%, #e5e7eb ${Math.min(50, housing.cityPlanningTaxAnnual / 10000) * 2}%)` }}
          />
        </div>
        <div className="space-y-1">
          <SliderInput
            label="火災保険料"
            value={housing.homeInsuranceAnnual / 10000}
            onChange={(v) => update('homeInsuranceAnnual', v * 10000)}
            min={0} max={30} step={1} unit="万円/年"
          />
          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={housing.homeInsuranceDeductible ?? false}
              onChange={(e) => dispatch({ type: 'UPDATE_HOUSING', payload: { homeInsuranceDeductible: e.target.checked } })}
              className="rounded"
            />
            賃貸・事業用途として必要経費に計上する
          </label>
        </div>
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
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-700 mb-1">概算計算（住宅用地特例を考慮）</p>
            <p className="text-xs text-gray-500">
              固定資産税1.4%・都市計画税は自治体ごとに異なります（上限0.3%）。
              土地は住宅用地特例を適用します。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SliderInput
              label="物件価格"
              value={propertyPrice}
              onChange={setPropertyPrice}
              min={500} max={20000} step={100} unit="万円"
            />
            <SliderInput
              label="土地割合"
              value={landRatio}
              onChange={setLandRatio}
              min={10} max={90} step={5} unit="%"
              note="物件価格に占める土地の割合"
            />
            <SliderInput
              label="土地評価割合"
              value={landAssessmentRatio}
              onChange={setLandAssessmentRatio}
              min={50} max={100} step={5} unit="%"
              note="路線価÷時価の目安（約70%）"
            />
            <SliderInput
              label="建物評価割合"
              value={buildingAssessmentRatio}
              onChange={setBuildingAssessmentRatio}
              min={30} max={80} step={5} unit="%"
              note="新築時は約60%が目安"
            />
            <div className="col-span-2">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap">都市計画税率</label>
                <input
                  type="number"
                  value={cityPlanningTaxRate}
                  onChange={(e) => setCityPlanningTaxRate(Math.min(0.3, Math.max(0, Number(e.target.value))))}
                  step={0.01} min={0} max={0.3}
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <span className="text-xs text-gray-500">%（上限0.3%。例：調布市0.24%）</span>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={smallLand}
              onChange={(e) => setSmallLand(e.target.checked)}
              className="rounded"
            />
            小規模住宅用地（200㎡以下）— 固定資産税:1/6軽減 / 都市計画税:1/3軽減
          </label>

          <div className="text-xs text-gray-700 space-y-1 bg-white rounded p-3 border border-blue-100">
            <div className="flex justify-between">
              <span>固定資産税（1.4%）:</span>
              <span className="font-semibold text-blue-700">{previewFixed.toFixed(1)} 万円/年</span>
            </div>
            <div className="flex justify-between">
              <span>都市計画税（{cityPlanningTaxRate}%）:</span>
              <span className="font-semibold text-blue-700">{previewCity.toFixed(1)} 万円/年</span>
            </div>
            <div className="flex justify-between border-t pt-1 mt-1">
              <span>合計:</span>
              <span className="font-semibold text-blue-700">{(previewFixed + previewCity).toFixed(1)} 万円/年</span>
            </div>
            <p className="text-gray-400 mt-1">※新築軽減（建物分3〜5年間1/2）は含みません</p>
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
