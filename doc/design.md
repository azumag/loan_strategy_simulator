# ローン返済戦略シミュレータ 設計書

## 1. 目的

本ツールは、住宅ローンを中心とした長期の資金繰りを可視化し、**返済継続のための戦略立案**を行うためのローカルHTMLツールである。

物件比較は主目的とせず、以下の問いに答えることを目的とする。

- 今の収入・支出・税負担でローンを払い続けられるか
- どの年齢・年度で資金繰りが厳しくなるか
- 個人事業主から会社員へ移行した場合、可処分資金はどう変わるか
- 繰上返済、小規模企業共済、資産形成などの戦略がどれだけ効くか
- 60歳以降、65歳以降も支払い継続可能か

---

## 2. スコープ

### 2.1 対象

- 住宅ローン返済シミュレーション
- 年次ベースの資金繰り予測
- 個人事業主 / 会社員 / 退職後 のキャリア遷移
- 税金・社会保険・年金・共済の概算反映
- 資産残高の推移
- 繰上返済戦略の反映

### 2.2 非対象

- 不動産の比較評価
- 厳密な税務申告計算
- 金融機関の正式審査ロジック
- クラウド保存

---

## 3. 前提方針

- 実行環境はローカルHTML + JavaScript
- データ保存は `localStorage`
- 表示は年次を基本とする
- 住宅ローン返済額の内部計算は月次でもよいが、出力は年次集計とする
- 税金・社会保険は**戦略立案用の概算**とする
- 制度改正に追随する厳密性より、シナリオ比較のしやすさを優先する

---

## 4. ツールが答えるべき主要指標

本ツールでは最低限、以下を出力する。

- 年ごとの手取り前収入
- 年ごとの税・社会保険負担
- 年ごとのローン返済額
- 年ごとの生活費・住宅維持費
- 年ごとの年間収支
- 年末現金残高
- 年末総資産残高
- 年末ローン残債
- 60歳時点残債
- 65歳時点残債
- 完済年齢
- 資金ショート年
- 繰上返済による改善幅

---

## 5. 画面構成案

1. 基本条件
2. キャリアシナリオ
3. 税・社会保険設定
4. 生活費・住宅維持費
5. 資産・防衛資金
6. 繰上返済戦略
7. シミュレーション結果
8. 保存データ管理

---

## 6. 入力項目一覧

## 6.1 基本条件

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| シナリオ名 | `scenario.name` | string | 任意 | 保存用名称 |
| シミュレーション開始年齢 | `scenario.startAge` | number | 必須 | 例: 40 |
| シミュレーション終了年齢 | `scenario.endAge` | number | 必須 | 例: 90 |
| 最低現金バッファ | `scenario.minimumCashBuffer` | number | 必須 | 手元に残したい最低現金 |
| 運用利回り | `scenario.investmentReturnRate` | number | 任意 | 資産運用の年利想定 |
| インフレ率 | `scenario.inflationRate` | number | 任意 | 生活費上昇の概算率 |

### 補足
- `startAge` はローン開始年齢と一致しなくてもよい
- `endAge` は老後まで含めて確認できる年齢とする

---

## 6.2 ローン条件

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 借入元本 | `loan.principal` | number | 必須 | 借入額 |
| 借入開始年齢 | `loan.startAge` | number | 必須 | 例: 40 |
| 返済期間（年） | `loan.termYears` | number | 必須 | 例: 35 |
| 返済方式 | `loan.repaymentType` | string | 必須 | `equal_payment` / `equal_principal` |
| ボーナス返済有無 | `loan.hasBonusRepayment` | boolean | 任意 | ボーナス返済を使うか |
| ボーナス返済年額 | `loan.bonusRepaymentAnnual` | number | 任意 | 年間ボーナス返済額 |
| 初期金利 | `loan.initialRate` | number | 必須 | 年利 |
| 金利見直し方式 | `loan.rateMode` | string | 必須 | `fixed` / `schedule` |

---

## 6.3 金利シナリオ

金利はイベント配列として持つ。

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 開始年次 | `loan.rateSchedule[].fromYear` | number | 必須 | ローン開始から何年目か |
| 適用金利 | `loan.rateSchedule[].rate` | number | 必須 | 例: 0.01 |
| メモ | `loan.rateSchedule[].note` | string | 任意 | 例: 11年目から2% |

### 例

```json
[
  { "fromYear": 1, "rate": 0.01, "note": "当初" },
  { "fromYear": 11, "rate": 0.02, "note": "10年後上昇" },
  { "fromYear": 21, "rate": 0.03, "note": "20年後上昇" }
]
```

