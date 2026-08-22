import { supabase } from './supabase'

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const user = await getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return data
}

// Ambil store_id + role user yang login sekaligus, dipakai buat:
// - nyimpen store_id yang bener pas insert produk/stok
// - nge-gate UI (sembunyiin tombol/menu yang cuma buat owner)
// Return null kalau user belum kegabung ke toko manapun (harusnya gak pernah
// kejadian karena handle_new_user trigger otomatis bikinin, tapi dijaga aja).
export async function getStoreContext() {
  const user = await getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('store_members')
    .select('store_id, role, status, stores ( name )')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null

  return {
    userId: user.id,
    storeId: data.store_id,
    role: data.role,           // 'owner' | 'staff'
    status: data.status,       // 'active' | 'invited'
    storeName: data.stores?.name ?? null,
    isOwner: data.role === 'owner',
  }
}