import { supabase } from '@/lib/supabase'

async function getUserId() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || 'guest'
  } catch { return 'guest' }
}

function key(base, uid) { return `${base}:${uid}` }

function saveNotifs(notifs, uid) {
  localStorage.setItem(key('stok-notifs', uid), JSON.stringify(notifs))
}

function getRawNotifs(uid) {
  try {
    const s = localStorage.getItem(key('stok-notifs', uid))
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

function getPrefs(uid) {
  try {
    const s = localStorage.getItem(key('stok-prefs', uid))
    return s ? JSON.parse(s) : {}
  } catch { return {} }
}

export async function getNotifs() {
  const uid = await getUserId()
  const notifs = getRawNotifs(uid)
  const now = Date.now()
  const filtered = notifs.filter(n => {
    if (n.type === 'low_stock') return true
    if (!n.read) return true
    return now - n.timestamp < 30 * 24 * 60 * 60 * 1000
  })
  if (filtered.length !== notifs.length) saveNotifs(filtered, uid)
  return filtered
}

export async function addNotification({ type, message, link }) {
  const uid = await getUserId()
  const prefs = getPrefs(uid)
  const notifPrefs = prefs.notifs || {}

  const allowed = {
    stock_in: notifPrefs.notifStockIn,
    stock_out: notifPrefs.notifStockOut,
    new_product: notifPrefs.notifNewProduct,
    low_stock: notifPrefs.notifLowStock,
  }
  if (allowed[type] === false) return

  const existing = getRawNotifs(uid)

  if (type === 'low_stock') {
    const alreadyExists = existing.find(n => n.type === 'low_stock' && n.message === message)
    if (alreadyExists) return
  }

  const newNotif = {
    id: crypto.randomUUID(),
    type,
    message,
    link,
    read: false,
    timestamp: Date.now(),
  }

  saveNotifs([newNotif, ...existing], uid)
  window.dispatchEvent(new Event('notif-updated'))
}

export async function markAllRead() {
  const uid = await getUserId()
  const notifs = getRawNotifs(uid).map(n =>
    n.type === 'low_stock' ? n : { ...n, read: true }
  )
  saveNotifs(notifs, uid)
  window.dispatchEvent(new Event('notif-updated'))
}

export async function deleteRead() {
  const uid = await getUserId()
  const notifs = getRawNotifs(uid).filter(n => n.type === 'low_stock' || !n.read)
  saveNotifs(notifs, uid)
  window.dispatchEvent(new Event('notif-updated'))
}

export async function markOneRead(id) {
  const uid = await getUserId()
  const notifs = getRawNotifs(uid).map(n =>
    n.id === id && n.type !== 'low_stock' ? { ...n, read: true } : n
  )
  saveNotifs(notifs, uid)
  window.dispatchEvent(new Event('notif-updated'))
}

export async function getUnreadCount() {
  const notifs = await getNotifs()
  return notifs.filter(n => !n.read).length
}

export async function syncLowStockNotifs(enabled, lowStockProducts = []) {
  const uid = await getUserId()
  const existing = getRawNotifs(uid)
  if (!enabled) {
    saveNotifs(existing.filter(n => n.type !== 'low_stock'), uid)
  } else {
    const nonLow = existing.filter(n => n.type !== 'low_stock')
    const newLows = lowStockProducts.map(p => ({
      id: crypto.randomUUID(),
      type: 'low_stock',
      message: `Stok "${p.name}" menipis (${p.stock} ${p.unit} tersisa)`,
      link: '/stock',
      read: false,
      timestamp: Date.now(),
    }))
    saveNotifs([...newLows, ...nonLow], uid)
  }
  window.dispatchEvent(new Event('notif-updated'))
}