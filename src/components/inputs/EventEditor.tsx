import { useScenario } from '../../store/scenario-store'
import { LifeEvent } from '../../types'

export function EventEditor() {
  const { scenario, dispatch } = useScenario()
  const events = scenario.events

  const update = (index: number, patch: Partial<LifeEvent>) => {
    dispatch({
      type: 'UPDATE_EVENTS',
      payload: events.map((e, i) => i === index ? { ...e, ...patch } : e),
    })
  }

  const add = () => {
    dispatch({
      type: 'UPDATE_EVENTS',
      payload: [...events, { age: 50, type: 'expense', label: '', amount: 1_000_000 }],
    })
  }

  const remove = (index: number) => {
    dispatch({ type: 'UPDATE_EVENTS', payload: events.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">ライフイベント</h2>
        <button onClick={add} className="text-sm text-blue-600 hover:underline">+ 追加</button>
      </div>

      {events.length === 0 && (
        <p className="text-sm text-gray-500">イベントが設定されていません</p>
      )}

      {events.map((event, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">年齢</label>
            <input
              type="number"
              value={event.age}
              onChange={(e) => update(i, { age: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">種別</label>
            <select
              value={event.type}
              onChange={(e) => update(i, { type: e.target.value as 'income' | 'expense' })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="expense">支出</option>
              <option value="income">収入</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">ラベル</label>
            <input
              type="text"
              value={event.label}
              onChange={(e) => update(i, { label: e.target.value })}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">金額（万円）</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={event.amount / 10000}
                onChange={(e) => update(i, { amount: Number(e.target.value) * 10000 })}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                min={0}
              />
              <button onClick={() => remove(i)} className="text-red-500 text-xs hover:underline">削除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
