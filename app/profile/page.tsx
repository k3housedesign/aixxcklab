'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type Profile = {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

type FavoriteService = {
  id: string
  service_id: string
  created_at: string
  ai_services: {
    id: string
    name: string
    category: string
    url: string
  }
}

type UserReview = {
  id: string
  rating: number
  comment: string
  created_at: string
  ai_services: {
    id: string
    name: string
    category: string
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [favorites, setFavorites] = useState<FavoriteService[]>([])
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [updating, setUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'reviews'>('profile')

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    fetchUserData()
  }, [user, router])

  const fetchUserData = async () => {
    if (!user) return

    try {
      // プロフィール情報を取得
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setEditUsername(profileData.username)
      }

      // お気に入りを取得
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select(`
          *,
          ai_services (
            id,
            name,
            category,
            url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setFavorites(favoritesData || [])

      // レビューを取得
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          ai_services (
            id,
            name,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setReviews(reviewsData || [])
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUsername = async () => {
    if (!user || !editUsername.trim()) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: editUsername.trim() })
        .eq('id', user.id)

      if (error) throw error

      // プロフィールを再取得
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile(data)
      }
      
      setIsEditing(false)
      // ホームページのユーザー名も更新されるように再読み込み
      window.location.reload()
    } catch (error: any) {
      alert(`エラー: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const removeFavorite = async (serviceId: string) => {
    if (!user) return

    try {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('service_id', serviceId)

      setFavorites(prev => prev.filter(f => f.service_id !== serviceId))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'テキスト生成': 'bg-blue-100 text-blue-800',
      '画像生成': 'bg-purple-100 text-purple-800',
      '音声処理': 'bg-green-100 text-green-800',
      '音楽生成': 'bg-pink-100 text-pink-800',
      'コード生成': 'bg-orange-100 text-orange-800',
      'Webアプリ開発': 'bg-indigo-100 text-indigo-800',
      'その他': 'bg-gray-100 text-gray-800',
    }
    return colors[category] || colors['その他']
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← ホームに戻る
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">マイページ</h1>

        {/* タブナビゲーション */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            プロフィール
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'favorites'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            お気に入り ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-3 font-medium border-b-2 transition ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            レビュー ({reviews.length})
          </button>
        </div>

        {/* プロフィールタブ */}
        {activeTab === 'profile' && profile && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">プロフィール情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ユーザー名
                </label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="ユーザー名を入力"
                    />
                    <button
                      onClick={updateUsername}
                      disabled={updating}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {updating ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditUsername(profile.username)
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-900 font-medium">{profile.username}</p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登録日
                </label>
                <p className="text-gray-900">
                  {new Date(profile.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* お気に入りタブ */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">お気に入りサービス</h2>
            
            {favorites.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                お気に入りのサービスはまだありません
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {favorites.map((favorite) => (
                  <div key={favorite.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        href={`/services/${favorite.ai_services.id}`}
                        className="font-medium text-lg hover:text-indigo-600"
                      >
                        {favorite.ai_services.name}
                      </Link>
                      <button
                        onClick={() => removeFavorite(favorite.service_id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        削除
                      </button>
                    </div>
                    <span className={`inline-block px-2 py-1 rounded text-xs ${getCategoryColor(favorite.ai_services.category)}`}>
                      {favorite.ai_services.category}
                    </span>
                    <a
                      href={favorite.ai_services.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-2 text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      公式サイト →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* レビュータブ */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">投稿したレビュー</h2>
            
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                まだレビューを投稿していません
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        href={`/services/${review.ai_services.id}`}
                        className="font-medium hover:text-indigo-600"
                      >
                        {review.ai_services.name}
                      </Link>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}