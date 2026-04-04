import { Scenario } from '../types'

export interface ValidationError {
  field: string
  message: string
}

export function validateScenario(scenario: Scenario): ValidationError[] {
  const errors: ValidationError[] = []
  const { scenario: sc, loan, careerStages, strategy } = scenario

  // 年齢範囲チェック
  if (sc.startAge > sc.endAge) {
    errors.push({ field: 'scenario.startAge/endAge', message: 'startAge は endAge 以下でなければなりません' })
  }

  // ローン元本
  if (loan.principal <= 0) {
    errors.push({ field: 'loan.principal', message: '元本は0より大きい値を入力してください' })
  }

  // 返済期間
  if (loan.loanTermYears <= 0) {
    errors.push({ field: 'loan.loanTermYears', message: '返済期間は1年以上を入力してください' })
  }

  // 金利スケジュール
  if (loan.rateSchedule.length === 0) {
    errors.push({ field: 'loan.rateSchedule', message: '金利スケジュールは1件以上必要です' })
  } else {
    for (let i = 1; i < loan.rateSchedule.length; i++) {
      if (loan.rateSchedule[i].fromYear <= loan.rateSchedule[i - 1].fromYear) {
        errors.push({ field: 'loan.rateSchedule', message: '金利スケジュールは fromYear の昇順で設定してください' })
        break
      }
    }
    for (const entry of loan.rateSchedule) {
      if (entry.rate < 0) {
        errors.push({ field: 'loan.rateSchedule', message: '金利は0以上を指定してください' })
        break
      }
    }
  }

  // キャリアステージ重複チェック
  for (let i = 0; i < careerStages.length; i++) {
    for (let j = i + 1; j < careerStages.length; j++) {
      const a = careerStages[i]
      const b = careerStages[j]
      if (a.fromAge <= b.toAge && b.fromAge <= a.toAge) {
        errors.push({ field: 'careerStages', message: `キャリアステージの年齢帯が重複しています (${a.fromAge}-${a.toAge} と ${b.fromAge}-${b.toAge})` })
      }
    }
  }

  // 会社員の必須フィールドチェック
  for (let i = 0; i < careerStages.length; i++) {
    const stage = careerStages[i]
    if (stage.workStyle === 'employee') {
      if (stage.salaryInputMode === 'gross' && stage.grossSalaryAnnual === undefined) {
        errors.push({ field: `careerStages[${i}].grossSalaryAnnual`, message: '額面年収入力モードでは grossSalaryAnnual が必要です' })
      }
      if (stage.salaryInputMode === 'takehome' && stage.takehomeSalaryAnnual === undefined) {
        errors.push({ field: `careerStages[${i}].takehomeSalaryAnnual`, message: '手取り入力モードでは takehomeSalaryAnnual が必要です' })
      }
    }
  }

  // 繰上返済年齢チェック
  for (let i = 0; i < strategy.prepayments.length; i++) {
    const p = strategy.prepayments[i]
    if (p.age < sc.startAge || p.age > sc.endAge) {
      errors.push({ field: `strategy.prepayment[${i}].age`, message: '繰上返済年齢はシミュレーション範囲内で指定してください' })
    }
    if (p.amount <= 0) {
      errors.push({ field: `strategy.prepayment[${i}].amount`, message: '繰上返済額は0より大きい値を入力してください' })
    }
  }

  return errors
}
