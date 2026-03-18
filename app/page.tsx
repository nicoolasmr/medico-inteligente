import { redirect } from 'next/navigation'
import { createClient } from '../lib/supabase/server'

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    redirect('/login')
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  redirect(session ? '/dashboard' : '/login')
}
