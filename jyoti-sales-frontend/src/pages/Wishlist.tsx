import { useAuthStore } from '../store/authStore'
import { Navigate, Link } from 'react-router-dom'
import { useWishlist } from '../lib/useWishlist'
import { useCart } from '../lib/useCart'
import { formatINR } from '../lib/format'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function Wishlist() {
  const { accessToken } = useAuthStore()
  const { wishlistProducts, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [movingId, setMovingId] = useState<number | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<number>>(new Set())

  if (!accessToken) return <Navigate to="/login" replace />

  async function handleMoveToCart(product: typeof wishlistProducts[0]) {
    setMovingId(product.id)
    try {
      await addToCart(product, 1)
      await removeFromWishlist(product.id)
      setRemovedIds((prev) => new Set(prev).add(product.id))
    } finally {
      setMovingId(null)
    }
  }

  async function handleRemove(productId: number) {
    setRemovedIds((prev) => new Set(prev).add(productId))
    await removeFromWishlist(productId)
  }

  const visibleProducts = wishlistProducts.filter((p) => !removedIds.has(p.id))

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="h-7 w-7 text-coral fill-coral" />
        <h1 className="font-display text-2xl font-bold">My Wishlist</h1>
        {visibleProducts.length > 0 && (
          <span className="text-sm text-ink/50">({visibleProducts.length} items)</span>
        )}
      </div>

      {visibleProducts.length > 0 ? (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((p) => {
              const img = p.imageUrls?.[0] || 'https://placehold.co/200x200/F0E9DE/3B2E5A?text=No+Image'
              const isMoving = movingId === p.id

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100, transition: { duration: 0.25 } }}
                  className="glass rounded-card border border-hairline/10 overflow-hidden hover:border-coral/20 transition-colors"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* Product image */}
                    <Link to={`/product/${p.slug}`} className="shrink-0">
                      <img
                        src={img}
                        alt={p.name}
                        className="h-24 w-24 sm:h-28 sm:w-28 rounded-lg object-cover"
                      />
                    </Link>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${p.slug}`}>
                        <p className="text-xs text-ink/40">{p.brand}</p>
                        <h3 className="font-medium text-sm sm:text-base leading-snug line-clamp-2 mt-0.5 hover:text-coral transition-colors">
                          {p.name}
                        </h3>
                      </Link>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-display font-bold text-lg">{formatINR(p.price)}</span>
                        {p.mrp > p.price && (
                          <>
                            <span className="text-xs text-ink/40 line-through">{formatINR(p.mrp)}</span>
                            <span className="text-xs text-plum font-semibold">{p.discountPercent}% off</span>
                          </>
                        )}
                      </div>
                      {p.stock === 0 ? (
                        <p className="text-xs text-red-400 mt-1">Out of stock</p>
                      ) : p.stock <= 5 ? (
                        <p className="text-xs text-coral/80 mt-1">Only {p.stock} left</p>
                      ) : (
                        <p className="text-xs text-emerald-500/70 mt-1">In Stock</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button
                        onClick={() => handleMoveToCart(p)}
                        disabled={isMoving || p.stock === 0}
                        className="flex items-center gap-2 rounded-full bg-coral text-onaccent font-semibold px-4 py-2.5 text-sm disabled:opacity-40 hover:shadow-glow transition-all"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isMoving ? 'Moving...' : 'Move to Cart'}
                      </button>
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="flex items-center gap-2 rounded-full border border-hairline/20 text-ink/60 px-4 py-2.5 text-sm hover:border-red-400/40 hover:text-red-400 transition-colors"
                        title="Remove from Wishlist"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart className="h-16 w-16 text-ink/10 mx-auto mb-4" />
          <p className="text-ink/40 text-lg">Your wishlist is empty.</p>
          <p className="text-ink/30 text-sm mt-1">Tap the heart icon on any product to save it here.</p>
          <Link
            to="/"
            className="inline-block mt-6 rounded-full bg-coral text-onaccent font-semibold px-6 py-3 hover:shadow-glow transition-shadow"
          >
            Browse Products
          </Link>
        </div>
      )}
    </div>
  )
}
