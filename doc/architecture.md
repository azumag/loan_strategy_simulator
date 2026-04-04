# ローン返済戦略シミュレータ 実装設計書

## 1. 技術スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| 実行環境 | ローカルHTML | design.md 方針準拠 |
| 言語 | TypeScript (トランスパイル後JS) | 型安全性によるデータ構造の堅牢性 |
| ビルド | Vite | 軽量・高速・ゼロコンフィグに近い |
| UIフレームワーク | React | コンポーネント分割・状態管理の容易さ |
| スタイリング | Tailwind CSS | ユーティリティベースで高速UI構築 |
| グラフ | Chart.js (v1.1) | 軽量・ローカル完結 |
| テスト | Vitest | Vite統合・高速 |
| データ保存 | localStorage | design.md 方針準拠 |

---

## 2. ディレクトリ構成

```
loan-strategy-simulator/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── doc/
│   ├── design.md
│   └── architecture.md
├── src/
│   ├── main.tsx                  # エントリポイント
│   ├── App.tsx                   # ルートコンポーネント
│   │
│   ├── types/                    # 型定義
│   │   ├── scenario.ts           # シナリオ全体の型
│   │   ├── loan.ts               # ローン関連の型
│   │   ├── career.ts             # キャリアステージの型
│   │   ├── tax.ts                # 税・控除の型
│   │   ├── assets.ts             # 資産の型
│   │   └── result.ts             # 計算結果の型
│   │
│   ├── core/                     # 計算ロジック（UI非依存）
│   │   ├── engine.ts             # シミュレーションエンジン本体
│   │   ├── loan-calc.ts          # ローン返済計算
│   │   ├── tax-calc.ts           # 税・社会保険概算
│   │   ├── career-resolver.ts    # 年齢→キャリアステージ解決
│   │   ├── prepayment.ts         # 繰上返済ロジック
│   │   └── validators.ts         # バリデーション
│   │
│   ├── store/                    # 状態管理
│   │   ├── scenario-store.ts     # シナリオ状態（React Context）
│   │   └── storage.ts            # localStorage 読み書き
│   │
│   ├── components/               # UIコンポーネント
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── StepNavigation.tsx
│   │   ├── inputs/
│   │   │   ├── BasicConditionForm.tsx
│   │   │   ├── LoanConditionForm.tsx
│   │   │   ├── RateScheduleEditor.tsx
│   │   │   ├── CareerStageEditor.tsx
│   │   │   ├── TaxSettingForm.tsx
│   │   │   ├── HousingCostForm.tsx
│   │   │   ├── LivingCostForm.tsx
│   │   │   ├── AssetForm.tsx
│   │   │   ├── EventEditor.tsx
│   │   │   └── PrepaymentStrategyEditor.tsx
│   │   ├── results/
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── AnnualTable.tsx
│   │   │   └── ChartView.tsx      # v1.1
│   │   └── data/
│   │       └── ScenarioManager.tsx
│   │
│   └── utils/
│       ├── format.ts             # 金額フォーマット等
│       └── defaults.ts           # 初期値定義
│
└── tests/
    ├── core/
    │   ├── engine.test.ts
    │   ├── loan-calc.test.ts
    │   ├── tax-calc.test.ts
    │   └── prepayment.test.ts
    └── store/
        └── storage.test.ts
```

---

## 3. モジュール設計

### 3.1 レイヤー構成

```
┌─────────────────────────────────────────────┐
│              UI Layer (React)                │
│  components/inputs  components/results       │
├─────────────────────────────────────────────┤
│           State Layer (Context)              │
│  store/scenario-store   store/storage        │
├─────────────────────────────────────────────┤
│         Core Layer (Pure Functions)          │
│  engine  loan-calc  tax-calc  prepayment    │
├─────────────────────────────────────────────┤
│              Types Layer                     │
│  scenario  loan  career  tax  result        │
└─────────────────────────────────────────────┘
```

**依存の方向**: UI → State → Core → Types

Core層はUIに一切依存しない純粋関数で構成する。これにより：
- テスト容易性を確保
- ロジック変更とUI変更を独立に行える

---

### 3.2 Core: シミュレーションエンジン (`engine.ts`)

