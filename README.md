# Filmarks 高評価アニメスクレイパー

Filmarks のタグページから指定した評価以上のアニメを抽出する Node.js スクレイパーです。デフォルトでは「神アニメ」タグと評価 4.3 以上を対象としますが、任意のタグや評価基準を指定することもできます。

## ファイル一覧

### メインスクレイパー

- **`filmarks-scraper.js`** - メインのスクレイパー。複数ページから高評価アニメを収集します
- **`config.json`** - スクレイパーの設定ファイル

### 結果ファイル

- **`high-rated-anime-urls.txt`** - 指定した評価以上のアニメの URL リスト
- **`high-rated-anime-detailed.txt`** - 指定した評価以上のアニメの詳細情報（タイトル、評価、公開日、URL）

## 使用方法

1. 依存関係のインストール

```bash
npm install
```

2. 設定ファイル (config.json) を編集

```json
{
  "tag": "神アニメ", // 検索するタグ名
  "startPage": 1, // 開始ページ
  "endPage": 10, // 終了ページ
  "minRating": 4.3, // 最低評価
  "requestDelay": 1500 // リクエスト間の待機時間（ミリ秒）
}
```

3. スクレイパーの実行

```bash
node filmarks-scraper.js
```

## 収集データ

- アニメタイトル
- 評価スコア（config.json で指定した最低評価以上）
- 公開日（YYYY 年 MM 月 DD 日形式、取得できない場合は「N/A」）
- Filmarks のアニメページ URL

## 設定例

### SF を検索（評価 4.0 以上）

```json
{
  "tag": "SF",
  "startPage": 1,
  "endPage": 5,
  "minRating": 4.0,
  "requestDelay": 2000
}
```

### 利用可能なタグ

タグは以下の URL から確認できます：
https://filmarks.com/list-anime/tag/

## 注意事項

- スクレイピングの間隔は config.json で調整可能（デフォルト 1.5 秒）
- User-Agent ヘッダーを設定しています
- 最低評価は config.json で調整可能（デフォルト 4.3）
- タグ名は日本語でも英語でも指定可能です（自動的に URL エンコードされます）
