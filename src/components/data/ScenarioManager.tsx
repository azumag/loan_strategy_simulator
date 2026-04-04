import { useState, useEffect } from 'react'
import { useScenario } from '../../store/scenario-store'
import { saveScenario, loadCurrentScenario, listScenarios } from '../../store/storage'

export function ScenarioManager() {
  const { scenario, dispatch } = useScenario()
  const [savedList, setSavedList] = useState<{ id: string; name: string }[]>([])
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    setSavedList(listScenarios())
  }, [])

  const handleSave = () => {
    saveScenario(scenario)
    setSavedList(listScenarios())
    setSaveMsg('保存しました')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  const handleLoad = () => {
    const loaded = loadCurrentScenario()
    if (loaded) {
      dispatch({ type: 'LOAD', payload: loaded })
      setSaveMsg('読み込みました')
      setTimeout(() => setSaveMsg(''), 2000)
    }
  }

  const handleReset = () => {
    if (confirm('初期値にリセットしますか？')) {
      dispatch({ type: 'RESET' })
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">データ管理</h2>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          保存
        </button>
        <button
          onClick={handleLoad}
          disabled={savedList.length === 0}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 disabled:opacity-50"
        >
          読み込み
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50"
        >
          リセット
        </button>
        {saveMsg && <span className="text-sm text-green-600 self-center">{saveMsg}</span>}
      </div>

      {savedList.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">保存済みシナリオ</h3>
          <ul className="space-y-1">
            {savedList.map((s) => (
              <li key={s.id} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                {s.name || s.id}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
