import { useScenario } from '../../store/scenario-store'
import { CareerStage, WorkStyle, SmallBusinessMutualPayoutMethod } from '../../types'

const EMPTY_EMPLOYEE: CareerStage = {
  fromAge: 40,
  toAge: 64,
  workStyle: 'employee',
  salaryInputMode: 'gross',
  grossSalaryAnnual: 5_000_000,
  bonusAnnual: 0,
  sideIncomeAnnual: 0,
}

const EMPTY_SELF_EMPLOYED: CareerStage = {
  fromAge: 40,
  toAge: 64,
  workStyle: 'self_employed',
  grossRevenueAnnual: 8_000_000,
  businessExpenseAnnual: 1_000_000,
  bluePenaltyDeduction: 650_000,
  smallBusinessMutualAnnual: 0,
  bankruptcyMutualAnnual: 0,
  sideIncomeAnnual: 0,
}

const EMPTY_RETIRED: CareerStage = {
  fromAge: 65,
  toAge: 90,
  workStyle: 'retired',
  retirementNationalPensionAnnual: 780_000,
  retirementEmployeesPensionAnnual: 600_000,
  retirementOtherIncomeAnnual: 0,
}

function newStageByWorkStyle(workStyle: WorkStyle): CareerStage {
  if (workStyle === 'employee') return EMPTY_EMPLOYEE
  if (workStyle === 'self_employed') return EMPTY_SELF_EMPLOYED
  return EMPTY_RETIRED
}

