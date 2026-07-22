# 📖 日刊AIストーリー型 TOEIC 英語学習＆自動配信システム

毎朝AI（Gemini）が「面白いショートストーリー」「TOEIC最重要単語・解説」「1分クイズ」を自動生成し、スマホに届ける**完全無料（0円）の英語学習システム**です。

---

## ✨ 主な機能

- **🤖 毎朝の完全自動配信**: GitHub Actions が毎朝 7:00 (JST) に自動でプログラムを実行。
- **💡 1タップで単語即解説**: Web画面で英文内の単語をタップするだけで意味とTOEIC解説が出現。
- **✂️ スラッシュ読み & 🔊 ネイティブ音声**: 返り読みを防ぐスラッシュ切り替えとクリアな音声再生。
- **⏱️ WPM (速度) 計測 ＆ ⭐ マイ単語帳**: 読書スピード計測と気になった単語の保存。

---

## 🚀 3ステップで完了する自動配信の無料セットアップ

### Step 1: 無料のGemini APIキーを取得（約1分）
1. [Google AI Studio](https://aistudio.google.com/) にアクセス。
2. 「Get API Key」をクリックして、**無料のAPIキー**を発行・コピーします。

### Step 2: GitHubリポジトリに Secrets を登録
1. 作成したこのコードを GitHub リポジトリ（例: `eng`）にアップロードします。
2. GitHubリポジトリの `Settings` > `Secrets and variables` > `Actions` を開きます。
3. `New repository secret` を押して、以下を追加します:
   - `GEMINI_API_KEY`: （Step 1で取得したキー）
   - `DISCORD_WEBHOOK_URL`: （Discordのチャンネル設定で発行したWebhook URL）*※Discordで受け取る場合*

### Step 3: Webページの無料公開（GitHub Pages）
1. GitHubリポジトリの `Settings` > `Pages` を開きます。
2. Source を `Deploy from a branch` にし、Branch を `main` / `root` に設定して `Save` を押します。
3. 数分後、`https://<あなたのGitHubユーザー名>.github.io/eng/` で自分専用のWeb学習画面が世界中に無料公開されます！

---

## 🧪 テスト実行方法（今すぐ手動で届ける場合）

1. GitHubの `Actions` タブを開きます。
2. 左側の `Daily TOEIC AI Story Delivery` を選択します。
3. `Run workflow` ボタンを押すと、今すぐAIがストーリーを自動生成してメッセージを送信します！
