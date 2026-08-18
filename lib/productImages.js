import { supabase } from '@/lib/supabase'

export function getStoragePath(publicUrl) {
  try {
    const url = new URL(publicUrl)
    const marker = '/object/public/product-images/'
    const idx = url.pathname.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(url.pathname.slice(idx + marker.length))
  } catch {
    return null
  }
}

export async function deleteImageFromStorage(publicUrl) {
  if (!publicUrl) return
  const path = getStoragePath(publicUrl)
  if (!path) return
  const { error } = await supabase.storage.from('product-images').remove([path])
  if (error) console.error('remove error:', error)
}