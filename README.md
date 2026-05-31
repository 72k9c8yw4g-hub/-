# FUDA — ポケカ仕入れ判定アプリ

中学生4人チームのためのポケモンカード物販 意思決定・記録Webアプリ。  
リアルタイム共有（Supabase）つき。スマホ・PC両対応。

## 機能

- **商品入力** — 商品名・仕入れ価格・想定売値・出品先を入力すると純利益・手数料をリアルタイム計算
- **判断** — 買い候補 / 保留 / 却下 の3択 + おすすめバッジ（本命・実験枠・対象外・上限オーバー）
- **一覧** — 純利益順ソート・ステータスフィルタ・タップで判断変更・結果入力・変更履歴
- **分析** — 利益分布・成功率・ステータス別件数
- **設定** — メンバー名・手数料率・送料・しきい値・仕入れ上限（チーム全体に反映）
- **リアルタイム共有** — Supabase Realtime で全端末に即時反映

## 計算ロジック

| 出品先 | 手数料率 |
|---|---|
| ヤフオク | 10% |
| Yahoo!フリマ | 5% |

- 手数料 = 想定売値 × 手数料率（四捨五入）
- 純利益 = 想定売値 − 仕入れ価格 − 手数料 − 送料

| 条件 | ランク |
|---|---|
| 仕入れ > 4,000円 | 上限オーバー（警告） |
| 純利益 ≥ 500円 | 本命（買い候補推奨） |
| 純利益 80〜499円 | 実験枠 |
| 純利益 < 80円 | 対象外 |

## セットアップ

### 1. Supabase プロジェクトを作る

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. **SQL Editor** で `supabase-setup.sql` の内容を実行
3. **Project Settings > API** から Project URL と anon key をコピー

### 2. 環境変数を設定

```bash
cd client
cp .env.example .env
# .env を編集して URL と anon key を入力
```

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_TEAM=fuda-team   # チームの合言葉（4人で同じ文字列にする）
```

### 3. ローカル起動

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

### 4. デプロイ（Netlify / Vercel）

**Netlify:**
1. [netlify.com](https://netlify.com) でサインイン → **Add new site > Import an existing project**
2. このリポジトリを接続、ビルド設定：
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `client/dist`
3. **Environment variables** に `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TEAM` を追加
4. Deploy → 公開URLが発行される

**Vercel:**
```bash
cd client
npx vercel --prod
# 環境変数は Vercel ダッシュボードで設定
```

### 4人への共有

1. 上記で取得した公開URLをLINEなどで共有
2. 各自が「設定」タブで自分の名前を選択
3. 同じ `VITE_TEAM` の合言葉を使っていれば自動でリアルタイム共有される

## ログイン強化（後日）

現状は合言葉ベースの仲間内フルアクセス。後日ログイン必須にする場合：

1. Supabase Auth でメールマジックリンク or Google OAuth を有効化
2. RLSポリシーを `auth.uid()` ベースに変更（例: `using (auth.uid() = (data->>'userId')::uuid)`）
3. フロントに `supabase.auth.signInWithOtp()` または `signInWithOAuth()` を追加

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロント | React + Vite |
| スタイル | Tailwind CSS + カスタムCSS |
| バックエンド | Supabase (Postgres + Realtime) |
| フォント | Bricolage Grotesque, Hanken Grotesk, JetBrains Mono, Zen Kaku Gothic New |
