function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.725-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.755-1.333-1.755-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.807 1.305 3.492.998.108-.775.42-1.305.762-1.605-2.665-.303-5.467-1.332-5.467-5.93 0-1.31.469-2.38 1.235-3.22-.123-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.118 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.807 5.624-5.48 5.92.43.372.823 1.103.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.298 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function TikTokIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

const SOCIAL_LINKS = [
  { name: 'TikTok', url: 'https://tiktok.com/@suryaadiprayoga', Icon: TikTokIcon },
  { name: 'Instagram', url: 'https://instagram.com/surya.adi.prayoga', Icon: InstagramIcon },
  { name: 'GitHub', url: 'https://github.com/Me-Sayz', Icon: GithubIcon },
]

const TECH_STACK = [
  { label: 'Next.js', bg: 'bg-black', text: 'text-white', letter: 'N' },
  { label: 'Tailwind CSS', bg: 'bg-teal-500', text: 'text-white', letter: 'T' },
  { label: 'Supabase', bg: 'bg-emerald-600', text: 'text-white', letter: 'S' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <div className="px-4 md:px-6 py-6 max-w-7xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tentang Aplikasi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Informasi seputar SIMBA</p>
        </div>

        <div className="flex flex-col gap-5">

          {/* Info app */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center">
            <img src="/logo.png" alt="SIMBA" className="w-16 h-16 mx-auto mb-3" />
            <p className="font-bold text-xl text-gray-900 dark:text-gray-100">SIMBA</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sistem Monitoring Barang</p>
            <span className="inline-block mt-2 bg-terong-soft text-terong dark:text-terong-light text-xs font-semibold px-2.5 py-1 rounded-lg">
              v1.0.0
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 leading-relaxed">
              SIMBA adalah aplikasi monitoring stok dan kasir (POS) yang dirancang khusus buat UMKM —
              simpel, ringan, dan gampang dipakai tanpa perlu ribet paham teknologi.
            </p>
          </div>

          {/* Tech stack */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Dibuat dengan</p>
            <div className="flex items-center gap-4 flex-wrap">
              {TECH_STACK.map(({ label, bg, text, letter }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={`${bg} ${text} text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0`}>
                    {letter}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kredit developer */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">Dibuat oleh</p>
            {/* TODO: ganti "Nama Kamu" ke nama asli */}
            <p className="text-lg font-bold text-terong-deep dark:text-terong-light mb-4">Surya Adi Prayoga</p>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ name, url, Icon }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={name}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-terong-soft hover:text-terong dark:hover:text-terong-light transition-colors"
                >
                  <Icon className="w-[18px] h-[18px]" />
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}