エンジンはシナリオデータを受け取り、年次結果配列とサマリーを返す純粋関数。

```typescript
function simulate(scenario: Scenario): SimulationResult {
  // design.md 8.1 の年次処理フローに準拠
}
```

**年次処理フロー（design.md 8.1 準拠）**:

```
for each age in [startAge .. endAge]:
  1. careerResolver.resolve(age, careerStages)  → CareerStage
  2. calcIncome(stage)                          → grossIncome
  3. calcTaxAndInsurance(stage, income, tax)     → taxBurden
  4. loanCalc.annualPayment(year, loan, balance) → loanPayment
  5. sum(housing costs)                          → housingCost
  6. sum(living costs, inflation adjusted)       → livingCost
  7. applyEvents(age, events)                    → specialCashflow
  8. netCashflow = income - tax - loan - housing - living + special
  9. updateCashAndAssets(netCashflow, assets)
  10. applyPrepayment(age, strategy, cash, balance) → newBalance
  11. emit AnnualRow
```

---

### 3.3 Core: ローン返済計算 (`loan-calc.ts`)

```typescript
// 元利均等返済の月次返済額
function calcEqualPaymentMonthly(principal: number, annualRate: number, termMonths: number): number

// 元金均等返済の月次返済額（月ごとに変動）
function calcEqualPrincipalMonthly(principal: number, annualRate: number, termMonths: number, month: number): number

// 指定年のローン年間返済額・残債を算出
function calcLoanYear(params: {
  remainingPrincipal: number
  annualRate: number
  remainingMonths: number
  repaymentType: RepaymentType
  bonusRepaymentAnnual: number
}): { annualPayment: number; principalPaid: number; interestPaid: number; endBalance: number }

// 金利スケジュールから当該年の適用金利を取得
function resolveRate(loanYear: number, schedule: RateScheduleEntry[]): number
```

**内部計算は月次**で行い、出力は年次集計（design.md 3項 準拠）。

---

### 3.4 Core: 税計算 (`tax-calc.ts`)

v1は概算。`tax.mode === 'simple_auto'` の場合の自動計算と、`manual_override` の場合の手入力値利用を分岐。

```typescript
// 個人事業主の税・社保概算（design.md 8.3）
function calcSoleProprietorTax(stage: SoleProprietorStage, taxConfig: TaxConfig): TaxResult

// 会社員の税・社保概算（design.md 8.4）
function calcEmployeeTax(stage: EmployeeStage, taxConfig: TaxConfig): TaxResult

// 退職後の税概算
function calcRetiredTax(stage: RetiredStage, taxConfig: TaxConfig): TaxResult
```

**所得税の概算ロジック**（簡易速算表ベース）:

| 課税所得 | 税率 | 控除額 |
|---|---|---|
| 〜195万 | 5% | 0 |
| 〜330万 | 10% | 97,500 |
| 〜695万 | 20% | 427,500 |
| 〜900万 | 23% | 636,000 |
| 〜1800万 | 33% | 1,536,000 |
| 〜4000万 | 40% | 2,796,000 |
| 4000万超 | 45% | 4,796,000 |

**住民税**: 課税所得 × 10%（均等割は無視、概算用）

**給与所得控除**（会社員用、簡易テーブル）:

| 給与収入 | 控除額 |
|---|---|
| 〜163万 | 55万 |
| 〜180万 | 収入×40% - 10万 |
| 〜360万 | 収入×30% + 8万 |
| 〜660万 | 収入×20% + 44万 |
| 〜850万 | 収入×10% + 110万 |
| 850万超 | 195万（上限） |

**個人事業税**: (事業所得 - 290万) × 5%（290万以下は0）

**社会保険（会社員）概算**: 額面 × 15%（健保+厚生年金+雇用保険の概算率）

---

### 3.5 Core: 繰上返済 (`prepayment.ts`)

```typescript
function applyPrepayments(params: {
  age: number
  strategy: PrepaymentStrategy
  currentCash: number
  minimumCashBuffer: number
  loanBalance: number
}): { prepaidAmount: number; newBalance: number; newCash: number }
```

