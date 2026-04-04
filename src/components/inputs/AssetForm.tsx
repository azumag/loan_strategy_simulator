import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

export function AssetForm() {
  const { scenario, dispatch } = useScenario()
  const assets = scenario.assets

  const update = (key: keyof typeof assets, value: number) =>
    dispatch({ type: 'UPDATE_ASSETS', payload: { [key]: value } })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">資産・防衛資金</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderInput
          label="初期現金"
          value={assets.initialCash / 10000}
          onChange={(v) => update('initialCash', v * 10000)}
          min={0} max={5000} step={50} unit="万円"
        />
        <SliderInput
          label="流動資産"
          value={assets.initialLiquidAssets / 10000}
          onChange={(v) => update('initialLiquidAssets', v * 10000)}
          min={0} max={10000} step={100} unit="万円"
          note="すぐに現金化できる資産（預貯金・株式等）。運用利回りが毎年適用されます。"
        />
        <SliderInput
          label="準流動資産"
          value={assets.initialSemiLiquidAssets / 10000}
          onChange={(v) => update('initialSemiLiquidAssets', v * 10000)}
          min={0} max={5000} step={50} unit="万円"
          note="緊急時に現金化可能な資産（貴金属・美術品等）。運用利回りは適用されません。"
        />
        <SliderInput
          label="退職金見込み"
          value={assets.initialRetirementAssets / 10000}
          onChange={(v) => update('initialRetirementAssets', v * 10000)}
          min={0} max={5000} step={100} unit="万円"
        />
        <SliderInput
          label="年間追加積立"
          value={assets.annualSavingsContribution / 10000}
          onChange={(v) => update('annualSavingsContribution', v * 10000)}
          min={0} max={500} step={10} unit="万円/年"
        />
        <SliderInput
          label="緊急時使用可能割合"
          value={Math.round(assets.emergencyUsableRatio * 100)}
          onChange={(v) => update('emergencyUsableRatio', v / 100)}
          min={0} max={100} step={5} unit="%"
          note="準流動資産から実際に使用できる割合。"
        />
      </div>
    </div>
  )
}
