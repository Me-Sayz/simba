'use client'
import { useEffect, useState } from 'react'

/**
 * Hook fetch data Supabase yang bedain 3 kondisi secara eksplisit:
 * - loading: masih nunggu
 * - error: query gagal (offline, RLS, sesi expired, dll) — data TETAP null,
 *   BUKAN array kosong, biar UI gak salah nampilin "belum ada data"
 * - data kosong beneran: loading=false, error=null, data=[]
 *
 * Pemakaian:
 *   const { data: products, loading, error, refetch } =
 *     useSupabaseFetch(() => supabase.from('products').select('*'))
 *
 * deps opsional — kalau query-nya butuh nunggu value lain (misal id dari URL),
 * masukin ke deps biar auto refetch pas value itu berubah.
 */
export function useSupabaseFetch(queryFn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [completedKey, setCompletedKey] = useState(-1)

  useEffect(() => {
    let cancelled = false

    queryFn().then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setError(error)
        setData(null)
      } else {
        setError(null)
        setData(data ?? [])
      }
      setCompletedKey(reloadKey)
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const loading = completedKey !== reloadKey
  const refetch = () => setReloadKey(k => k + 1)

  return { data, loading, error, refetch }
}