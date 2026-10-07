import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useAuthStore } from '../store/authStore'
import { Product } from '../types'

export function useWishlist() {
  const qc = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)

  const { data: wishlistProducts } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get<Product[]>('/wishlist')).data,
    enabled: !!accessToken,
  })

  const wishlistIds = new Set(wishlistProducts?.map((p) => p.id) ?? [])

  function isWishlisted(productId: number) {
    return wishlistIds.has(productId)
  }

  async function toggleWishlist(productId: number) {
    if (!accessToken) return
    if (isWishlisted(productId)) {
      await api.delete(`/wishlist/${productId}`)
    } else {
      await api.post(`/wishlist/${productId}`)
    }
    qc.invalidateQueries({ queryKey: ['wishlist'] })
  }

  async function removeFromWishlist(productId: number) {
    if (!accessToken) return
    await api.delete(`/wishlist/${productId}`)
    qc.invalidateQueries({ queryKey: ['wishlist'] })
  }

  return { isWishlisted, toggleWishlist, removeFromWishlist, wishlistIds, wishlistProducts: wishlistProducts ?? [] }
}
