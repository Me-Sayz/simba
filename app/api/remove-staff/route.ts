import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Pastiin yang minta hapus itu beneran Owner
    const { data: ownerMembership } = await supabaseAdmin
      .from('store_members')
      .select('store_id, role')
      .eq('user_id', user.id)
      .single()

    if (!ownerMembership || ownerMembership.role !== 'owner') {
      return NextResponse.json({ error: 'Cuma Owner yang bisa menghapus staff' }, { status: 403 })
    }

    const { staffMemberId } = await req.json()
    if (!staffMemberId) {
      return NextResponse.json({ error: 'staffMemberId wajib diisi' }, { status: 400 })
    }

    // Pastiin target itu beneran staff di toko yang sama (gak bisa hapus staff toko lain)
    const { data: targetMembership } = await supabaseAdmin
      .from('store_members')
      .select('id, user_id, store_id, role')
      .eq('id', staffMemberId)
      .single()

    if (!targetMembership || targetMembership.store_id !== ownerMembership.store_id || targetMembership.role !== 'staff') {
      return NextResponse.json({ error: 'Staff tidak ditemukan di toko ini' }, { status: 404 })
    }

    const targetUserId = targetMembership.user_id

    // Hapus foto profil staff dari storage kalau ada
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('id', targetUserId)
      .single()

    if (profile?.avatar_url) {
      try {
        const url = new URL(profile.avatar_url)
        const match = url.pathname.match(/\/avatars\/(.+)/)
        if (match) await supabaseAdmin.storage.from('avatars').remove([match[1]])
      } catch {}
    }

    // Hapus akun auth-nya. store_members & profiles ikut kehapus otomatis (FK cascade).
    // stock_movements/transactions/products yang pernah dia buat TETAP ADA (FK SET NULL),
    // cuma kolom user_id-nya jadi kosong — riwayat toko gak ikut lenyap.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}