# Filmarks スクレイパー開発メモ

## Filmarks UI要素の解析

### アイコンの意味
調査日: 2025-01-27

**目玉アイコン（viewingMarkCount）**
- 意味: そのアニメを視聴した/評価したユーザー数
- CSSクラス: `p-content-cassette__action--marks`
- 機能: ユーザーがアニメを「観た」としてマークする機能
- data属性: `data-mark="{...count:XXXXX...}"`
- 例: 34,445人が「観た」とマーク

**+アイコン（viewingClipCount）**
- 意味: そのアニメを「観たい」リストに追加したユーザー数
- CSSクラス: `p-content-cassette__action--clips`
- 機能: ユーザーがアニメを「観たい」リストに追加する機能
- data属性: `data-clip="{...count:XXXXX...}"`
- 例: 15,798人が「観たい」リストに追加

### 今後の拡張アイデア
1. **人気度指標の追加**: マーク数とクリップ数を取得して人気度を計算
2. **注目度ランキング**: クリップ数（観たい数）でソート機能
3. **視聴率**: マーク数 / (マーク数 + クリップ数) で実際の視聴率を算出
4. **トレンド分析**: クリップ数が多いが評価が少ないアニメを「話題の新作」として抽出

### データ構造の拡張案
```javascript
// 現在
{ title, rating, url, releaseDate }

// 拡張版
{ 
  title, 
  rating, 
  url, 
  releaseDate,
  markCount,      // 視聴済みユーザー数
  clipCount,      // 観たいリストユーザー数
  popularityScore // markCount + clipCount
}
```

## 技術的なメモ

### 取得可能なデータ
- `data-mark` 属性から視聴済み数を取得可能
- `data-clip` 属性から観たい数を取得可能
- JavaScriptのVue.jsテンプレート内で `{{ viewingMarkCount }}`, `{{ viewingClipCount }}` として表示

### 実装時の注意点
- データはHTMLの `data-*` 属性に埋め込まれているため、cheerioで簡単に取得可能
- ログインが必要な機能のため、スクレイピングでは数値の取得のみ可能

## プロジェクト構成

### ファイル構成
- `filmarks-scraper.js` - メインスクレイパー
- `config.json` - 設定ファイル
- `high-rated-anime-urls.txt` - URL一覧
- `high-rated-anime-detailed.txt` - 詳細情報
- `README.md` - ドキュメント

### 設定可能項目
- `tag`: 検索対象タグ
- `startPage`, `endPage`: ページ範囲
- `minRating`: 最低評価
- `requestDelay`: リクエスト間隔

## 開発履歴

### 主要な最適化
1. **個別ページアクセスの削除**: 公開日を一覧ページから直接取得することで処理速度を大幅改善
2. **axiosからfetchへの移行**: 外部依存を削減
3. **設定ファイル化**: 引数指定から設定ファイル方式に変更

### 取得データ
- アニメタイトル
- 評価スコア
- 公開日（YYYY年MM月DD日形式）
- Filmarks URL