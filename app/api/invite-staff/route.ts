import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pastiin yang ngundang itu beneran Owner dari sebuah toko
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('store_members')
      .select('store_id, role')
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return NextResponse.json({ error: 'Toko tidak ditemukan' }, { status: 400 })
    }
    if (membership.role !== 'owner') {
      return NextResponse.json({ error: 'Cuma Owner yang bisa mengundang staff' }, { status: 403 })
    }

    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    // Cek email itu belum kepake akun manapun (email cuma ada di auth.users, gak di profiles)
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
    const users = userList?.users ?? []
    const alreadyExists = users.some((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase())
    if (alreadyExists) {
      return NextResponse.json({ error: 'Email ini sudah terdaftar' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL

    // invited_store_id di metadata ini yang dibaca trigger handle_new_user()
    // buat gabungin user baru sebagai staff ke toko ini, bukan bikin toko baru
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_store_id: membership.store_id,
      },
      redirectTo: `${origin}/auth/reset-password`,
    })

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}