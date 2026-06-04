# amaladesigns.com

[amala designs](https://amaladesigns.com) のティザーサイト。1 ページの静的サイトで、虹色の重なる輪のロゴが生き物のように揺らぐアニメーションを掲載する。

## ステータス

Phase 1（PNG ロゴ + 控えめな CSS アニメ）を実装。マージで初回公開可能。
次の PR (`feat/phase2-canvas-anim`) で Canvas + simplex noise の本命アニメに差し替える。

## 構成

- **ホスティング**: Cloudflare Pages（GitHub 連携で `main` push → 自動デプロイ）
- **スタック**: Vite + TypeScript + vanilla HTML/CSS/JS（出力は完全静的）
- **アニメーション**: Phase 1 は CSS アニメ、Phase 2 で Canvas 2D + simplex noise に差し替え

## ロードマップ

| Phase | 内容 |
|---|---|
| 1 | Vite + TS 雛形、Cloudflare Pages デプロイ設定 |
| 2 | PNG ロゴ + 控えめな CSS アニメで初回公開（OG / favicon / `prefers-reduced-motion` 対応） |
| 3 | Squarespace Domains の DNS 切替で `amaladesigns.com` を接続 |
| 4 | Canvas 2D + simplex noise の本命アニメに差し替え |
| 5 (任意) | フル SVG 化したロゴに差し替え |

## ローカル開発

```bash
npm install
npm run dev      # http://localhost:5173
```

ビルドとプレビュー:

```bash
npm run build    # 出力は dist/
npm run preview  # ビルド結果をローカル確認
```

Node.js は v22 LTS 以降を推奨（リポジトリ直下の `.nvmrc` で v24 を指定済み）。
`nvm use` 一発で揃う。

## デプロイ（Cloudflare Pages）

初回セットアップ（管理者が一度だけ実施）:

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. GitHub アカウントを連携し、リポジトリ `amaladesigns/www` を選択
3. Build settings を以下で設定:
   - **Framework preset**: `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`（未設定でも可）
   - **Environment variables**: 不要。リポジトリの `.nvmrc`（`24`）が自動採用される。
     もし CF Pages の build image が v24 をまだ持っていない場合のみ `NODE_VERSION=22` を明示する。
4. **Save and Deploy** で初回ビルドを実行
5. 完了すると `*.pages.dev` のプレビュー URL が発行される

カスタムドメイン設定は Phase 3 (`docs/domain-cutover`) で実施する。

ブランチ運用:

- `main` push → 本番デプロイ
- それ以外のブランチ push → プレビュー環境が自動生成される（PR ごとの URL が GitHub に自動投稿される）

## ドメイン

- 本番ドメイン: `amaladesigns.com`（Squarespace Domains 管理）
- DNS 切替の具体手順は Phase 3 で本 README に追記する

## ライセンス

All rights reserved.
