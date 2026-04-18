import { useState, useEffect, useRef } from 'react'
import {
  Home, Sun, Moon, Plus,
  CircleDot, Circle, ChevronUp, ChevronDown, Download,
} from 'lucide-react'
import { useScenario } from '../../store/scenario-store'
import { useToast } from '../ui/ToastContext'
import { useTheme } from '../../store/theme-store'
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
  const feas = summary.retirementFeasibility
  const feasTone = feas === 'safe' ? 'var(--safe)' : feas === 'warning' ? 'var(--warn)' : 'var(--danger)'
  const feasLabel = feas === 'safe' ? '安全' : feas === 'warning' ? '注意' : '危険'
  const feasPct = feas === 'safe' ? 92 : feas === 'warning' ? 58 : 24

  const { mode, toggleMode } = useTheme()

  const [savedList, setSavedList] = useState<{ id: string; name: string }[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const { toast } = useToast()
  const panelRef = useRef<HTMLDivElement>(null)

  const refresh = () => {
    setSavedList(listScenarios())
    setActiveId(getCurrentScenarioId())
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [panelOpen])

  const handleSave = () => {
    if (activeId) {
      saveScenario(scenario, activeId)
      toast('上書き保存')
    } else {
      const id = saveNewScenario(scenario)
      setActiveId(id)
      toast('保存しました')
    }
    refresh()
  }

  const handleSaveNew = () => {
    const id = saveNewScenario(scenario)
    setActiveId(id)
    refresh()
    toast('別名保存しました')
  }

  const handleNew = () => {
    const id = saveNewScenario(DEFAULT_SCENARIO)
    dispatch({ type: 'RESET' })
    setActiveId(id)
    refresh()
    toast('新規作成しました')
  }

  const handleSelect = (id: string) => {
    if (id === activeId) return
    const loaded = loadScenarioById(id)
    if (loaded) {
      dispatch({ type: 'LOAD', payload: loaded })
      setActiveId(id)
      toast('読み込みました')
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name || '（名称未設定）'}」を削除しますか？`)) return
    deleteScenario(id)
    if (activeId === id) setActiveId(null)
    refresh()
    toast('削除しました')
  }

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    reorderScenario(id, direction)
    refresh()
  }

  return (
    <header
      className="t-card border-b t-border"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40 }}
    >
      {/* Row 1: brand / theme */}
      <div className="flex items-center gap-3 px-5 py-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--brand)', color: 'var(--bg-2)' }}
          >
            <Home size={18} />
          </div>
          <div>
            <div className="font-display font-bold t-fg text-[15px] leading-tight">住宅ローンシミュレーター</div>
            <div className="text-[11px] t-fg3 -mt-px">Strategy Simulator</div>
          </div>
        </div>

        <div className="flex-1" />

        <button className="btn btn-ghost !p-2" onClick={toggleMode} title="テーマ切替" aria-label="テーマ切替">
          {mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Row 2: scenario dock + live summary */}
      <div className="flex items-center gap-3 px-5 py-2 flex-wrap" style={{ borderTop: '1px solid var(--border-s)' }}>
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0 relative" ref={panelRef}>
          {savedList.slice(0, 6).map((s) => {
            const isActive = s.id === activeId
            return (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className="chip px-3 py-1.5"
                style={{
                  background: isActive ? 'var(--brand-soft)' : 'var(--bg-inset)',
                  color: isActive ? 'var(--brand)' : 'var(--fg-2)',
                  border: isActive ? '1px solid var(--brand)' : '1px solid transparent',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {isActive ? <CircleDot size={12} /> : <Circle size={12} />}
                <span className="truncate max-w-[140px]">{s.name || '（名称未設定）'}</span>
              </button>
            )
          })}

          <button onClick={handleNew} className="btn btn-ghost !py-1 !px-2 !text-xs">
            <Plus size={12} />
            新規
          </button>

          {savedList.length > 0 && (
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="btn btn-ghost !py-1 !px-2 !text-xs"
              title="シナリオ一覧 / 並べ替え / 削除"
            >
              管理 ({savedList.length})
              {panelOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}

          {panelOpen && (
            <div
              className="absolute left-0 top-full mt-2 w-80 t-card rounded-xl border t-border p-3 z-50"
              style={{ boxShadow: 'var(--shadow-pop)' }}
            >
              <h3 className="text-xs font-bold t-fg2 mb-2 uppercase tracking-widest">保存済みシナリオ</h3>
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {savedList.map((s, i) => {
                  const isActive = s.id === activeId
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm"
                      style={{
                        background: isActive ? 'var(--brand-soft)' : 'var(--bg-inset)',
                        border: isActive ? '1px solid var(--brand)' : '1px solid transparent',
                      }}
                    >
                      <div className="flex flex-col shrink-0">
                        <button
                          onClick={() => handleReorder(s.id, 'up')}
                          disabled={i === 0}
                          className="leading-none text-[10px] t-fg4 hover:t-fg disabled:opacity-20"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleReorder(s.id, 'down')}
                          disabled={i === savedList.length - 1}
                          className="leading-none text-[10px] t-fg4 hover:t-fg disabled:opacity-20"
                        >
                          ▼
                        </button>
                      </div>
                      <span className={`flex-1 truncate ${isActive ? 'font-semibold t-brand' : 't-fg2'}`}>
                        {i === 0 && <span className="mr-1 text-[10px] t-accent">自動</span>}
                        {s.name || '（名称未設定）'}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        {!isActive && (
                          <button
                            onClick={() => { handleSelect(s.id); setPanelOpen(false) }}
                            className="text-[11px] t-brand hover:underline px-1"
                          >
                            ロード
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="text-[11px] t-danger hover:underline px-1"
                        >
                          削除
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              <p className="text-[11px] t-fg4 mt-2">※ 先頭のシナリオを起動時に自動ロード</p>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="btn btn-primary !py-1.5 !px-3 !text-xs">
            <Download size={12} /> {activeId ? '上書き' : '保存'}
          </button>
          <button onClick={handleSaveNew} className="btn btn-soft !py-1.5 !px-3 !text-xs">
            別名保存
          </button>
        </div>

        {/* live summary */}
        <div className="flex items-center gap-4 text-xs pl-3 border-l t-border">
          <div className="flex flex-col items-end">
            <span className="t-fg4 text-[10px] uppercase tracking-wider">月返済</span>
            <span className="kpi-num t-fg" style={{ fontSize: 15 }}>¥{monthly}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="t-fg4 text-[10px] uppercase tracking-wider">完済</span>
            <span className="kpi-num t-fg" style={{ fontSize: 15 }}>{payoff}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="ring" style={{ ['--p' as string]: feasPct, ['--c' as string]: feasTone, width: 36, height: 36 } as React.CSSProperties}>
              <span className="text-[9px] font-bold" style={{ color: feasTone }}>{feasPct}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] t-fg4 uppercase tracking-wider">老後</span>
              <span className="text-xs font-bold" style={{ color: feasTone }}>{feasLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
