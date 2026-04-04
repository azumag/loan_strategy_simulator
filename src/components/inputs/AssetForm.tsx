import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

const NISA_LIFETIME_CAP = 1800 // 万円

export function AssetForm() {
  const { scenario, dispatch } = useScenario()
  const assets = scenario.assets

  const update = (key: keyof typeof assets, value: number) =>
    dispatch({ type: 'UPDATE_ASSETS', payload: { [key]: value } })

  const nisaBalance = (assets.initialNisaBalance ?? 0) / 10000
  const nisaUsageRatio = Math.min(100, Math.round((nisaBalance / NISA_LIFETIME_CAP) * 100))

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">資産・防衛資金</h2>

      {/* 現金 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderInput
          label="初期現金"
          value={assets.initialCash / 10000}
          onChange={(v) => update('initialCash', v * 10000)}
          min={0} max={5000} step={50} unit="万円"
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
          label="緊急時使用可能割合"
          value={Math.round(assets.emergencyUsableRatio * 100)}
          onChange={(v) => update('emergencyUsableRatio', v / 100)}
          min={0} max={100} step={5} unit="%"
          note="準流動資産から実際に使用できる割合。"
        />
      </div>

      {/* NISA */}
      <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-green-800">NISA口座（非課税）</h3>
          <span className="text-xs text-green-700">生涯上限 {NISA_LIFETIME_CAP}万円</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderInput
            label="NISA現在残高"
            value={nisaBalance}
            onChange={(v) => update('initialNisaBalance', v * 10000)}
            min={0} max={NISA_LIFETIME_CAP} step={50} unit="万円"
            note="現時点のNISA口座残高"
          />
          <SliderInput
            label="年間NISA積立額"
            value={(assets.annualNisaContribution ?? 0) / 10000}
            onChange={(v) => update('annualNisaContribution', v * 10000)}
            min={0} max={360} step={12} unit="万円/年"
            note="新NISA上限360万円/年（成長240+積立120）"
          />
        </div>

        {/* NISA枠使用状況 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-green-700">
            <span>生涯枠の使用状況（初期残高ベース）</span>
            <span>{nisaBalance.toFixed(0)}万 / {NISA_LIFETIME_CAP}万円</span>
          </div>
          <div className="w-full bg-green-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${nisaUsageRatio}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-green-600">
          ※ 運用益は非課税。積立額が生涯上限（1800万円）または年間上限（360万円）を超える場合は自動で上限適用。
        </p>
      </div>

      {/* 課税口座 */}
      <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">課税口座（流動資産）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderInput
            label="課税口座残高"
            value={assets.initialLiquidAssets / 10000}
            onChange={(v) => update('initialLiquidAssets', v * 10000)}
            min={0} max={10000} step={100} unit="万円"
            note="特定口座・一般口座など。運用利回りが毎年適用されます。"
          />
          <SliderInput
            label="年間積立額"
            value={assets.annualSavingsContribution / 10000}
            onChange={(v) => update('annualSavingsContribution', v * 10000)}
            min={0} max={500} step={10} unit="万円/年"
            note="毎年現金から課税口座へ移動する金額"
          />
        </div>
        <p className="text-xs text-gray-500">
          ※ 積立はキャッシュフローから差し引かれます。現金残高が不足する場合は積立を抑制します。
        </p>
      </div>
    </div>
  )
}
