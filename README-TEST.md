# ローカルテスト実行ガイド

ブックマークマネージャv2のローカル環境でのテスト実行手順です。

## 初回セットアップ

### 1. 依存関係のインストール
```bash
npm run setup
```
または
```bash
npm install
npx playwright install
```

## テストの実行

### 単体テスト（Jest）
```bash
# 全ての単体テストを実行
npm test

# ウォッチモードで実行（ファイル変更時に自動実行）
npm run test:watch

# カバレッジレポート付きで実行
npm run test:coverage
```

### E2Eテスト（Playwright）
```bash
# E2Eテストを実行（ヘッドレスモード）
npm run test:e2e

# ブラウザを表示してテスト実行
npm run test:e2e:headed

# 全テスト（単体テスト + E2Eテスト）を実行
npm run test:all
```

## テスト結果の確認

### 単体テスト結果
- ターミナルに直接表示されます
- カバレッジレポートは `coverage/` フォルダに生成されます

### E2Eテスト結果
- テスト完了後、HTML形式のレポートが自動で開きます
- レポートは `playwright-report/` フォルダに保存されます
- 失敗時のスクリーンショットは `test-results/` フォルダに保存されます

## テスト項目

### 単体テスト
- BookmarkManagerクラスの初期化
- 削除機能の重複実行防止
- データの永続化（localStorage）
- 削除確認ダイアログの動作

### E2Eテスト
- 削除確認ダイアログのUI操作
- ブックマーク・カラムの作成/削除
- ドラッグ&ドロップ機能
- レスポンシブデザイン

## トラブルシューティング

### Playwrightブラウザがインストールされていない場合
```bash
npx playwright install
```

### テストが失敗する場合
1. `npm run test:e2e:headed` でブラウザを表示してテスト実行
2. `playwright-report/index.html` でテスト結果レポートを確認
3. `test-results/` フォルダのスクリーンショットを確認

### Node.jsのバージョンが古い場合
Node.js 16以上が必要です：
```bash
node --version
```

## ファイル構成

```
tests/
├── unit/                    # 単体テスト
│   └── bookmark-manager.test.js
├── e2e/                     # E2Eテスト
│   ├── delete-dialog.test.js
│   └── basic-functionality.test.js
└── setup/                   # テスト設定
    └── jest-setup.js
```

## 開発時の推奨手順

1. **コード修正前**: `npm run test:watch` でウォッチモードを開始
2. **コード修正**: ファイルを保存すると自動でテスト実行
3. **機能完成後**: `npm run test:all` で全テストを実行
4. **デバッグ時**: `npm run test:e2e:headed` でブラウザ表示

これにより、削除ダイアログの問題修正が正しく動作することを継続的に確認できます。