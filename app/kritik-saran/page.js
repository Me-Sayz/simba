'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { inputCls, FieldError } from '@/lib/formHelpers'
import { ChevronLeft, MessageSquareHeart, Send, CheckCircle2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'kritik', label: 'Kritik' },
  { value: 'saran', label: 'Saran' },
  { value: 'bug', label: 'Laporan Bug' },
  { value: 'lainnya', label: 'Lainnya' },
]

export default function KritikSaranPage() {
  const [category, setCategory] = useState('saran')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!message.trim()) return setError('Pesan gak boleh kosong')
    if (message.trim().length < 10) return setError('Ceritain sedikit lebih detail ya (min. 10 karakter)')

    setSending(true)
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ category, message: message.trim() }),
    })

    setSending(false)
    if (!res.ok) {
      const result = await res.json().catch(() => ({}))
      setError(result.error || 'Gagal mengirim, coba lagi sebentar lagi')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 pb-10">
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">
        <div>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/settings" className="p-2 -ml-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500">
              <ChevronLeft size={20} />
            </Link>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">Kritik &amp; Saran</h1>
              <p className="text-xs text-gray-400">Bantu SIMBA jadi lebih baik lewat masukan kamu</p>
            </div>
          </div>

          {sent ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center text-center">
              <span className="w-14 h-14 rounded-2xl bg-daun-soft flex items-center justify-center mb-4">
                <CheckCircle2 size={26} className="text-daun dark:text-daun-light" />
              </span>
              <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Makasih atas masukannya!</p>
              <p className="text-sm text-gray-400 mb-5">Pesan kamu udah kekirim dan bakal dibaca langsung.</p>
              <button
                onClick={() => { setSent(false); setMessage(''); setCategory('saran') }}
                className="text-sm font-semibold text-terong dark:text-terong-light hover:underline"
              >
                Kirim masukan lain
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-11 h-11 rounded-[13px] bg-terong-soft flex items-center justify-center shrink-0">
                  <MessageSquareHeart size={19} className="text-terong dark:text-terong-light" />
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ada ide fitur, keluhan, atau nemu bug? Kabarin di sini, langsung nyampe ke developer.
                </p>
              </div>

              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Jenis Masukan</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {CATEGORIES.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`text-sm font-medium py-2 rounded-xl border transition-colors ${
                      category === c.value
                        ? 'bg-terong text-white border-terong'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Pesan</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                placeholder="Ceritain masukan kamu di sini..."
                className={inputCls(!!error) + ' resize-none'}
              />
              <FieldError msg={error} />

              <button
                type="submit"
                disabled={sending}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-terong text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:opacity-90 transition-colors disabled:opacity-60"
              >
                <Send size={15} /> {sending ? 'Mengirim...' : 'Kirim Masukan'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}