'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ScanLine, ShoppingCart, History, User } from 'lucide-react'
import { useCart } from '@/context/CartContext'

const items = [
  { href: '/kasir/product', label: 'Produk', icon: Package },
  { href: '/kasir/riwayat', label: 'Riwayat', icon: History },
  { href: '/kasir/scan', label: 'Scan', icon: ScanLine, fab: true },
  { href: '/kasir/keranjang', label: 'Keranjang', icon: ShoppingCart, badge: true },
  { href: '/kasir/akun', label: 'Akun', icon: User },
]

export default function KasirNav({ profile }) {
  const pathname = usePathname()
  const { itemCount } = useCart()

  return (
    <>
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 px-4 py-6 z-30">
        <div className="flex items-center gap-2.5 px-2 pb-7">
          <img src="/logo.png" alt="SIMBA" className="w-9 h-9 object-contain shrink-0" />
          <div className="min-w-0">
            <p className="font-bold text-[15px] text-gray-900 dark:text-white leading-tight truncate">SIMBA</p>
            <p className="text-[11px] text-gray-400 truncate">Mode Kasir</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors
                  ${active
                    ? 'bg-terong text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-terong-soft hover:text-terong-deep dark:hover:bg-gray-800'}`}
              >
                <Icon size={19} className="shrink-0" />
                <span className="truncate">{label}</span>
                {badge && itemCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold bg-merah-c text-white px-1.5 py-0.5 rounded-full shrink-0 min-w-[18px] text-center">
                    {itemCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-4 px-1 text-[11px] text-gray-400 border-t border-gray-100 dark:border-gray-800">
          {profile?.name || 'Toko Anda'} • Kasir aktif
        </div>
      </aside>

      {/* ===== Mobile Bottom Nav ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex px-1 pb-[max(6px,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(46,16,101,0.06)]">
        {items.map(({ href, label, icon: Icon, fab, badge }) => {
          const active = pathname === href

          if (fab) {
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-1 py-1.5 -mt-4">
                <span className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-terong to-terong-deep flex items-center justify-center shadow-lg shadow-terong/40">
                  <Icon size={22} className="text-white" />
                </span>
                <span className="text-[10.5px] font-bold text-terong-deep">{label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 relative ${active ? 'text-terong' : 'text-gray-400'}`}
            >
              <span className="relative">
                <Icon size={21} />
                {badge && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-merah-c text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-gray-900">
                    {itemCount}
                  </span>
                )}
              </span>
              <span className="text-[10.5px] font-semibold">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}