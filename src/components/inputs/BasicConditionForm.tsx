import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

export function BasicConditionForm() {
  const { scenario, dispatch } = useScenario()
  const sc = scenario.scenario

  const update = (key: keyof typeof sc, value: string | number) =>
    dispatch({ type: 'UPDATE_SCENARIO', payload: { [key]: value } })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">基本条件</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">シナリオ名</label>
          <input
            type="text"
            value={sc.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <SliderInput
          label="手元に残したい最低現金額"
          value={sc.minimumCashBuffer / 10000}
          onChange={(v) => update('minimumCashBuffer', v * 10000)}
          min={0} max={3000} step={50} unit="万円"
        />

        <SliderInput
          label="シミュレーション開始年齢"
          value={sc.startAge}
          onChange={(v) => update('startAge', v)}
          min={20} max={70} step={1} unit="歳"
        />

        <SliderInput
          label="シミュレーション終了年齢"
          value={sc.endAge}
          onChange={(v) => update('endAge', v)}
          min={60} max={110} step={1} unit="歳"
        />

        <SliderInput
          label="運用利回り"
          value={parseFloat((sc.investmentReturnRate * 100).toFixed(1))}
          onChange={(v) => update('investmentReturnRate', v / 100)}
          min={0} max={10} step={0.1} unit="%"
          note="毎年の流動資産に適用される複利計算。手元現金には適用されません。"
        />

        <SliderInput
          label="インフレ率"
          value={parseFloat((sc.inflationRate * 100).toFixed(1))}
          onChange={(v) => update('inflationRate', v / 100)}
          min={0} max={5} step={0.1} unit="%"
          note="生活費が毎年増加するという想定を反映します。"
        />

        <SliderInput
          label="マクロ経済スライド調整率"
          value={parseFloat(((sc.macroEconomicSlideRate ?? 0.009) * 100).toFixed(1))}
          onChange={(v) => update('macroEconomicSlideRate', v / 100)}
          min={0} max={2} step={0.1} unit="%"
          note="年金改定率 = インフレ率 − この値。年金の実質価値が毎年この分だけ目減りします。"
        />
      </div>
    </div>
  )
}
