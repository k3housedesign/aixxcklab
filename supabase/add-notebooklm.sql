-- NotebookLMをAIサービスに追加
INSERT INTO ai_services (
  id,
  name,
  category,
  url,
  features,
  pricing,
  created_at
) VALUES (
  gen_random_uuid(),
  'NotebookLM',
  '文書解析・要約',
  'https://notebooklm.google.com',
  ARRAY[
    '複数文書のアップロードとAI理解',
    '文書に基づく質問応答',
    '自動要約とインサイト生成', 
    'ポッドキャスト形式の音声要約生成',
    'チャット形式での文書探索',
    '引用付きの回答提供'
  ],
  '{"free": "基本機能利用可能", "basic": "月間処理量制限あり"}'::jsonb,
  NOW()
);