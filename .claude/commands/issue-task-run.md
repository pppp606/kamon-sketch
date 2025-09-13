---
description: Github Issueからタスクを実行し、プルリクエスト作成します[/issue-task-run xxx]
---

## context

- Pull Requestテンプレート
  @.github/pull_request_template.md

## 📋 ルール

### コミット

**重要**: 1コミットの中には一つのコンテキストにマッチするファイルのみを含め、マイクロコミットを意識する

### タスク完了時の手順

**重要**: タスクを完了した際は、必ず以下の手順を実行してください：

1. **タスクをチェック** - `- [ ]` を `- [x]` に変更
2. **完了日を追記** - `✅ **完了** (YYYY-MM-DD)` を追加
3. **関連ファイルを明記** - 作成・修正したファイル名を記載

### TDD実装ルール

1. **Red-Green-Refactorサイクル厳守**
   - テストを先に書く（Red）
   - 最小限の実装でテストを通す（Green）
   - コードを改善する（Refactor）

### 開発ワークフロー - Build-Test-Execute Cycle

**最重要**: コード変更後は必ずこのサイクルを実行する

1. **ビルド・実行・確認**:
   ```bash
   npm run build                    # TypeScriptをコンパイル
   npm run serve                    # 開発サーバー起動（http://localhost:8000）
   # または
   npm run dev:server               # ビルド監視 + サーバー同時起動
   ```

2. **品質チェック** (コミット前必須):
   ```bash
   npm run ci                      # 全CI品質チェック実行（typecheck + lint + test + build）
   npm run typecheck               # TypeScript型チェック
   npm run lint                    # ESLint準拠確認
   npm test                        # テスト実行
   npm run test:coverage           # カバレッジ付きテスト実行
   ```

3. **自動修正** (エラー発生時):
   ```bash
   npm run lint:fix                # Lintエラー自動修正
   npm run format                  # コード整形
   ```

**なぜ必須か**:
- TypeScriptは事前コンパイルが必要
- ブラウザでの実際の動作はテストだけでは検証できない  
- ユーザー向けUIや描画機能は手動確認が不可欠
- **CI/CDパイプライン**: GitHub ActionsのPR Checksで同じ品質基準を自動実行
  - ✅ TypeScript 型チェック
  - ✅ ESLint 準拠チェック
  - ✅ Jest テスト実行  
  - ✅ ビルド成功
  - ✅ カバレッジ基準達成 (Lines≥80%, Functions≥80%, Branches≥70%, Statements≥80%)

### テストの実行

**重要**: プロジェクト特有のテスト戦略

**推奨テスト実行方法**:
- 全テストを実行: `npm test` (このプロジェクトでは高速)
- 特定テストのみ: `npm test test/division.test.ts`
- ウォッチモード: `npm run test:watch`
- カバレッジ付き: `npm run test:coverage`

**カバレッジ品質基準** (PR承認に必要):
| Metric | 必須閾値 | 目標値 |
|--------|---------|--------|
| **Lines** | 80% | 85%+ |
| **Functions** | 80% | 85%+ |
| **Branches** | 70% | 80%+ |
| **Statements** | 80% | 85%+ |

### 技術スタック
- **言語**: Node.js + TypeScript (ES modules)
- **テスト**: jest + ts-jest
- **品質**: eslint + prettier

## 処理フロー

### タスク作成 (Task Tool使用)
- github issue #$ARGUMENTS を参照
- **重要**: issueに「🔍 仕様明確化」セクションがある場合、「質問と回答」を必ず参照して実装方針を確認
- このissueの内容を良く理解してタスク化してください
- TDDメソッドを使用してタスク化
- タスクはTodosで保持
- 作成したtodoをissueのコメントに追加
  - すでにissueのコメントにtodoがあった場合、内容を適切に更新
  - 追加でコメントがあり、修正指示の場合、修正指示を反映したtodoをコメント追加

### 初期設定 (Task Tool使用)
- `git fetch -a -p` を実行
- origin/developからブランチを作成
- [skip ci]付きの空コミット作成
- issueにopenされているpull requestが紐づいて存在している場合
  - 実装済み内容を確認し、実装を継続するようにする
- pull request作成（todoをチェックリスト化）
  - pull requestのテンプレート: @.github/pull_request_template.md

### タスク実行 (各処理ごとにTask Toolを個別に使用)
- 実行前に `## 📋 ルール` の内容を復唱する
- 各タスクを順次実行
- TDD実装ルールに従い、テストファーストで開発
- **必須**: コード変更毎にBuild-Test-Execute Cycleを実行
  1. `npm run build` でビルド
  2. ブラウザで動作確認（`npm run serve` でサーバー起動後 http://localhost:8000 にアクセス）
  3. 品質チェック (`npm run ci` または個別で `typecheck`, `lint`, `test`, `test:coverage`) を実行
  4. **コミット前**: カバレッジ基準を満たすことを確認 (Lines≥80%, Functions≥80%, Branches≥70%, Statements≥80%)
- 完了後にコミット・プッシュ
- PRチェックリストを更新（ `- [ ]` → `- [x]` ）
- 完了日と関連ファイルを記載
- 未完了タスクがなくなるまで繰り返し
- タスクの戻り値として、実施した内容とPR更新結果を報告
- 次のタスクの実行に必要な情報は、それまでに実行したタスクの戻り値等を適切に使用する

### 終了処理
- 全部終わったらプッシュ
- 完了メッセージをpull requestのコメントに追加
