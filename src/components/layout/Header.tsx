import { useState, useEffect, useRef } from 'react'
import { useScenario } from '../../store/scenario-store'
import {
  saveNewScenario,
  loadScenarioById,
  listScenarios,
  getCurrentScenarioId,
  saveScenario,
  deleteScenario,
  reorderScenario,
} from '../../store/storage'
import { DEFAULT_SCENARIO } from '../../utils/defaults'

export function Header() {
  const { scenario, result, dispatch } = useScenario()
  const { summary } = result
  const monthly = Math.round(summary.currentMonthlyPayment).toLocaleString()
  const payoff = summary.payoffAge ? `${summary.payoffAge}歳` : '未完済'

  const [savedList, setSavedList] = useState<{ id: string; name: string }[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const refresh = () => {
    setSavedList(listScenarios())
    setActiveId(getCurrentScenarioId())
  }

  useEffect(() => { refresh() }, [])

  // パネル外クリックで閉じる
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [panelOpen])

  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 2000)
  }

  const handleSave = () => {
    if (activeId) {
      saveScenario(scenario, activeId)
      flash('上書き保存')
    } else {
      const id = saveNewScenario(scenario)
      setActiveId(id)
      flash('保存しました')
    }
    refresh()
  }

  const handleSaveNew = () => {
    const id = saveNewScenario(scenario)
    setActiveId(id)
    refresh()
    flash('別名保存しました')
  }

  const handleNew = () => {
    const id = saveNewScenario(DEFAULT_SCENARIO)
    dispatch({ type: 'RESET' })
    setActiveId(id)
    refresh()
    flash('新規作成しました')
  }

  const handleSelect = (id: string) => {
    if (id === activeId) return
    const loaded = loadScenarioById(id)
    if (loaded) {
      dispatch({ type: 'LOAD', payload: loaded })
      setActiveId(id)
      flash('読み込みました')
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name || '（名称未設定）'}」を削除しますか？`)) return
    deleteScenario(id)
    if (activeId === id) setActiveId(null)
    refresh()
    flash('削除しました')
  }

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    reorderScenario(id, direction)
    refresh()
  }

  const handleReset = () => {
    if (confirm('初期値にリセットしますか？（保存データは消えません）')) {
      dispatch({ type: 'RESET' })
      setActiveId(null)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        {/* タイトル */}
        <h1 className="text-base font-bold text-gray-800 shrink-0">住宅ローンシミュレーター</h1>

        {/* サマリ */}
        <div className="flex items-center gap-3 text-sm text-gray-600 shrink-0">
          <span className="hidden sm:inline">月返済: <span className="font-semibold text-gray-900">¥{monthly}</span></span>
          <span>完済: <span className="font-semibold text-gray-900">{payoff}</span></span>
        </div>

        <div className="flex-1" />

        {/* シナリオ管理 — インライン */}
        <div className="flex items-center gap-2 flex-wrap relative" ref={panelRef}>
          {savedList.length > 0 && (
            <select
              value={activeId ?? ''}
              onChange={(e) => handleSelect(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 max-w-[180px] truncate"
            >
              {!activeId && <option value="">（未選択）</option>}
              {savedList.map((s, i) => (
                <option key={s.id} value={s.id}>
                  {i === 0 ? '★ ' : ''}{s.name || '（名称未設定）'}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 shrink-0"
          >
            {activeId ? '上書き' : '保存'}
          </button>

          <button
            onClick={handleSaveNew}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 shrink-0"
          >
            別名保存
          </button>

          <button
            onClick={handleNew}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 shrink-0"
          >
            新規
          </button>

          <button
            onClick={handleReset}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 shrink-0"
          >
            リセット
          </button>

          {/* 一覧パネルトグル */}
          {savedList.length > 0 && (
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className={`px-2 py-1 text-sm border rounded-md shrink-0 ${
                panelOpen
                  ? 'border-blue-400 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
              title="シナリオ一覧を表示"
            >
              一覧 {panelOpen ? '▲' : '▼'}
            </button>
          )}

          {msg && <span className="text-xs text-green-600 font-medium">{msg}</span>}

          {/* ドロップダウンパネル */}
          {panelOpen && savedList.length > 0 && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-50 p-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">保存済みシナリオ</h3>
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {savedList.map((s, i) => {
                  const isActive = s.id === activeId
                  return (
                    <li
                      key={s.id}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-md border text-sm ${
                        isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex flex-col shrink-0">
                        <button
                          onClick={() => handleReorder(s.id, 'up')}
                          disabled={i === 0}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none text-xs"
                        >▲</button>
                        <button
                          onClick={() => handleReorder(s.id, 'down')}
                          disabled={i === savedList.length - 1}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none text-xs"
                        >▼</button>
                      </div>
                      <span className={`flex-1 truncate ${isActive ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                        {i === 0 && <span className="mr-1 text-xs text-orange-500 font-normal">自動ロード</span>}
                        {isActive && <span className="mr-1 text-blue-500">●</span>}
                        {s.name || '（名称未設定）'}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        {!isActive && (
                          <button
                            onClick={() => { handleSelect(s.id); setPanelOpen(false) }}
                            className="text-xs text-blue-600 hover:underline px-1"
                          >
                            ロード
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="text-xs text-red-500 hover:underline px-1"
                        >
                          削除
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="text-xs text-gray-400 mt-2">
                ※ 先頭のシナリオを起動時に自動ロード
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
