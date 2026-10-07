import { create } from 'zustand'

export interface FlyItem {
  id: string
  imageUrl: string
  from: { top: number; left: number; width: number; height: number }
  to: { top: number; left: number; width: number; height: number }
}

interface FlyState {
  items: FlyItem[]
  add: (item: FlyItem) => void
  remove: (id: string) => void
}

// Global queue of "fly to cart" animations — rendered by <FlyToCartLayer/> mounted once at the app root.
export const useFlyStore = create<FlyState>((set) => ({
  items: [],
  add: (item) => set((s) => ({ items: [...s.items, item] })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))

// Set by the Navbar's cart icon on mount so callers anywhere in the app know where to fly toward.
export const cartIconRef: { current: HTMLElement | null } = { current: null }

export function triggerFlyToCart(imageUrl: string, sourceEl: HTMLElement) {
  const target = cartIconRef.current
  if (!target || !imageUrl) return
  const fromRect = sourceEl.getBoundingClientRect()
  const toRect = target.getBoundingClientRect()
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  useFlyStore.getState().add({
    id,
    imageUrl,
    from: { top: fromRect.top, left: fromRect.left, width: fromRect.width, height: fromRect.height },
    to: {
      top: toRect.top + toRect.height / 2 - 10,
      left: toRect.left + toRect.width / 2 - 10,
      width: 20,
      height: 20,
    },
  })
}