---

## 6.4 キャリアシナリオ

各年齢帯ごとに働き方を設定する。

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 開始年齢 | `careerStages[].fromAge` | number | 必須 | |
| 終了年齢 | `careerStages[].toAge` | number | 必須 | |
| 働き方 | `careerStages[].workStyle` | string | 必須 | `sole_proprietor` / `employee` / `retired` |
| 副収入 | `careerStages[].sideIncomeAnnual` | number | 任意 | 配当・副業など |
| メモ | `careerStages[].note` | string | 任意 | 補足 |

### 働き方別の追加項目

#### 個人事業主

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 年間売上 | `careerStages[].revenueAnnual` | number | 必須 | 売上 |
| 必要経費 | `careerStages[].businessExpensesAnnual` | number | 必須 | 経費 |
| 青色申告特別控除 | `careerStages[].blueDeductionAnnual` | number | 任意 | 通常は固定値で初期表示可 |
| 小規模企業共済掛金 | `careerStages[].smallBusinessMutualAnnual` | number | 任意 | 年額 |
| 国民年金保険料 | `careerStages[].nationalPensionAnnual` | number | 任意 | 年額概算 |
| 国民健康保険料 | `careerStages[].nationalHealthInsuranceAnnual` | number | 任意 | 年額概算 |
| 個人事業税 | `careerStages[].businessTaxAnnual` | number | 任意 | 自動計算または手入力補正 |
| 予定納税考慮 | `careerStages[].includePrepaidTax` | boolean | 任意 | 将来拡張 |

#### 会社員

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 年収入力モード | `careerStages[].salaryInputMode` | string | 必須 | `gross` / `takehome` |
| 額面年収 | `careerStages[].grossSalaryAnnual` | number | 条件付き必須 | `gross` の時に使用 |
| 手取り年収 | `careerStages[].takehomeSalaryAnnual` | number | 条件付き必須 | `takehome` の時に使用 |
| 賞与年額 | `careerStages[].bonusAnnual` | number | 任意 | 額面または手取りの扱いはモード依存 |
| 企業型DC等 | `careerStages[].corporateDcAnnual` | number | 任意 | 控除用 |
| 社会保険手入力補正 | `careerStages[].socialInsuranceAnnualOverride` | number | 任意 | 概算補正 |

#### 退職後

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 国民年金年額 | `careerStages[].retirementNationalPensionAnnual` | number | 任意 | |
| 厚生年金年額 | `careerStages[].retirementEmployeesPensionAnnual` | number | 任意 | |
| その他定期収入 | `careerStages[].retirementOtherIncomeAnnual` | number | 任意 | 配当・家賃収入など |

---

## 6.5 税・控除設定

制度計算用の共通設定。

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 税計算モード | `tax.mode` | string | 必須 | `simple_auto` / `manual_override` |
| 基礎控除 | `tax.basicDeductionAnnual` | number | 任意 | 初期値設定可 |
| 配偶者控除 | `tax.spouseDeductionAnnual` | number | 任意 | |
| 扶養控除 | `tax.dependentDeductionAnnual` | number | 任意 | |
| 生命保険料控除 | `tax.lifeInsuranceDeductionAnnual` | number | 任意 | |
| 地震保険料控除 | `tax.earthquakeInsuranceDeductionAnnual` | number | 任意 | |
| 医療費控除 | `tax.medicalDeductionAnnual` | number | 任意 | |
| その他控除 | `tax.otherDeductionAnnual` | number | 任意 | |
| 住宅ローン控除 | `tax.housingLoanDeductionAnnual` | number | 任意 | 年ごとに変化する可能性あり |
| 住民税翌年反映 | `tax.residentTaxLagEnabled` | boolean | 任意 | v2想定、v1ではOFF推奨 |

### 手入力補正

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 所得税補正 | `tax.incomeTaxOverrideAnnual` | number | 任意 | |
| 住民税補正 | `tax.residentTaxOverrideAnnual` | number | 任意 | |
| 社保補正 | `tax.socialInsuranceOverrideAnnual` | number | 任意 | |

---

## 6.6 住宅維持費・税金

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 固定資産税 | `housing.fixedAssetTaxAnnual` | number | 必須 | |
| 都市計画税 | `housing.cityPlanningTaxAnnual` | number | 任意 | |
| 火災・地震保険 | `housing.homeInsuranceAnnual` | number | 任意 | |
| 修繕費 | `housing.maintenanceAnnual` | number | 任意 | 戸建て積立想定 |
| 管理費等 | `housing.otherHousingCostAnnual` | number | 任意 | 必要なら使用 |

