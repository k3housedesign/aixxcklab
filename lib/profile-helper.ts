import { supabase } from './supabase'

export async function ensureProfile(userId: string, username?: string) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (existingProfile) {
    return existingProfile
  }

  // Create profile if it doesn't exist
  const { data: user } = await supabase.auth.getUser()
  const defaultUsername = username || 
    user?.user?.user_metadata?.username || 
    user?.user?.email?.split('@')[0] || 
    'user'

  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      username: defaultUsername
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
    // If username already exists, try with a random suffix
    if (error.code === '23505') { // Unique violation
      const randomSuffix = Math.floor(Math.random() * 9999)
      const { data: retryProfile } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: `${defaultUsername}${randomSuffix}`
        })
        .select()
        .single()
      
      return retryProfile
    }
  }

  return newProfile
}