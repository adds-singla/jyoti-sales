import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Guest cart (localStorage) used when logged out. Once logged in, cart lives server-side
// (see CartService / useCart hooks) and this store is bypassed.
export interface GuestCartItem {
  productId: number
  variantId?: number
  name: string
  imageUrl?: string
  unitPrice: number
  quantity: number
}

interface GuestCartState {
  items: GuestCartItem[]
  addItem: (item: GuestCartItem) => void
  updateQuantity: (productId: number, variantId: number | undefined, quantity: number) => void
  removeItem: (productId: number, variantId?: number) => void
  clear: () => void
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = [...get().items]
        const idx = items.findIndex((i) => i.productId === item.productId && i.variantId === item.variantId)
        if (idx >= 0) {
          items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity }
        } else {
          items.push(item)
        }
        set({ items })
      },
      updateQuantity: (productId, variantId, quantity) => {
        const items = get().items
          .map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i))
          .filter((i) => i.quantity > 0)
        set({ items })
      },
      removeItem: (productId, variantId) => {
        set({ items: get().items.filter((i) => !(i.productId === productId && i.variantId === variantId)) })
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'jyoti-guest-cart' },
  ),
)
