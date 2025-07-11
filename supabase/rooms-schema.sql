-- チャットルームテーブル
CREATE TABLE IF NOT EXISTS chat_rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "Chat rooms are viewable by everyone" ON chat_rooms
  FOR SELECT USING (true);

-- ログインユーザーは作成可能
CREATE POLICY "Authenticated users can create chat rooms" ON chat_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 作成者は更新・削除可能
CREATE POLICY "Users can update their own chat rooms" ON chat_rooms
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own chat rooms" ON chat_rooms
  FOR DELETE USING (auth.uid() = created_by);

-- デフォルトのチャットルームを挿入
INSERT INTO chat_rooms (id, name, description) VALUES
  ('general', '全体チャット', 'AIについて自由に話しましょう'),
  ('chatgpt', 'ChatGPT', 'ChatGPTについての議論'),
  ('claude', 'Claude', 'Claudeについての議論'),
  ('midjourney', 'Midjourney', '画像生成AIについて'),
  ('news', 'AI最新情報', '最新のAIニュースを共有')
ON CONFLICT (id) DO NOTHING;