'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth')
          return
        }

        if (session?.user) {
          // ソーシャルログイン後、プロファイルが存在しない場合は作成
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!profile) {
            // プロファイルを作成（ソーシャルログインの場合）
            const username = session.user.user_metadata.full_name || 
                           session.user.user_metadata.name || 
                           session.user.email?.split('@')[0] || 
                           'User'
            
            await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                username: username
              })
          }

          router.push('/')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/auth')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">認証中...</p>
      </div>
    </div>
  )
}