- `stopPrepaymentIfCashBelowBuffer` が true の場合、繰上返済後に現金がバッファを下回るなら中止
- `annual_repeat` モードの場合、`repeatUntilAge` まで毎年実行
- 原資が `liquid_assets` / `semi_liquid_assets` の場合は該当資産から引き落とし

---

### 3.6 状態管理 (`store/`)

**React Context + useReducer** で管理。

```typescript
// scenario-store.ts
type ScenarioAction =
  | { type: 'UPDATE_BASIC'; payload: Partial<ScenarioConfig> }
  | { type: 'UPDATE_LOAN'; payload: Partial<LoanConfig> }
  | { type: 'UPDATE_CAREER_STAGE'; index: number; payload: Partial<CareerStage> }
  | { type: 'ADD_CAREER_STAGE' }
  | { type: 'REMOVE_CAREER_STAGE'; index: number }
  | { type: 'UPDATE_TAX'; payload: Partial<TaxConfig> }
  | { type: 'UPDATE_HOUSING'; payload: Partial<HousingConfig> }
  | { type: 'UPDATE_LIVING'; payload: Partial<LivingConfig> }
  | { type: 'UPDATE_ASSETS'; payload: Partial<AssetConfig> }
  | { type: 'ADD_EVENT'; payload: LifeEvent }
  | { type: 'REMOVE_EVENT'; index: number }
  | { type: 'UPDATE_STRATEGY'; payload: Partial<PrepaymentStrategy> }
  | { type: 'LOAD_SCENARIO'; payload: Scenario }
  | { type: 'RESET' }
```

シナリオ更新のたびに `engine.simulate()` を再実行し、結果を派生状態として保持する（`useMemo`）。

---

### 3.7 localStorage (`store/storage.ts`)

design.md 10項のスキーマに準拠。

```typescript
function saveToStorage(scenarios: StoredData): void
function loadFromStorage(): StoredData | null
function exportScenario(scenario: Scenario): string  // JSONダウンロード用
function importScenario(json: string): Scenario       // JSONインポート用
```

**バージョニング**: `version` フィールドでスキーマ変更時のマイグレーションに対応。

---

## 4. UI設計

### 4.1 画面遷移

ステップナビゲーション形式。各ステップは独立した入力フォーム。

```
[1.基本条件] → [2.ローン] → [3.キャリア] → [4.税・控除] → [5.住宅費] → [6.生活費] → [7.資産] → [8.イベント] → [9.繰上返済] → [10.結果]
```

- すべてのステップは自由に行き来可能（タブ/サイドナビ）
- 結果画面は常に最新のシナリオデータで即時再計算
- 入力中もサイドにミニサマリー（月返済額・完済年齢）を常時表示

### 4.2 入力フォーム設計方針

- 各セクションは折りたたみ可能
- 「基本」項目と「詳細」項目を分離（design.md 13項）
- 個人事業主/会社員で表示項目を動的切り替え
- 配列型データ（キャリアステージ、金利スケジュール、イベント、繰上返済）はテーブル形式で追加・削除可能
- 金額入力は万円単位ショートカットを検討（v1.1）

### 4.3 結果画面

#### サマリーカード
- 月返済額、総返済額、総利息
- 60歳/65歳時点残債
- 完済年齢
- 資金ショート年齢（赤色警告）
- 老後移行判定（safe/warning/danger をカラー表示）

#### 年次テーブル
- design.md 7.2 の全項目を表示
- 60歳・65歳・完済時の行をハイライト
- 資金ショート行を赤色ハイライト
- 横スクロール対応

#### グラフ（v1.1）
- 現金残高推移（折れ線）
- 総資産推移（折れ線）
- ローン残債推移（折れ線）
- 年間収支推移（棒グラフ）

---

## 5. 型定義概要