export function CareerStageEditor() {
  const { scenario, dispatch } = useScenario()
  const stages = scenario.careerStages
  const mutualAid = scenario.mutualAid
  const hasSelfEmployed = stages.some(s => s.workStyle === 'self_employed')

  const updateMutualAid = (patch: { smallBusinessMutualPayoutMethod?: SmallBusinessMutualPayoutMethod; smallBusinessMutualAnnuityYears?: number }) =>
    dispatch({ type: 'UPDATE_MUTUAL_AID', payload: patch })

  const updateStage = (index: number, patch: Partial<CareerStage>) => {
    const updated = stages.map((s, i) => i === index ? { ...s, ...patch } as CareerStage : s)
    dispatch({ type: 'UPDATE_CAREER_STAGES', payload: updated })
  }

  const addStage = () => {
    dispatch({ type: 'UPDATE_CAREER_STAGES', payload: [...stages, EMPTY_EMPLOYEE] })
  }

  const removeStage = (index: number) => {
    dispatch({ type: 'UPDATE_CAREER_STAGES', payload: stages.filter((_, i) => i !== index) })
  }

  const changeWorkStyle = (index: number, workStyle: WorkStyle) => {
    const base = newStageByWorkStyle(workStyle)
    const updated = stages.map((s, i) =>
      i === index ? { ...base, fromAge: s.fromAge, toAge: s.toAge } : s
    )
    dispatch({ type: 'UPDATE_CAREER_STAGES', payload: updated })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">キャリアシナリオ</h2>
        <button onClick={addStage} className="text-sm text-blue-600 hover:underline">+ 追加</button>
      </div>

      {stages.map((stage, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={stage.fromAge}
                  onChange={(e) => updateStage(i, { fromAge: Number(e.target.value) })}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <span className="text-sm text-gray-500">〜</span>
                <input
                  type="number"
                  value={stage.toAge}
                  onChange={(e) => updateStage(i, { toAge: Number(e.target.value) })}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <span className="text-sm text-gray-500">歳</span>
              </div>
              <select
                value={stage.workStyle}
                onChange={(e) => changeWorkStyle(i, e.target.value as WorkStyle)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="employee">会社員</option>
                <option value="self_employed">個人事業主</option>
                <option value="retired">退職後</option>
              </select>
            </div>
            {stages.length > 1 && (
              <button onClick={() => removeStage(i)} className="text-red-500 text-xs hover:underline">削除</button>
            )}
          </div>

          {stage.workStyle === 'employee' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">入力モード</label>
                <select
                  value={stage.salaryInputMode}
                  onChange={(e) => updateStage(i, { salaryInputMode: e.target.value as 'gross' | 'takehome' })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="gross">額面</option>
                  <option value="takehome">手取り</option>
                </select>
              </div>
              {stage.salaryInputMode === 'gross' ? (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">額面年収（万円）</label>
                  <input
                    type="number"
                    value={(stage.grossSalaryAnnual ?? 0) / 10000}
                    onChange={(e) => updateStage(i, { grossSalaryAnnual: Number(e.target.value) * 10000 })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">手取り年収（万円）</label>
                  <input
                    type="number"
                    value={(stage.takehomeSalaryAnnual ?? 0) / 10000}
                    onChange={(e) => updateStage(i, { takehomeSalaryAnnual: Number(e.target.value) * 10000 })}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-600 mb-1">賞与（万円）</label>
                <input
                  type="number"
                  value={stage.bonusAnnual / 10000}
                  onChange={(e) => updateStage(i, { bonusAnnual: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          )}

          {stage.workStyle === 'self_employed' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">年間売上（万円）</label>
                <input
                  type="number"
                  value={stage.grossRevenueAnnual / 10000}
                  onChange={(e) => updateStage(i, { grossRevenueAnnual: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">必要経費（万円）</label>
                <input
                  type="number"
                  value={stage.businessExpenseAnnual / 10000}
                  onChange={(e) => updateStage(i, { businessExpenseAnnual: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">青色申告特別控除（万円）</label>
                <input
                  type="number"
                  value={stage.bluePenaltyDeduction / 10000}
                  onChange={(e) => updateStage(i, { bluePenaltyDeduction: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">小規模企業共済（万円）</label>
                <input
                  type="number"
                  value={stage.smallBusinessMutualAnnual / 10000}
                  onChange={(e) => updateStage(i, { smallBusinessMutualAnnual: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">倒産防止共済（万円）</label>
                <input
                  type="number"
                  value={stage.bankruptcyMutualAnnual / 10000}
                  onChange={(e) => updateStage(i, { bankruptcyMutualAnnual: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          )}

          {stage.workStyle === 'retired' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">国民年金（万円）</label>
                <input
                  type="number"
                  value={stage.retirementNationalPensionAnnual / 10000}
                  onChange={(e) => updateStage(i, { retirementNationalPensionAnnual: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">厚生年金（万円）</label>
                <input
                  type="number"
                  value={stage.retirementEmployeesPensionAnnual / 10000}
                  onChange={(e) => updateStage(i, { retirementEmployeesPensionAnnual: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">その他収入（万円）</label>
                <input
                  type="number"
                  value={stage.retirementOtherIncomeAnnual / 10000}
                  onChange={(e) => updateStage(i, { retirementOtherIncomeAnnual: Number(e.target.value) * 10000 })}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {hasSelfEmployed && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-indigo-800">共済の受け取り設定（廃業・移行時）</h3>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">倒産防止共済（経営セーフティ共済）</p>
              <p className="text-xs text-gray-500">
                解約手当金として一括受取のみ。累計上限800万円。掛金は経費算入済みのため、
                受取額は雑所得として課税（シミュレーションでは実効税率20%で概算）。
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">小規模企業共済</p>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="sbm-payout"
                    value="lump_sum"
                    checked={mutualAid.smallBusinessMutualPayoutMethod === 'lump_sum'}
                    onChange={() => updateMutualAid({ smallBusinessMutualPayoutMethod: 'lump_sum' })}
                  />
                  一括受取（退職所得）
                </label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="sbm-payout"
                    value="annuity"
                    checked={mutualAid.smallBusinessMutualPayoutMethod === 'annuity'}
                    onChange={() => updateMutualAid({ smallBusinessMutualPayoutMethod: 'annuity' })}
                  />
                  分割受取（年金所得）
                </label>
              </div>
              {mutualAid.smallBusinessMutualPayoutMethod === 'lump_sum' && (
                <p className="text-xs text-gray-500 mt-1">
                  退職所得控除（加入年数×40万円、20年超は+70万円/年）を適用後、1/2課税。
                </p>
              )}
              {mutualAid.smallBusinessMutualPayoutMethod === 'annuity' && (
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-xs text-gray-600">分割年数</label>
                  <input
                    type="number"
                    min={10}
                    max={20}
                    value={mutualAid.smallBusinessMutualAnnuityYears}
                    onChange={(e) => updateMutualAid({ smallBusinessMutualAnnuityYears: Math.min(20, Math.max(10, Number(e.target.value))) })}
                    className="w-16 border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                  />
                  <span className="text-xs text-gray-500">年（10〜20）。公的年金等の雑所得として課税。</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
