'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
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

export default function ServicesPage() {
  const [services, setServices] = useState<AIService[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_services')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← ホームに戻る
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AIサービス一覧</h1>
              <p className="text-gray-600 mt-2">最新のAIサービスを探索し、レビューを確認できます</p>
            </div>
            {user && (
              <Link
                href="/services/new"
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition"
              >
                + 新規サービスを追加
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">読み込み中...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">まだAIサービスが登録されていません</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{service.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(service.category)}`}>
                      {service.category}
                    </span>
                  </div>
                  
                  {service.features && service.features.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">主な機能:</h3>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {service.features.slice(0, 3).map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      公式サイト →
                    </a>
                    <div className="flex gap-2">
                      {user && (
                        <Link
                          href={`/services/edit/${service.id}`}
                          className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition"
                        >
                          編集
                        </Link>
                      )}
                      <Link
                        href={`/services/${service.id}`}
                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition"
                      >
                        詳細
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}