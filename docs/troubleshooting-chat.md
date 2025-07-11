# チャットメッセージ送信エラーのトラブルシューティング

## 問題の概要
ユーザーがチャットメッセージを送信できない問題が発生していました。

## 原因
1. **プロファイルテーブルの参照整合性エラー**
   - `messages`テーブルの`user_id`は`profiles(id)`を参照
   - ユーザー登録時に`profiles`テーブルにレコードが作成されていない

2. **RLSポリシーの不整合**
   - INSERTポリシーが`auth.uid() = user_id`をチェック
   - しかし`user_id`は`profiles(id)`なので、直接比較できない

## 実装した解決策

### 1. データベース側の修正（migration-fix-messages.sql）
- プロファイル自動作成トリガーの追加
- RLSポリシーの修正
- 既存ユーザーのプロファイル作成

### 2. アプリケーション側の修正
- `profile-helper.ts`: プロファイル確認・作成ヘルパー関数
- 認証時にプロファイルを確実に作成
- メッセージ送信前にプロファイルの存在を確認

## Supabaseでの適用手順

1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. `migration-fix-messages.sql`の内容を実行

## テスト手順

1. 新規ユーザーでサインアップ
2. チャットページでメッセージを送信
3. エラーが出た場合は、ブラウザのコンソールを確認

## 追加の確認事項

### Supabase側で確認すること
- `profiles`テーブルにユーザーのレコードが存在するか
- RLSポリシーが正しく設定されているか
- トリガーが有効になっているか

### デバッグ用SQLクエリ
```sql
-- ユーザーのプロファイルを確認
SELECT * FROM profiles WHERE id = 'ユーザーID';

-- メッセージのRLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'messages';

-- 最近のメッセージを確認
SELECT m.*, p.username 
FROM messages m 
JOIN profiles p ON m.user_id = p.id 
ORDER BY m.created_at DESC 
LIMIT 10;
```