---

## 6.7 生活費

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 月間生活費 | `living.monthlyBaseCost` | number | 必須 | 通常生活費 |
| 教育費年額 | `living.educationCostAnnual` | 任意 | 任意 | |
| 車関連費年額 | `living.carCostAnnual` | number | 任意 | |
| その他固定費年額 | `living.otherFixedCostAnnual` | number | 任意 | |
| 老後生活費月額 | `living.monthlyRetirementCost` | number | 任意 | 退職後のベース生活費 |

---

## 6.8 資産・防衛資金

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 初期現金 | `assets.initialCash` | number | 必須 | すぐ使える現金 |
| 流動資産 | `assets.initialLiquidAssets` | number | 任意 | すぐ売却可能 |
| 準流動資産 | `assets.initialSemiLiquidAssets` | number | 任意 | 貴金属など |
| 老後専用資産 | `assets.initialRetirementAssets` | number | 任意 | 原則取り崩し対象外 |
| 年間積立額 | `assets.annualSavingsContribution` | number | 任意 | 平常時の年間積立 |
| 緊急時取り崩し可能率 | `assets.emergencyUsableRatio` | number | 任意 | 準流動資産から何割使えるか |

---

## 6.9 ライフイベント・特別支出

年単位の単発イベントとして管理する。

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 年齢 | `events[].age` | number | 必須 | 発生年齢 |
| 種別 | `events[].type` | string | 必須 | `expense` / `income` |
| ラベル | `events[].label` | string | 必須 | 内容 |
| 金額 | `events[].amount` | number | 必須 | 正の値で入力し、種別で判定 |
| メモ | `events[].note` | string | 任意 | |

### 例
- 車買い替え
- 学費増加
- 大型修繕
- 一時的売上減少
- 相続や贈与

---

## 6.10 繰上返済戦略

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 実行年齢 | `strategy.prepayments[].age` | number | 必須 | |
| 金額 | `strategy.prepayments[].amount` | number | 必須 | |
| 原資 | `strategy.prepayments[].source` | string | 必須 | `cash` / `liquid_assets` / `semi_liquid_assets` |
| 方式 | `strategy.prepayments[].mode` | string | 任意 | `one_time` / `annual_repeat` |
| 繰返終了年齢 | `strategy.prepayments[].repeatUntilAge` | number | 任意 | `annual_repeat` 用 |
| メモ | `strategy.prepayments[].note` | string | 任意 | |

### 関連設定

| 項目名 | キー例 | 型 | 必須 | 説明 |
|---|---|---:|:---:|---|
| 目標完済年齢 | `strategy.targetPayoffAge` | number | 任意 | |
| 最低現金を下回る場合は中止 | `strategy.stopPrepaymentIfCashBelowBuffer` | boolean | 任意 | |

---

## 7. 出力項目一覧

## 7.1 サマリー出力

| 項目名 | キー例 | 説明 |
|---|---|---|
| 現在の月返済額 | `result.summary.currentMonthlyPayment` | 現在条件ベース |
| 総返済額 | `result.summary.totalRepayment` | |
| 総利息 | `result.summary.totalInterest` | |
| 60歳時点残債 | `result.summary.balanceAt60` | |
| 65歳時点残債 | `result.summary.balanceAt65` | |
| 完済年齢 | `result.summary.payoffAge` | |
| 最低現金残高 | `result.summary.minimumCashBalance` | |
| 資金ショート年齢 | `result.summary.firstShortageAge` | 発生しない場合は null |
| 老後移行判定 | `result.summary.retirementFeasibility` | `safe` / `warning` / `danger` |

## 7.2 年次テーブル出力

| 項目名 | キー例 | 説明 |
|---|---|---|
| 年齢 | `result.rows[].age` | |
| 働き方 | `result.rows[].workStyle` | |
| 総収入 | `result.rows[].grossIncome` | |
| 必要経費 | `result.rows[].businessExpenses` | |
| 控除合計 | `result.rows[].deductions` | |
| 所得税 | `result.rows[].incomeTax` | |
| 住民税 | `result.rows[].residentTax` | |
| 社会保険 | `result.rows[].socialInsurance` | |
| 年金掛金 | `result.rows[].pensionContribution` | |
| 共済掛金 | `result.rows[].smallBusinessMutual` | |
| ローン返済額 | `result.rows[].loanRepaymentAnnual` | |
| 固定資産税等 | `result.rows[].housingTaxAnnual` | |
| 生活費 | `result.rows[].livingCostAnnual` | |
| 特別収支 | `result.rows[].specialCashflow` | |
| 年間収支 | `result.rows[].netCashflow` | |
| 年末現金 | `result.rows[].endingCash` | |
| 年末総資産 | `result.rows[].endingAssets` | |
| 年末残債 | `result.rows[].loanBalance` | |

