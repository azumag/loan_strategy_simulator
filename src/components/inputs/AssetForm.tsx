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
  const isUnified = (assets.investmentContributionMode ?? 'separate') === 'unified'

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

      {/* 投資モード切替 */}
      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-blue-800">年間投資設定</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="investmentMode"
              value="separate"
              checked={!isUnified}
              onChange={() => dispatch({ type: 'UPDATE_ASSETS', payload: { investmentContributionMode: 'separate' } })}
            />
            <span className="text-sm text-gray-700">分離</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="investmentMode"
              value="unified"
              checked={isUnified}
              onChange={() => dispatch({ type: 'UPDATE_ASSETS', payload: { investmentContributionMode: 'unified' } })}
            />
            <span className="text-sm text-gray-700">統合（NISA優先）</span>
          </label>
        </div>
        {isUnified ? (
          <SliderInput
            label="年間投資総額"
            value={(assets.totalAnnualInvestment ?? 0) / 10000}
            onChange={(v) => update('totalAnnualInvestment', v * 10000)}
            min={0} max={600} step={12} unit="万円/年"
            note="NISA→課税口座の優先順で自動配分"
          />
        ) : (
          <p className="text-xs text-gray-500">
            ※ NISAと課税口座に分けて積み立てます。NISA満額後の課税口座への自動積み立ては下部のトグルで設定できます。
          </p>
        )}
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

        {/* NISA満額後の課税口座自動積立トグル */}
        {!isUnified && (
          <div className="flex items-center justify-between pt-2 border-t border-green-200">
            <div className="flex-1">
              <label htmlFor="autoOverflowToTaxableWhenNisaFull" className="text-sm font-medium text-gray-700 cursor-pointer">
                NISA満額後、課税口座に自動積み立て
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                NISA枠が上限に達した場合、NISA積立額の余剰分を自動的に課税口座へ振り替えます
              </p>
            </div>
            <button
              id="autoOverflowToTaxableWhenNisaFull"
              type="button"
              role="switch"
              aria-checked={assets.autoOverflowToTaxableWhenNisaFull ?? true}
              onClick={() => dispatch({ type: 'UPDATE_ASSETS', payload: { autoOverflowToTaxableWhenNisaFull: !(assets.autoOverflowToTaxableWhenNisaFull ?? true) } })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                (assets.autoOverflowToTaxableWhenNisaFull ?? true) ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  (assets.autoOverflowToTaxableWhenNisaFull ?? true) ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
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

      {/* 退職後の資産取り崩し */}
      <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-orange-800">退職後の資産取り崩し</h3>
        <SliderInput
          label="年間取り崩し額"
          value={(assets.annualRetirementDrawdown ?? 0) / 10000}
          onChange={(v) => update('annualRetirementDrawdown', v * 10000)}
          min={0} max={500} step={10} unit="万円/年"
        />
        <p className="text-xs text-orange-700">
          ※ 退職後（退職後ステージ）に毎年この金額を投資口座から現金へ移します。NISAから優先して引き出し、残りを課税口座から補完します。
        </p>
      </div>

      {/* 個別株配当シミュレーション */}
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold text-yellow-800">個別株配当シミュレーション</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SliderInput
            label="NISA口座の個別株比率"
            value={Math.round((assets.nisaStockRatio ?? 0) * 100)}
            onChange={(v) => update('nisaStockRatio', v / 100)}
            min={0} max={100} step={5} unit="%"
            note="NISAのうち個別株に投資している割合"
          />
          <SliderInput
            label="課税口座の個別株比率"
            value={Math.round((assets.liquidStockRatio ?? 0) * 100)}
            onChange={(v) => update('liquidStockRatio', v / 100)}
            min={0} max={100} step={5} unit="%"
            note="課税口座のうち個別株に投資している割合"
          />
          <SliderInput
            label="個別株配当利回り"
            value={Math.round((assets.stockDividendYield ?? 0.03) * 1000) / 10}
            onChange={(v) => update('stockDividendYield', v / 100)}
            min={0} max={10} step={0.1} unit="%"
            note="年間配当利回り（株価上昇分は総利回りから配当利回りを差し引いた分）"
          />
        </div>
        <p className="text-xs text-yellow-700">
          ※ NISA配当は非課税で現金流入。課税口座配当は20.315%源泉徴収後に現金流入。インデックス部分は配当再投資として残高に反映されます。
        </p>
      </div>
    </div>
  )
}
