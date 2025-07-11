'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditServiceClient id={id} />
}

function EditServiceClient({ id }: { id: string }) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'テキスト生成',
    url: '',
    features: [''],
    pricing: {
      free: '',
      basic: '',
      pro: ''
    }
  })

  const categories = [
    'テキスト生成',
    '画像生成',
    '音声処理',
    'コード生成',
    'その他'
  ]

  useEffect(() => {
    fetchService()
  }, [id])

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_services')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          name: data.name,
          category: data.category,
          url: data.url,
          features: data.features || [''],
          pricing: {
            free: data.pricing?.free || '',
            basic: data.pricing?.basic || '',
            pro: data.pricing?.pro || ''
          }
        })
        // 管理者権限のチェック（仮実装）
        setIsAuthorized(true)
      }
    } catch (error) {
      console.error('Error fetching service:', error)
      router.push('/services')
    }
  }

  const handleDelete = async () => {
    if (!confirm('このサービスを削除しますか？関連するレビューやお気に入りも削除されます。')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('ai_services')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      router.push('/services')
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('ログインが必要です')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 空の機能を除外
      const features = formData.features.filter(f => f.trim() !== '')
      
      // 価格情報を整形
      const pricing: any = {}
      if (formData.pricing.free) pricing.free = formData.pricing.free
      if (formData.pricing.basic) pricing.basic = formData.pricing.basic
      if (formData.pricing.pro) pricing.pro = formData.pricing.pro

      const { error } = await supabase
        .from('ai_services')
        .update({
          name: formData.name,
          category: formData.category,
          url: formData.url,
          features: features,
          pricing: pricing
        })
        .eq('id', id)

      if (error) throw error

      router.push('/services')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">このページにアクセスする権限がありません</p>
          <Link href="/services" className="text-indigo-600 hover:text-indigo-800">
            サービス一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link href="/services" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← サービス一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">AIサービス編集</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              サービス名 *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例: ChatGPT"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリー *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              公式サイトURL *
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              主な機能
            </label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="機能を入力"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addFeature}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              + 機能を追加
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              料金プラン（任意）
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.pricing.free}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  pricing: { ...prev.pricing, free: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="無料プラン: 例）無料版あり"
              />
              <input
                type="text"
                value={formData.pricing.basic}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  pricing: { ...prev.pricing, basic: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="基本プラン: 例）$10/月"
              />
              <input
                type="text"
                value={formData.pricing.pro}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  pricing: { ...prev.pricing, pro: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="プロプラン: 例）$20/月"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '更新中...' : '変更を保存'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              削除
            </button>
            <Link
              href="/services"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 text-center"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}