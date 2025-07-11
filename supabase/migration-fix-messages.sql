-- 既存のメッセージポリシーを削除
DROP POLICY IF EXISTS "Authenticated users can insert messages." ON messages;

-- 新しいメッセージ挿入ポリシーを作成（プロファイルの存在を確認）
CREATE POLICY "Users can insert messages with profile" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM profiles WHERE id = auth.uid()
        )
    );

-- 既存のユーザーに対してプロファイルが存在しない場合は作成
INSERT INTO profiles (id, username)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;