---

## 8. 計算方針

## 8.1 年次処理の流れ

各年について以下の順で計算する。

1. 年齢に応じてキャリアステージを特定
2. 収入を算出
3. 働き方に応じた控除・税・社会保険を概算
4. ローン返済額を算出
5. 固定資産税・都市計画税・生活費を加味
6. 特別イベントを反映
7. 年間収支を算出
8. 現金残高・資産残高を更新
9. 必要なら繰上返済を実行
10. 年末残債を更新

---

## 8.2 税計算の考え方

### v1
- 税・社会保険は概算
- ユーザーによる補正入力を許容
- 住民税の翌年反映は省略可
- 制度改正は固定値または手動更新前提

### v2以降候補
- 住民税翌年反映
- 上限付き社会保険計算
- 地域差対応
- 住宅ローン控除の年次反映

---

## 8.3 個人事業主の概算式イメージ

```text
事業所得 = 売上 - 必要経費
課税前所得 = 事業所得 + 副収入
控除後所得 = 課税前所得 - 基礎控除 - 青色申告特別控除 - 小規模企業共済 - 各種控除
税負担 = 所得税 + 住民税 + 個人事業税 + 国保 + 国民年金
```

---

## 8.4 会社員の概算式イメージ

```text
給与収入 = 額面年収 + 賞与 + 副収入
課税前所得 = 給与収入 - 給与所得控除相当 - 社会保険
控除後所得 = 課税前所得 - 基礎控除 - 各種控除
税負担 = 所得税 + 住民税 + 健康保険 + 厚生年金 + 雇用保険
```

---

## 9. データ構造案

```json
{
  "scenario": {
    "name": "ローン生存戦略",
    "startAge": 40,
    "endAge": 90,
    "minimumCashBuffer": 3000000,
    "investmentReturnRate": 0.03,
    "inflationRate": 0.01
  },
  "loan": {
    "principal": 95000000,
    "startAge": 40,
    "termYears": 35,
    "repaymentType": "equal_payment",
    "hasBonusRepayment": false,
    "bonusRepaymentAnnual": 0,
    "initialRate": 0.01,
    "rateMode": "schedule",
    "rateSchedule": [
      { "fromYear": 1, "rate": 0.01, "note": "当初" },
      { "fromYear": 11, "rate": 0.02, "note": "10年後" },
      { "fromYear": 21, "rate": 0.03, "note": "20年後" }
    ]
  },
  "careerStages": [
    {
      "fromAge": 40,
      "toAge": 49,
      "workStyle": "sole_proprietor",
      "revenueAnnual": 14000000,
      "businessExpensesAnnual": 2000000,
      "blueDeductionAnnual": 650000,
      "smallBusinessMutualAnnual": 840000,
      "nationalPensionAnnual": 200000,
      "nationalHealthInsuranceAnnual": 700000,
      "sideIncomeAnnual": 0,
      "note": "個人事業主期間"
    },
    {
      "fromAge": 50,
      "toAge": 60,
      "workStyle": "employee",
      "salaryInputMode": "gross",
      "grossSalaryAnnual": 10000000,
      "bonusAnnual": 1000000,
      "corporateDcAnnual": 0,
      "sideIncomeAnnual": 0,
      "note": "会社員移行"
    },
    {
      "fromAge": 61,
      "toAge": 64,
      "workStyle": "employee",
      "salaryInputMode": "gross",
      "grossSalaryAnnual": 6000000,
      "bonusAnnual": 0,
      "sideIncomeAnnual": 0,
      "note": "再雇用"
    },
    {
      "fromAge": 65,
      "toAge": 90,
      "workStyle": "retired",
      "retirementNationalPensionAnnual": 900000,
      "retirementEmployeesPensionAnnual": 1200000,
      "retirementOtherIncomeAnnual": 0,
      "note": "年金生活"
    }
  ],
  "tax": {
    "mode": "simple_auto",
    "basicDeductionAnnual": 480000,
    "spouseDeductionAnnual": 0,
    "dependentDeductionAnnual": 0,
    "lifeInsuranceDeductionAnnual": 0,
    "earthquakeInsuranceDeductionAnnual": 0,
    "medicalDeductionAnnual": 0,
    "otherDeductionAnnual": 0,
    "housingLoanDeductionAnnual": 0,
    "residentTaxLagEnabled": false
  },
  "housing": {
    "fixedAssetTaxAnnual": 250000,
    "cityPlanningTaxAnnual": 80000,
    "homeInsuranceAnnual": 50000,
    "maintenanceAnnual": 200000,
    "otherHousingCostAnnual": 0
  },
  "living": {
    "monthlyBaseCost": 300000,
    "educationCostAnnual": 0,
    "carCostAnnual": 300000,
    "otherFixedCostAnnual": 0,
    "monthlyRetirementCost": 280000
  },
  "assets": {
    "initialCash": 8000000,
    "initialLiquidAssets": 2500000,
    "initialSemiLiquidAssets": 6700000,
    "initialRetirementAssets": 0,
    "annualSavingsContribution": 3000000,
    "emergencyUsableRatio": 0.7
  },
  "events": [
    {
      "age": 48,
      "type": "expense",
      "label": "車買い替え",
      "amount": 3000000,
      "note": ""
    },
    {
      "age": 55,
      "type": "expense",
      "label": "大型修繕",
      "amount": 2000000,
      "note": ""
    }
  ],
  "strategy": {
    "prepayments": [
      {
        "age": 50,
        "amount": 10000000,
        "source": "cash",
        "mode": "one_time",
        "note": "金利上昇後の繰上返済"
      }
    ],
    "targetPayoffAge": 65,
    "stopPrepaymentIfCashBelowBuffer": true
  }
}
```

