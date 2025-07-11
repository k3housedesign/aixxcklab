'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { ensureProfile } from '@/lib/profile-helper'

type Message = {
  id: string
  user_id: string
  room_id: string
  content: string
  created_at: string
  profiles: {
    username: string
  }
}

export default function ChatPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentRoom, setCurrentRoom] = useState('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatRooms = [
    { id: 'general', name: '全体チャット', description: 'AIについて自由に話しましょう' },
    { id: 'chatgpt', name: 'ChatGPT', description: 'ChatGPTについての議論' },
    { id: 'claude', name: 'Claude', description: 'Claudeについての議論' },
    { id: 'midjourney', name: 'Midjourney', description: '画像生成AIについて' },
    { id: 'news', name: 'AI最新情報', description: '最新のAIニュースを共有' }
  ]

  const ensureProfile = async (userId: string) => {
    try {
      // プロファイルの存在を確認
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      if (!profile) {
        // プロファイルが存在しない場合は作成
        const username = user?.email?.split('@')[0] || 'User'
        await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: username
          })
      }
    } catch (error) {
      console.error('Error ensuring profile:', error)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }

    // Ensure profile exists before fetching messages
    ensureProfile(user.id).then(() => {
      fetchMessages()
    })
    
    // リアルタイムサブスクリプション設定
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `room_id=eq.${currentRoom}`
        },
        async (payload) => {
          // 新しいメッセージを取得（プロファイル情報も含む）
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              profiles (username)
            `)
            .eq('id', payload.new.id)
            .single()
          
          if (data) {
            setMessages(prev => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, currentRoom, router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (username)
        `)
        .eq('room_id', currentRoom)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !user) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      // First ensure profile exists
      await ensureProfile(user.id)
      
      const { error } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          room_id: currentRoom,
          content: messageContent
        })

      if (error) {
        console.error('Detailed error:', error)
        throw error
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      alert(`メッセージの送信に失敗しました: ${error.message || error}`)
      setNewMessage(messageContent) // エラー時は復元
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const changeRoom = (roomId: string) => {
    setCurrentRoom(roomId)
    setMessages([])
    setLoading(true)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    
    if (date.toDateString() === today.toDateString()) {
      return '今日'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨日'
    }
    
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 text-sm">
            ← ホームに戻る
          </Link>
          <h2 className="text-xl font-bold mt-2">チャットルーム</h2>
        </div>
        <div className="p-2">
          {chatRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => changeRoom(room.id)}
              className={`w-full text-left p-3 rounded-md mb-1 transition ${
                currentRoom === room.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{room.name}</div>
              <div className="text-xs text-gray-600">{room.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="bg-white shadow-sm px-6 py-4">
          <h1 className="text-2xl font-bold">
            {chatRooms.find(r => r.id === currentRoom)?.name}
          </h1>
          <p className="text-sm text-gray-600">
            {chatRooms.find(r => r.id === currentRoom)?.description}
          </p>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              まだメッセージがありません。最初のメッセージを送信してください！
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => {
                const showDate = index === 0 || 
                  formatDate(message.created_at) !== formatDate(messages[index - 1].created_at)
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="text-center my-4">
                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.user_id === user?.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {message.profiles.username}
                          </span>
                          <span className="text-xs opacity-70">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* メッセージ入力フォーム */}
        <form onSubmit={sendMessage} className="bg-white border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              送信
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}