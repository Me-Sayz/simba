'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck, Trash2, Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, X } from 'lucide-react'
import { getNotifs, markAllRead, deleteRead, markOneRead, getUnreadCount } from '@/lib/notifications'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m} menit lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} jam lalu`
  const d = Math.floor(h / 24)
  return `${d} hari lalu`
}

const iconMap = {
  stock_in: <ArrowDownCircle size={14} className="text-emerald-500" />,
  stock_out: <ArrowUpCircle size={14} className="text-blue-500" />,
  new_product: <Package size={14} className="text-purple-500" />,
  low_stock: <AlertTriangle size={14} className="text-rose-500" />,
}

// mode: 'mobile' | 'desktop'
export default function NotificationPanel({ mode = 'mobile', sidebarCollapsed = false }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [unread, setUnread] = useState(0)
  const [filter, setFilter] = useState('all')
  const panelRef = useRef(null)
  const router = useRouter()

  async function refresh() {
    setNotifs(await getNotifs())
    setUnread(await getUnreadCount())
  }

  useEffect(() => {
    refresh()
    window.addEventListener('notif-updated', refresh)
    return () => window.removeEventListener('notif-updated', refresh)
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleNotifClick(notif) {
    await markOneRead(notif.id)
    refresh()
    setOpen(false)
    router.push(notif.link)
  }

  const displayed = filter === 'unread' ? notifs.filter(n => !n.read) : notifs
  const isDesktop = mode === 'desktop'

  return (
    <div className="relative" ref={panelRef}>

      {/* Bell button */}
      {isDesktop ? (
        // Desktop sidebar: mirip nav link
        <button onClick={() => setOpen(o => !o)}
          className={`relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <Bell size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>Notifikasi</span>}
          {unread > 0 && (
            <span className={`bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium ${sidebarCollapsed ? 'absolute top-1 right-1' : 'ml-auto'}`}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      ) : (
        // Mobile topbar: hanya icon
        <button onClick={() => setOpen(o => !o)} className="relative p-1">
          <Bell size={20} className="text-gray-400 hover:text-terong-deep dark:hover:text-gray-200 transition-colors" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-medium">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className={`absolute w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden
          ${isDesktop ? 'bottom-full left-0 mb-2' : 'right-0 top-9'}`}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Notifikasi</p>
              {unread > 0 && (
                <span className="bg-rose-100 dark:bg-rose-950 text-rose-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <button onClick={() => setOpen(false)}>
              <X size={16} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-1">
            {[['all', 'Semua'], ['unread', 'Belum dibaca']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filter === val
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
            {displayed.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Tidak ada notifikasi</p>
              </div>
            ) : displayed.map(n => (
              <button key={n.id} onClick={() => handleNotifClick(n)}
                className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  n.type === 'low_stock'
                    ? 'bg-rose-50/60 dark:bg-rose-950/30'
                    : n.read
                    ? 'bg-gray-50/80 dark:bg-gray-800/50'
                    : 'bg-white dark:bg-gray-900'
                }`}>
                <div className="mt-0.5 shrink-0">{iconMap[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${
                    n.type === 'low_stock'
                      ? 'text-rose-700 dark:text-rose-400 font-medium'
                      : n.read
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-800 dark:text-gray-100'
                  }`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{timeAgo(n.timestamp)}</p>
                </div>
                {!n.read && n.type !== 'low_stock' && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Actions footer */}
          {notifs.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <button onClick={async () => { await markAllRead(); refresh() }}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <CheckCheck size={13} /> Tandai semua terbaca
              </button>
              <span className="text-gray-300 dark:text-gray-700">·</span>
              <button onClick={async () => { await deleteRead(); refresh() }}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors">
                <Trash2 size={13} /> Hapus terbaca
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}