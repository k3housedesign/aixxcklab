'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchUsername()
    }
  }, [user])

  const fetchUsername = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (data) {
        setUsername(data.username)
      }
    } catch (error) {
      console.error('Error fetching username:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            AI Sharing Platform
          </h1>
          {loading ? (
            <div className="text-gray-500">読み込み中...</div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {username || user.email?.split('@')[0]}
              </span>
              <Link
                href="/profile"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                マイページ
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              ログイン / サインアップ
            </Link>
          )}
        </div>
        <p className="text-center text-gray-600 mb-12">
          AIサービス情報を共有・議論するためのプラットフォーム
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Link href="/services" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-3">AIサービス一覧</h2>
            <p className="text-gray-600">
              様々なAIサービスを探索し、レビューを確認できます
            </p>
          </Link>
          <Link href="/chat" className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-3">リアルタイムチャット</h2>
            <p className="text-gray-600">
              他のユーザーとAIについて議論できます
            </p>
          </Link>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-3">AI統合チャット</h2>
            <p className="text-gray-600">
              複数のAI APIを切り替えて使用できます
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}