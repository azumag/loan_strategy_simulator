import { useState, useEffect } from 'react'
import { useScenario } from '../../store/scenario-store'
import {
  saveScenario,
  saveNewScenario,
  loadScenarioById,
  listScenarios,
  deleteScenario,
  reorderScenario,
  getCurrentScenarioId,
} from '../../store/storage'

export function ScenarioManager() {
  const { scenario, dispatch } = useScenario()
  const [savedList, setSavedList] = useState<{ id: string; name: string }[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const refresh = () => {
    setSavedList(listScenarios())
    setActiveId(getCurrentScenarioId())
  }

  useEffect(() => { refresh() }, [])

  const showMsg = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 2000)
  }

  // 上書き保存（現在のIDへ）
  const handleOverwrite = () => {
    if (!activeId) {
      handleSaveNew()
      return
    }
    saveScenario(scenario, activeId)
    refresh()
    showMsg('上書き保存しました')
  }

  // 新規保存
  const handleSaveNew = () => {
    const newId = saveNewScenario(scenario)
    setActiveId(newId)
    refresh()
    showMsg('新規保存しました')
  }

  // シナリオをロード
  const handleLoad = (id: string) => {
    const loaded = loadScenarioById(id)
    if (loaded) {
      dispatch({ type: 'LOAD', payload: loaded })
      setActiveId(id)
      showMsg('読み込みました')
    }
  }

  // 順番変更
  const handleReorder = (id: string, direction: 'up' | 'down') => {
    reorderScenario(id, direction)
    refresh()
  }

  // シナリオを削除
  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    deleteScenario(id)
    if (activeId === id) setActiveId(null)
    refresh()
    showMsg('削除しました')
  }

  const handleReset = () => {
    if (confirm('初期値にリセットしますか？（保存データは消えません）')) {
      dispatch({ type: 'RESET' })
      setActiveId(null)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">データ管理</h2>

      {/* 保存ボタン群 */}
      <div className="flex gap-3 flex-wrap items-center">
        <button
          onClick={handleOverwrite}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          {activeId ? '上書き保存' : '保存'}
        </button>
        <button
          onClick={handleSaveNew}
          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
        >
          新規保存
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50"
        >
          リセット
        </button>
        {msg && <span className="text-sm text-green-600">{msg}</span>}
      </div>

      {/* 保存済み一覧 */}
      {savedList.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">保存済みシナリオ</h3>
          <ul className="space-y-2">
            {savedList.map((s, i) => {
              const isActive = s.id === activeId
              return (
                <li
                  key={s.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border ${isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  {/* 上下ボタン */}
                  <div className="flex flex-col mr-2 shrink-0">
                    <button
                      onClick={() => handleReorder(s.id, 'up')}
                      disabled={i === 0}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none"
                      title="上に移動"
                    >▲</button>
                    <button
                      onClick={() => handleReorder(s.id, 'down')}
                      disabled={i === savedList.length - 1}
                      className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none"
                      title="下に移動"
                    >▼</button>
                  </div>
                  <span className={`text-sm flex-1 truncate ${isActive ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                    {i === 0 && <span className="mr-1 text-xs text-orange-500 font-normal">自動ロード</span>}
                    {isActive && <span className="mr-1 text-blue-500">●</span>}
                    {s.name || '（名称未設定）'}
                  </span>
                  <div className="flex gap-2 ml-2 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => handleLoad(s.id)}
                        className="text-xs text-blue-600 hover:underline px-2 py-1"
                      >
                        ロード
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="text-xs text-red-500 hover:underline px-2 py-1"
                    >
                      削除
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-400">保存済みシナリオはありません。</p>
      )}

      <p className="text-xs text-gray-400">
        ※ データはブラウザのローカルストレージに保存されます。起動時は先頭のシナリオを自動ロードします。
      </p>
    </div>
  )
}