---

## 10. localStorage設計案

- キー名: `loan-strategy-simulator`
- 保存形式: JSON
- 保存対象:
  - 現在編集中シナリオ
  - 保存済みシナリオ一覧
  - UI設定

### 例

```json
{
  "version": 1,
  "currentScenarioId": "main",
  "scenarios": [
    {
      "id": "main",
      "name": "メインシナリオ",
      "data": {}
    }
  ],
  "ui": {
    "taxModeExpanded": true,
    "advancedVisible": false
  }
}
```

---

## 11. バリデーション方針

- 金額は 0 以上
- 年齢は `startAge <= endAge`
- キャリアステージの年齢帯は重複不可
- 金利スケジュールは `fromYear` 昇順
- 繰上返済年齢はシミュレーション範囲内
- `salaryInputMode=gross` の場合、`grossSalaryAnnual` を必須
- `salaryInputMode=takehome` の場合、`takehomeSalaryAnnual` を必須

---

## 12. 初期実装優先順位

### v1
- 基本条件
- ローン条件
- 金利スケジュール
- キャリアステージ
- 固定資産税等
- 生活費
- 資産
- イベント
- 繰上返済
- 年次結果表
- localStorage保存

### v1.1
- 税額補正UI
- グラフ表示
- サマリーカード
- 資金ショート警告

### v2
- 住民税翌年反映
- 住宅ローン控除年次反映
- 詳細な社保計算
- シナリオ複製
- CSVエクスポート

---

## 13. 実装上のポイント

- 画面入力は「基本」と「詳細」を分ける
- 個人事業主と会社員で表示項目を切り替える
- 税計算は必ず「概算」であることを明示する
- ローン返済計算ロジックと税計算ロジックは分離する
- 結果画面では「60歳」「65歳」「完済時」の節目を強調表示する

---

## 14. 今後の拡張候補

- 団信シナリオ
- 病気や休業リスク
- 配偶者収入の変動
- 教育費ステージ
- 売却・住み替えシナリオ
- NISA / iDeCo / 共済の資産推移分離
- 税制年度切替

---

## 15. まとめ

本ツールは、住宅ローンの単純返済表ではなく、**キャリア変化・税負担・老後移行を含めた長期の生存戦略シミュレータ**として設計する。

そのため、入力設計の中心は以下とする。

- 借入条件
- 金利変動
- 個人事業主 / 会社員 / 退職後のキャリア遷移
- 税・社会保険・共済・年金
- 生活費と住宅維持費
- 資産防衛力
- 繰上返済戦略

この設計により、単なる「払えるか」だけでなく、**どの戦略を取れば将来の不安を下げられるか**まで検討できるようにする。
