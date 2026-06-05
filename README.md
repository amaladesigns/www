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

カスタムドメイン設定は下記「[ドメイン切替手順](#ドメイン切替手順squarespace-domains--cloudflare-pages)」を参照。

ブランチ運用:

- `main` push → 本番デプロイ
- それ以外のブランチ push → プレビュー環境が自動生成される（PR ごとの URL が GitHub に自動投稿される）

## ドメイン切替手順（Squarespace Domains → Cloudflare Pages）

本番ドメイン `amaladesigns.com` は Squarespace Domains で管理している。
CF Pages の `*.pages.dev` を `amaladesigns.com` / `www.amaladesigns.com` として公開するには、以下の手順で DNS を切り替える。

選択肢は 2 つ:

- **A. DNS レコードだけ追加する（推奨）** — 最小手順、Squarespace 側の他設定（メール等）を維持できる
- **B. ネームサーバごと Cloudflare に移管する** — CF の DNS / WAF / Analytics をフルに使えるが、Squarespace 側の DNS は無効化される

ここでは A を主路として説明する。

### A. DNS レコード追加で接続する

#### 1. CF Pages 側で Custom Domain を追加

1. [CF ダッシュボード](https://dash.cloudflare.com/) → **Workers & Pages** → 該当プロジェクト → **Custom domains** → **Set up a custom domain**
2. `amaladesigns.com` を入力 → **Continue**
   - CF が apex 用の DNS レコードを提示する。典型的には **A レコード × 4 個**（CF の IPv4）、加えて **AAAA × 2 個**（IPv6）
3. 同じ手順で `www.amaladesigns.com` も追加
   - これは **CNAME → `<project>.pages.dev`**（例: `www-3cq.pages.dev`）として提示される
4. 両方とも CF 側は「Verification pending」状態になる

#### 2. Squarespace Domains 側に DNS レコードを追加

1. [Squarespace ダッシュボード](https://account.squarespace.com/domains) → **Domains** → `amaladesigns.com` → **DNS** → **DNS Settings**
2. **Custom Records** セクションで以下を追加（値は CF 側に表示されたものをそのまま転記する）:

   | Type | Host | Data |
   |---|---|---|
   | `A` | `@` | `(CF が指示する IPv4 #1)` |
   | `A` | `@` | `(CF が指示する IPv4 #2)` |
   | `A` | `@` | `(CF が指示する IPv4 #3)` |
   | `A` | `@` | `(CF が指示する IPv4 #4)` |
   | `AAAA` | `@` | `(CF が指示する IPv6 #1)` |
   | `AAAA` | `@` | `(CF が指示する IPv6 #2)` |
   | `CNAME` | `www` | `(CF が指示する <project>.pages.dev)` |

3. 既存の **A / CNAME の `@` レコード（Squarespace の Parking 等）** が残っていれば削除する
   （同一 Host への重複は反映を阻害する）

#### 3. CF 側で Verification を待つ

- 数分〜十数分で「Active」表示に変わる
- CF が Universal SSL を自動発行し、`https://amaladesigns.com` で配信開始

#### 4. 疎通確認

```bash
dig amaladesigns.com +short                 # CF の IPv4 が複数返ることを確認
dig amaladesigns.com AAAA +short            # CF の IPv6 が返ることを確認
dig www.amaladesigns.com CNAME +short       # <project>.pages.dev が返ることを確認
curl -I https://amaladesigns.com            # 200 OK と「server: cloudflare」を確認
curl -I https://www.amaladesigns.com        # 同上
```

#### 5. www ↔ apex のリダイレクト

- CF Pages はデフォルトで apex / www どちらでも配信される（両方とも同じ内容）
- どちらかに正規化したい場合は、`public/_redirects` を追加して 301 を設定する。apex に統一する例:

  ```
  https://www.amaladesigns.com/* https://amaladesigns.com/:splat 301!
  ```

  または CF ダッシュボードの **Bulk Redirects / Rules** からでも設定可能。

### B. ネームサーバ移管（参考）

CF の DNS / WAF / Analytics をフルに使いたい場合:

1. CF ダッシュボード → **Add a site** → `amaladesigns.com` を追加 → 既存 DNS を自動スキャン
2. CF が指示する 2 つのネームサーバを控える（例: `xxx.ns.cloudflare.com`, `yyy.ns.cloudflare.com`）
3. Squarespace Domains → `amaladesigns.com` → **Nameservers** → **Use Custom Nameservers** で CF の ns に置換
4. 反映後（数十分〜数時間）、CF 側で DNS / Pages 連携を完了

> ⚠️ ネームサーバ移管後は **Squarespace 側の DNS は無効化される**。
> メールホスティング（MX）、他サブドメインの A/CNAME など、Squarespace で設定していたものは CF の DNS にも同等のレコードを移植する必要がある。

### トラブルシューティング

- **`CAA record blocks SSL issuance`**: 既存の CAA レコードが Let's Encrypt しか許可していない等。`google.com` を CAA に追加するか、CAA を一時的に削除して再試行
- **`522` / `525` / `SSL handshake failed`**: 数分待つ。CF の SSL 発行は最大 15 分程度かかる
- **apex が CNAME を受け付けない**: Squarespace は apex CNAME を許容しないため A レコードに切り替える。CF Pages の Custom Domain 画面でも A レコードが提示されるはず

## ライセンス

All rights reserved.
