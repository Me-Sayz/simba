import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Email & last_sign_in_at cuma ada di auth.users (bukan tabel profiles), jadi
// wajib diambil lewat service_role di server, gak bisa langsung dari client.
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: membership } = await supabaseAdmin
      .from('store_members')
      .select('store_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Cuma Owner yang bisa lihat detail staff' }, { status: 403 })
    }

    const { data: storeMembers } = await supabaseAdmin
      .from('store_members')
      .select('user_id')
      .eq('store_id', membership.store_id)

    const userIds = (storeMembers || []).map((m: { user_id: string }) => m.user_id)

    const details = await Promise.all(
      userIds.map(async (id: string) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id)
        return {
          user_id: id,
          email: data?.user?.email ?? null,
          last_sign_in_at: data?.user?.last_sign_in_at ?? null,
        }
      })
    )

    return NextResponse.json({ members: details })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}