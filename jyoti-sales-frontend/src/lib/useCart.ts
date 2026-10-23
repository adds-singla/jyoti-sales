import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { api, apiErrorMessage } from './api'
import { useAuthStore } from '../store/authStore'
import { useGuestCartStore } from '../store/cartStore'
import { Cart, Product } from '../types'

// Server-backed cart for logged-in users; guest cart (localStorage) otherwise, per spec section 3.4.
export function useCart() {
  const { accessToken } = useAuthStore()
  const guest = useGuestCartStore()
  const qc = useQueryClient()

  const serverCart = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await api.get<Cart>('/cart')).data,
    enabled: !!accessToken,
  })

  const guestCart: Cart = {
    cartId: -1,
    items: guest.items.map((i, idx) => ({
      cartItemId: idx,
      productId: i.productId,
      productName: i.name,
      imageUrl: i.imageUrl,
      variantId: i.variantId,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.unitPrice * i.quantity,
      availableStock: 999,
    })),
    subtotal: guest.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    discount: 0,
    total: guest.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  }

  const cart = accessToken ? serverCart.data : guestCart
  const count = (cart?.items || []).reduce((s, i) => s + i.quantity, 0)

  async function addToCart(product: Product, quantity = 1, variantId?: number) {
    if (accessToken) {
      await api.post('/cart/items', { productId: product.id, variantId, quantity })
      qc.invalidateQueries({ queryKey: ['cart'] })
    } else {
      const variant = product.variants.find((v) => v.id === variantId)
      guest.addItem({
        productId: product.id,
        variantId,
        name: product.name + (variant ? ` (${variant.variantValue})` : ''),
        imageUrl: product.imageUrls[0],
        unitPrice: product.price + (variant?.priceDelta || 0),
        quantity,
      })
    }
  }

  async function updateQuantity(itemId: number, quantity: number, productId?: number, variantId?: number) {
    if (accessToken) {
      await api.put(`/cart/items/${itemId}?quantity=${quantity}`)
      qc.invalidateQueries({ queryKey: ['cart'] })
    } else if (productId !== undefined) {
      guest.updateQuantity(productId, variantId, quantity)
    }
  }

  async function removeItem(itemId: number, productId?: number, variantId?: number) {
    if (accessToken) {
      await api.delete(`/cart/items/${itemId}`)
      qc.invalidateQueries({ queryKey: ['cart'] })
    } else if (productId !== undefined) {
      guest.removeItem(productId, variantId)
    }
  }

  async function applyCoupon(code: string) {
    if (!accessToken) throw new Error('Please log in to apply a coupon')
    await api.post(`/cart/coupon?code=${encodeURIComponent(code)}`)
    qc.invalidateQueries({ queryKey: ['cart'] })
  }

  /** Called after login: migrates localStorage guest cart items to the server cart. */
  async function syncGuestCartToServer() {
    const guestItems = useGuestCartStore.getState().items
    if (!guestItems.length) return
    // Add each guest item to server cart (best-effort, ignore errors per item)
    for (const item of guestItems) {
      try {
        await api.post('/cart/items', {
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        })
      } catch (_) { /* ignore individual item failures */ }
    }
    useGuestCartStore.getState().clear()
    qc.invalidateQueries({ queryKey: ['cart'] })
  }

  return { cart, count, isLoading: accessToken ? serverCart.isLoading : false, addToCart, updateQuantity, removeItem, applyCoupon, syncGuestCartToServer, apiErrorMessage }
}
