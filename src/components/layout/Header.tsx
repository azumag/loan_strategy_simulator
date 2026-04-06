import { useState, useRef, useEffect } from 'react'
import { useScenario } from '../../store/scenario-store'
import { saveNewScenario, loadScenarioById, listScenarios, getCurrentScenarioId, saveScenario } from '../../store/storage'

function ScenarioMenu() {
  const { scenario, dispatch } = useScenario()
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [savedList, setSavedList] = useState<{ id: string; name: string }[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setSavedList(listScenarios())
      setActiveId(getCurrentScenarioId())
    }
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 2000)
  }

  const handleSave = () => {
    if (activeId) {
      saveScenario(scenario, activeId)
      flash('上書き保存しました')
    } else {
      const id = saveNewScenario(scenario)
      setActiveId(id)
      flash('保存しました')
    }
    setSavedList(listScenarios())
  }

  const handleLoad = (id: string) => {
    const loaded = loadScenarioById(id)
    if (loaded) {
      dispatch({ type: 'LOAD', payload: loaded })
      setActiveId(id)
      flash('読み込みました')
      setOpen(false)
    }
  }

  const handleReset = () => {
    if (confirm('初期値にリセットしますか？')) {
      dispatch({ type: 'RESET' })
      setActiveId(null)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        データ管理
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">シナリオ管理</p>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                {activeId ? '上書き' : '保存'}
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                リセット
              </button>
            </div>

            {msg && <p className="text-xs text-green-600 font-medium">{msg}</p>}

            {savedList.length > 0 && (
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">保存済み（クリックでロード）</p>
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {savedList.map((s) => (
                    <li
                      key={s.id}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleLoad(s.id) }}
                      className={`text-xs px-2 py-1.5 rounded truncate cursor-pointer transition-colors select-none ${s.id === activeId ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-700'}`}
                    >
                      {s.id === activeId && '● '}{s.name || '（名称未設定）'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Header() {
  const { scenario, result } = useScenario()
  const { summary } = result
  const monthly = Math.round(summary.currentMonthlyPayment).toLocaleString()
  const payoff = summary.payoffAge ? `${summary.payoffAge}歳` : '未完済'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-lg font-bold text-gray-800 shrink-0">住宅ローンシミュレーター</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 min-w-0 overflow-hidden">
          <span className="hidden sm:inline shrink-0">月返済: <span className="font-semibold text-gray-900">¥{monthly}</span></span>
          <span className="shrink-0">完済: <span className="font-semibold text-gray-900">{payoff}</span></span>
          <span className="text-xs text-gray-400 truncate hidden md:inline">{scenario.scenario.name}</span>
        </div>
        <ScenarioMenu />
      </div>
    </header>
  )
}
