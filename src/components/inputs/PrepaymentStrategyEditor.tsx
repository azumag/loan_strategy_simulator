import { useScenario } from '../../store/scenario-store'
import { PrepaymentEntry } from '../../types'

export function PrepaymentStrategyEditor() {
  const { scenario, dispatch } = useScenario()
  const strategy = scenario.strategy
  const sc = scenario.scenario

  const updateEntry = (index: number, patch: Partial<PrepaymentEntry>) => {
    dispatch({
      type: 'UPDATE_STRATEGY',
      payload: {
        prepayments: strategy.prepayments.map((p, i) =>
          i === index ? { ...p, ...patch } : p
        ),
      },
    })
  }

  const add = () => {
    dispatch({
      type: 'UPDATE_STRATEGY',
      payload: {
        prepayments: [...strategy.prepayments, { age: 50, amount: 5_000_000, source: 'cash', mode: 'one_time' }],
      },
    })
  }

  const remove = (index: number) => {
    dispatch({
      type: 'UPDATE_STRATEGY',
      payload: { prepayments: strategy.prepayments.filter((_, i) => i !== index) },
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">繰上返済戦略</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">目標完済年齢</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={strategy.targetPayoffAge}
            onChange={(e) => dispatch({ type: 'UPDATE_STRATEGY', payload: { targetPayoffAge: Number(e.target.value.replace(/\D/g, '')) } })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="stopOnBuffer"
            checked={strategy.stopPrepaymentIfCashBelowBuffer}
            onChange={(e) => dispatch({ type: 'UPDATE_STRATEGY', payload: { stopPrepaymentIfCashBelowBuffer: e.target.checked } })}
            className="rounded"
          />
          <label htmlFor="stopOnBuffer" className="text-sm text-gray-700">現金バッファ以下なら繰上返済を中止</label>
        </div>
        <div className="flex items-center gap-2 pt-6 md:col-span-2">
          <input
            type="checkbox"
            id="comparePrepayment"
            checked={sc.comparePrepayment}
            onChange={(e) => dispatch({ type: 'UPDATE_SCENARIO', payload: { comparePrepayment: e.target.checked } })}
            className="rounded"
          />
          <label htmlFor="comparePrepayment" className="text-sm text-gray-700">繰上げ返済の損益分岐点を表示</label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">繰上返済計画</h3>
          <button onClick={add} className="text-sm text-blue-600 hover:underline">+ 追加</button>
        </div>

        {strategy.prepayments.length === 0 && (
          <p className="text-sm text-gray-500">繰上返済の計画が設定されていません</p>
        )}

        {strategy.prepayments.map((p, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 mb-2 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">年齢</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={p.age}
                onChange={(e) => updateEntry(i, { age: Number(e.target.value.replace(/\D/g, '')) })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">金額（万円）</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={p.amount / 10000}
                onChange={(e) => updateEntry(i, { amount: Number(e.target.value.replace(/\D/g, '')) * 10000 })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">原資</label>
              <select
                value={p.source}
                onChange={(e) => updateEntry(i, { source: e.target.value as 'cash' | 'liquid_assets' })}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="cash">現金</option>
                <option value="liquid_assets">流動資産</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button onClick={() => remove(i)} className="text-red-500 text-xs hover:underline mb-1">削除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
