'use client'
import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  // cart = { [productId]: qty }
  const [cart, setCart] = useState({})

  function addToCart(productId, qty = 1) {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + qty }))
  }

  function removeFromCart(productId, qty = 1) {
    setCart(prev => {
      if (!prev[productId]) return prev
      const nextQty = prev[productId] - qty
      const next = { ...prev }
      if (nextQty <= 0) delete next[productId]
      else next[productId] = nextQty
      return next
    })
  }

  function setQty(productId, qty) {
    setCart(prev => {
      const next = { ...prev }
      if (qty <= 0) delete next[productId]
      else next[productId] = qty
      return next
    })
  }

  function clearCart() {
    setCart({})
  }

  const itemCount = Object.keys(cart).length // jumlah produk BEDA (bukan total qty)
  const totalQty = Object.values(cart).reduce((s, q) => s + q, 0)

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, setQty, clearCart, itemCount, totalQty }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart harus dipakai di dalam <CartProvider>')
  return ctx
}