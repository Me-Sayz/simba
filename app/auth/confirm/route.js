import { NextResponse } from 'next/server'

// SENGAJA cuma nerusin token_hash & type ke /auth/reset-password, gak
// verifikasi di sini lagi. Verifikasi dipindah ke halaman reset-password
// sendiri, biar halaman itu punya bukti token valid yang jelas — bukan cuma
// percaya sesi yang kebetulan lagi aktif di browser.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type) {
    const target = new URL('/auth/reset-password', origin)
    target.searchParams.set('token_hash', token_hash)
    target.searchParams.set('type', type)
    return NextResponse.redirect(target)
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`)
}