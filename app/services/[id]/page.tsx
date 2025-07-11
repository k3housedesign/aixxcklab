'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

type AIService = {
  id: string
  name: string
  category: string
  url: string
  pricing: any
  features: string[]
  created_at: string
}

type Review = {
  id: string
  user_id: string
  service_id: string
  rating: number
  comment: string
  created_at: string
  profiles: {
    username: string
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ServiceDetailClient id={id} />
}

function ServiceDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [service, setService] = useState<AIService | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchServiceAndReviews()
    if (user) {
      checkFavorite()
    }
  }, [id, user])

  const fetchServiceAndReviews = async () => {
    try {
      // サービス情報を取得
      const { data: serviceData, error: serviceError } = await supabase
        .from('ai_services')
        .select('*')
        .eq('id', id)
        .single()

      if (serviceError) throw serviceError
      setService(serviceData)

      // レビューを取得
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (username)
        `)
        .eq('service_id', id)
        .order('created_at', { ascending: false })

      if (reviewsError) throw reviewsError
      setReviews(reviewsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      router.push('/services')
    } finally {
      setLoading(false)
    }
  }

  const checkFavorite = async () => {
    if (!user) return

    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('service_id', params.id)
      .single()

    setIsFavorite(!!data)
  }

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/auth')
      return
    }

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('service_id', id)
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            service_id: id
          })
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/auth')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('reviews')
        .upsert({
          user_id: user.id,
          service_id: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })

      if (error) throw error

      // レビューを再取得
      await fetchServiceAndReviews()
      setShowReviewForm(false)
      setReviewForm({ rating: 5, comment: '' })
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
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

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">サービスが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link href="/services" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← サービス一覧に戻る
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(service.category)}`}>
                  {service.category}
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-1">★</span>
                  <span className="font-semibold text-lg">{calculateAverageRating()}</span>
                  <span className="ml-1">({reviews.length}件のレビュー)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleFavorite}
                className={`px-4 py-2 rounded-md transition ${
                  isFavorite
                    ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isFavorite ? '❤️ お気に入り済み' : '🤍 お気に入りに追加'}
              </button>
              {user && (
                <Link
                  href={`/services/edit/${service.id}`}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  編集
                </Link>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">主な機能</h2>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {service.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>

          {service.pricing && Object.keys(service.pricing).length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">料金プラン</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(service.pricing).map(([plan, price]) => (
                  <div key={plan} className="bg-gray-50 p-4 rounded-md">
                    <p className="font-medium capitalize">{plan}</p>
                    <p className="text-gray-700">{price as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <a
            href={service.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            公式サイトを見る →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">レビュー</h2>
            {user && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
              >
                レビューを書く
              </button>
            )}
          </div>

          {showReviewForm && (
            <form onSubmit={submitReview} className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  評価
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className={`text-2xl ${
                        star <= reviewForm.rating ? 'text-yellow-500' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  コメント
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={4}
                  placeholder="このサービスの感想を書いてください"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? '送信中...' : '投稿する'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">まだレビューがありません</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{review.profiles.username}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}