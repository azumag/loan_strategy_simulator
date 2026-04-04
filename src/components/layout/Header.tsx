import { useState, useRef, useEffect } from 'react'
import { useScenario } from '../../store/scenario-store'
import { saveScenario, loadCurrentScenario, listScenarios } from '../../store/storage'

function ScenarioMenu() {
  const { scenario, dispatch } = useScenario()
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [savedList, setSavedList] = useState<{ id: string; name: string }[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSavedList(listScenarios())
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
    saveScenario(scenario)
    setSavedList(listScenarios())
    flash('保存しました')
  }

  const handleLoad = () => {
    const loaded = loadCurrentScenario()
    if (loaded) {
      dispatch({ type: 'LOAD', payload: loaded })
      flash('読み込みました')
      setOpen(false)
    }
  }

  const handleReset = () => {
    if (confirm('初期値にリセットしますか？')) {
      dispatch({ type: 'RESET' })
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
                保存
              </button>
              <button
                onClick={handleLoad}
                disabled={savedList.length === 0}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                読み込み
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-2 border border-gray-300 text-gray-600 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                リセット
              </button>
            </div>

            {msg && (
              <p className="text-xs text-green-600 font-medium">{msg}</p>
            )}

            {savedList.length > 0 && (
              <div className="pt-1 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1.5">保存済み</p>
                <ul className="space-y-1">
                  {savedList.map((s) => (
                    <li key={s.id} className="text-xs text-gray-700 bg-gray-50 px-2 py-1.5 rounded truncate">
                      {s.name || s.id}
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
        <h1 className="text-lg font-bold text-gray-800 shrink-0">ローン返済戦略シミュレータ</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600 min-w-0 overflow-hidden">
          <span className="hidden sm:inline shrink-0">月返済: <span className="font-semibold text-gray-900">¥{monthly}</span></span>
          <span className="shrink-0">完済: <span className="font-semibold text-gray-900">{payoff}</span></span>
          {summary.firstShortageAge && (
            <span className="text-red-600 font-semibold shrink-0 text-xs">⚠ {summary.firstShortageAge}歳資金ショート</span>
          )}
          <span className="text-xs text-gray-400 truncate hidden md:inline">{scenario.scenario.name}</span>
        </div>
        <ScenarioMenu />
      </div>
    </header>
  )
}
