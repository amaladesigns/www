# amaladesigns.com

[amala designs](https://amaladesigns.com) のティザーサイト。1 ページの静的サイトで、虹色の重なる輪のロゴが生き物のように揺らぐアニメーションを掲載する。

## ステータス

リポジトリ初期化直後。次の PR で Vite + TypeScript の雛形を投入する。

## 構成（予定）

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

次の PR で `npm install` / `npm run dev` が使えるようになる。

## ドメイン

- 本番ドメイン: `amaladesigns.com`（Squarespace Domains 管理）
- DNS 切替の具体手順は Phase 3 で本 README に追記する

## ライセンス

All rights reserved.
