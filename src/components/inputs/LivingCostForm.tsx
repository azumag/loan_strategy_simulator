import { useScenario } from '../../store/scenario-store'
import { SliderInput } from '../ui/SliderInput'

export function LivingCostForm() {
  const { scenario, dispatch } = useScenario()
  const living = scenario.living

  const update = (key: keyof typeof living, value: number) =>
    dispatch({ type: 'UPDATE_LIVING', payload: { [key]: value } })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">生活費</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SliderInput
          label="月間生活費（現役時）"
          value={living.monthlyBaseCost / 10000}
          onChange={(v) => update('monthlyBaseCost', v * 10000)}
          min={0} max={100} step={1} unit="万円/月"
        />
        <SliderInput
          label="月間生活費（退職後）"
          value={living.monthlyRetirementCost / 10000}
          onChange={(v) => update('monthlyRetirementCost', v * 10000)}
          min={0} max={100} step={1} unit="万円/月"
        />
        <SliderInput
          label="教育費"
          value={living.educationCostAnnual / 10000}
          onChange={(v) => update('educationCostAnnual', v * 10000)}
          min={0} max={500} step={10} unit="万円/年"
        />
        <SliderInput
          label="車維持費"
          value={living.carCostAnnual / 10000}
          onChange={(v) => update('carCostAnnual', v * 10000)}
          min={0} max={200} step={5} unit="万円/年"
        />
        <SliderInput
          label="その他固定費"
          value={living.otherFixedCostAnnual / 10000}
          onChange={(v) => update('otherFixedCostAnnual', v * 10000)}
          min={0} max={500} step={10} unit="万円/年"
        />
      </div>
    </div>
  )
}