```typescript
// types/scenario.ts
interface Scenario {
  scenario: ScenarioConfig
  loan: LoanConfig
  careerStages: CareerStage[]
  tax: TaxConfig
  housing: HousingConfig
  living: LivingConfig
  assets: AssetConfig
  events: LifeEvent[]
  strategy: PrepaymentStrategy
}

// types/result.ts
interface SimulationResult {
  summary: Summary
  rows: AnnualRow[]
}

interface Summary {
  currentMonthlyPayment: number
  totalRepayment: number
  totalInterest: number
  balanceAt60: number
  balanceAt65: number
  payoffAge: number
  minimumCashBalance: number
  firstShortageAge: number | null
  retirementFeasibility: 'safe' | 'warning' | 'danger'
}

interface AnnualRow {
  age: number
  workStyle: WorkStyle
  grossIncome: number
  businessExpenses: number
  deductions: number
  incomeTax: number
  residentTax: number
  socialInsurance: number
  pensionContribution: number
  smallBusinessMutual: number
  loanRepaymentAnnual: number
  housingTaxAnnual: number
  livingCostAnnual: number
  specialCashflow: number
  netCashflow: number
  endingCash: number
  endingAssets: number
  loanBalance: number
}
```

---

## 6. バリデーション設計

`core/validators.ts` にて、design.md 11項のルールを実装。

```typescript
interface ValidationError {
  field: string
  message: string
}

function validateScenario(scenario: Scenario): ValidationError[]
```

- 各フォームコンポーネントでインライン表示
- シミュレーション実行前にも全体バリデーション
- エラーがある場合、該当ステップへのナビゲーションリンクを表示

---

## 7. テスト戦略

### 7.1 優先テスト対象

| 対象 | テスト内容 |
|---|---|
| `loan-calc.ts` | 元利均等・元金均等の返済額が既知の値と一致すること |
| `loan-calc.ts` | 金利スケジュール切り替え時の残債計算 |
| `tax-calc.ts` | 個人事業主・会社員それぞれの税概算が妥当な範囲であること |
| `engine.ts` | design.md 9項のサンプルデータで50年分のシミュレーションが完走すること |
| `engine.ts` | 繰上返済により完済年齢が短縮されること |
| `engine.ts` | 資金ショート検出が正しく動作すること |
| `prepayment.ts` | バッファ制約で繰上返済が中止されること |
| `validators.ts` | 不正入力を検出すること |
| `storage.ts` | 保存・読み込みの往復で データが損失しないこと |

### 7.2 テスト方針

- Core層は全関数をユニットテストで網羅
- UI層はv1ではテスト対象外（手動確認）
- design.md 9項のサンプルJSON をテストフィクスチャとして利用

---

## 8. 実装フェーズ

### Phase 1: Core層（計算エンジン）
1. 型定義 (`types/`)
2. ローン返済計算 (`loan-calc.ts`) + テスト
3. 税計算 (`tax-calc.ts`) + テスト
4. キャリア解決 (`career-resolver.ts`)
5. 繰上返済 (`prepayment.ts`) + テスト
6. エンジン統合 (`engine.ts`) + テスト
7. バリデーション (`validators.ts`) + テスト

### Phase 2: UI骨格
1. Vite + React + Tailwind セットアップ
2. ステップナビゲーション
3. 各入力フォーム（基本条件 → ローン → キャリア → ... の順）
4. 状態管理（Context + Reducer）

### Phase 3: 結果表示
1. エンジンとUIの接続
2. 年次テーブル表示
3. サマリーカード
4. ハイライト表示（60歳/65歳/資金ショート）

### Phase 4: データ管理
1. localStorage 保存・読み込み
2. シナリオ保存・切り替え
3. 初期値・デフォルト値の設定

### Phase 5: v1.1 拡張
1. グラフ表示（Chart.js）
2. 税額補正UI
3. 資金ショート警告の強化

---

## 9. パフォーマンス考慮

- シミュレーション計算（50年分）は十分軽量（1ms未満想定）、入力変更のたびにリアルタイム再計算可能
- `useMemo` でシナリオオブジェクトが変更された場合のみ再計算
- 年次テーブルの行数は最大50行程度、仮想スクロール不要

---

## 10. 制約・前提の明示

- 税計算は**概算**であり、正確な確定申告計算ではない（UI上に明示する）
- 住民税の翌年反映はv1では非対応（`residentTaxLagEnabled: false`）
- インフレ率は生活費にのみ適用（税制変更は反映しない）
- 運用利回りは流動資産・準流動資産の年末残高に対して適用
- 老後移行判定の基準:
  - `safe`: 65歳以降の全年で現金残高 > minimumCashBuffer
  - `warning`: 一部の年でバッファを下回るが資金ショートなし
  - `danger`: 資金ショート年がある
