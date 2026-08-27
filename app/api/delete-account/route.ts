import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function deleteAvatarIfAny(userId: string) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single()

  if (profile?.avatar_url) {
    try {
      const url = new URL(profile.avatar_url)
      const match = url.pathname.match(/\/avatars\/(.+)/)
      if (match) await supabaseAdmin.storage.from('avatars').remove([match[1]])
    } catch {}
  }
}

async function deleteProductImages(storeId: string) {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('image_url')
    .eq('store_id', storeId)

  if (products && products.length > 0) {
    const imagePaths = products
      .filter(p => p.image_url)
      .map(p => {
        try {
          const url = new URL(p.image_url)
          const marker = '/object/public/product-images/'
          const idx = url.pathname.indexOf(marker)
          return idx !== -1 ? decodeURIComponent(url.pathname.slice(idx + marker.length)) : null
        } catch { return null }
      })
      .filter(Boolean) as string[]

    if (imagePaths.length > 0) {
      await supabaseAdmin.storage.from('product-images').remove(imagePaths)
    }
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const userId = user.id

    const { data: membership } = await supabaseAdmin
      .from('store_members')
      .select('id, store_id, role')
      .eq('user_id', userId)
      .single()

    // ============ STAFF: cuma lepas diri sendiri dari toko ============
    // Data toko (produk, stok, transaksi) TETAP UTUH — itu milik toko, bukan milik staff ini.
    // supabase_auth_admin gak bisa nyentuh public schema, jadi dibersihin manual di sini.
    if (membership && membership.role === 'staff') {
      await deleteAvatarIfAny(userId)
      await supabaseAdmin.from('products').update({ user_id: null }).eq('user_id', userId)
      await supabaseAdmin.from('stock_movements').update({ user_id: null }).eq('user_id', userId)
      await supabaseAdmin.from('transactions').update({ user_id: null }).eq('user_id', userId)
      await supabaseAdmin.from('store_members').delete().eq('id', membership.id)
      await supabaseAdmin.from('profiles').delete().eq('id', userId)

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

      return NextResponse.json({ success: true })
    }

    // ============ OWNER: harus bubarin toko dulu, staff wajib kosong ============
    if (membership && membership.role === 'owner') {
      const { count: staffCount } = await supabaseAdmin
        .from('store_members')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', membership.store_id)
        .eq('role', 'staff')

      if (staffCount && staffCount > 0) {
        return NextResponse.json({
          error: 'Toko masih punya staff aktif. Hapus semua staff dulu di halaman Kelola Staff sebelum menghapus akun.'
        }, { status: 400 })
      }

      const storeId = membership.store_id

      // urutan wajib karena stock_movements & products RESTRICT ke stores
      await supabaseAdmin.from('stock_movements').delete().eq('store_id', storeId)
      await supabaseAdmin.from('transactions').delete().eq('store_id', storeId) // transaction_items ikut cascade
      await deleteProductImages(storeId)
      await supabaseAdmin.from('products').delete().eq('store_id', storeId)
      await deleteAvatarIfAny(userId)
      await supabaseAdmin.from('profiles').delete().eq('id', userId)
      // hapus stores -> store_members (row Owner sendiri) ikut cascade otomatis
      await supabaseAdmin.from('stores').delete().eq('id', storeId)

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

      return NextResponse.json({ success: true })
    }

    // ============ Fallback: user gak kegabung toko manapun (misal store_members udah kehapus duluan) ============
    await deleteAvatarIfAny(userId)
    await supabaseAdmin.from('products').update({ user_id: null }).eq('user_id', userId)
    await supabaseAdmin.from('stock_movements').update({ user_id: null }).eq('user_id', userId)
    await supabaseAdmin.from('transactions').update({ user_id: null }).eq('user_id', userId)
    await supabaseAdmin.from('profiles').delete().eq('id', userId)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}