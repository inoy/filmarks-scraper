# Filmarks 高評価アニメスクレイパー

Filmarks の「神アニメ」タグから評価 4.3 以上のアニメを抽出する Node.js スクレイパーです。

## ファイル一覧

### メインスクレイパー

- **`full-scraper.js`** - 本番用のスクレイパー。複数ページから高評価アニメを収集します
  - 使用方法: `node full-scraper.js [開始ページ] [終了ページ]`
  - デフォルト: 1 ページ目から 10 ページ目まで

### 結果ファイル

- **`high-rated-anime-urls.txt`** - 評価 4.3 以上のアニメの URL リスト（174 件）
- **`high-rated-anime-detailed.txt`** - 評価 4.3 以上のアニメの詳細情報（タイトル、評価、URL）

### 開発・デバッグ用ファイル

- **`filmarks-anime-scraper.js`** - 初期バージョン（HTTPS モジュール使用）
- **`filmarks-anime-scraper-v2.js`** - 改良版（デバッグ機能追加）
- **`scraper.js`** - axios/cheerio 版スクレイパー
- **`debug-scraper.js`** - HTML 構造を解析するためのデバッグツール
- **`check-pagination.js`** - ページネーション確認ツール
- **`final-scraper.js`** - 単一ページ用スクレイパー
- **`debug-page1.html`** - デバッグ用の 1 ページ目の HTML 保存ファイル

### その他

- **`package.json`** - Node.js 依存関係の定義
- **`anime-urls.txt`** - 初期テスト時の空ファイル
- **`anime-detailed.txt`** - 初期テスト時の空ファイル
- **`high-rated-anime.txt`** - 初期テスト時の空ファイル

## 使用方法

1. 依存関係のインストール

```bash
npm install
```

2. スクレイパーの実行

```bash
# デフォルト（1-10ページ）
node full-scraper.js

# カスタム範囲（例：1-30ページ）
node full-scraper.js 1 30
```

## 収集データ

- アニメタイトル
- 評価スコア（4.3 以上のみ）
- Filmarks のアニメページ URL

## 注意事項

- スクレイピングは 1.5 秒間隔で実行されます（サーバー負荷軽減のため）
- User-Agent ヘッダーを設定しています
- 評価 4.3 以上のアニメのみを抽出します
