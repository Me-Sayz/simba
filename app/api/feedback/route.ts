import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CATEGORY_LABELS: Record<string, string> = {
  kritik: 'Kritik',
  saran: 'Saran',
  bug: 'Laporan Bug',
  lainnya: 'Lainnya',
}

const CATEGORY_COLORS: Record<string, number> = {
  kritik: 0xef4444, // merah
  saran: 0x3b82f6, // biru
  bug: 0xf97316, // oranye
  lainnya: 0x9ca3af, // abu
}

async function notifyDiscord(category: string, message: string, email: string | undefined, storeName: string | null) {
  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL
  if (!webhookUrl) return // belum di-setup, skip diam-diam — gak wajib

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `📩 Feedback Baru: ${CATEGORY_LABELS[category] || category}`,
          description: message,
          color: CATEGORY_COLORS[category] ?? 0x5b21b6,
          fields: [
            { name: 'Dari', value: email || 'Tidak diketahui', inline: true },
            { name: 'Toko', value: storeName || '-', inline: true },
          ],
          timestamp: new Date().toISOString(),
        }],
      }),
    })
  } catch {
    // gagal kirim notif Discord bukan alasan buat gagalin submit feedback-nya
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { category, message } = await req.json()
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Pesan minimal 10 karakter' }, { status: 400 })
    }

    const { data: membership } = await supabaseAdmin
      .from('store_members')
      .select('store_id, stores ( name )')
      .eq('user_id', user.id)
      .single()

    const { error: insertError } = await supabaseAdmin.from('feedback').insert({
      user_id: user.id,
      store_id: membership?.store_id ?? null,
      category: category || 'lainnya',
      message: message.trim(),
    })

    if (insertError) {
      return NextResponse.json({ error: 'Gagal menyimpan feedback' }, { status: 500 })
    }

    const storeName = (membership as unknown as { stores?: { name?: string } })?.stores?.name ?? null
    await notifyDiscord(category || 'lainnya', message.trim(), user.email, storeName)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}