import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Star, Heart } from 'lucide-react'
import { Product } from '../types'
import { formatINR, estimateEmi } from '../lib/format'
import { useWishlist } from '../lib/useWishlist'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function ProductCard({ product, onWishlist, wishlisted }: {
  product: Product
  onWishlist?: (id: number) => void
  wishlisted?: boolean
}) {
  const img = product.imageUrls[0] || 'https://placehold.co/600x600/F0E9DE/3B2E5A?text=No+Image'
  const { isWishlisted, toggleWishlist } = useWishlist()
  const accessToken = useAuthStore((s) => s.accessToken)
  const navigate = useNavigate()

  // Determine wishlist state: use external prop if provided, otherwise use hook
  const isInWishlist = wishlisted !== undefined ? wishlisted : isWishlisted(product.id)

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!accessToken) {
      navigate('/login')
      return
    }
    if (onWishlist) {
      onWishlist(product.id)
    } else {
      toggleWishlist(product.id)
    }
  }

  // Hover-tilt: subtle 3D perspective tilt that follows the cursor across the product photo.
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const springX = useSpring(tiltX, { stiffness: 300, damping: 25 })
  const springY = useSpring(tiltY, { stiffness: 300, damping: 25 })
  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8])
  const scale = useMotionValue(1)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    tiltX.set((e.clientX - rect.left) / rect.width - 0.5)
    tiltY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  function handleEnter() {
    scale.set(1.06)
  }
  function handleLeave() {
    tiltX.set(0)
    tiltY.set(0)
    scale.set(1)
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative glass rounded-card overflow-hidden border border-hairline/10 hover:border-coral/30 transition-colors"
    >
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-surface/60 backdrop-blur flex items-center justify-center hover:scale-110 transition-transform"
        title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`h-4 w-4 transition-colors ${isInWishlist ? 'fill-coral text-coral' : 'text-ink/70'}`} />
      </button>
      {product.discountPercent > 0 && (
        <span className="absolute top-3 left-3 z-10 text-[11px] font-bold bg-plumfixed text-onaccentlight px-2 py-0.5 rounded-full">
          {product.discountPercent}% OFF
        </span>
      )}
      <Link to={`/product/${product.slug}`}>
        <div
          className="aspect-square overflow-hidden bg-surface2"
          style={{ perspective: 800 }}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          <motion.img
            src={img}
            alt={product.name}
            style={{ rotateX, rotateY, scale, transformStyle: 'preserve-3d' }}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <p className="text-xs text-ink/40">{product.brand}</p>
          <h3 className="font-medium text-sm leading-snug line-clamp-2 mt-0.5 min-h-[2.5rem]">{product.name}</h3>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-ink/50">
            <Star className="h-3.5 w-3.5 fill-coral text-coral" />
            {product.ratingAverage?.toFixed(1) || '—'} ({product.ratingCount})
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-display font-bold text-lg">{formatINR(product.price)}</span>
            {product.mrp > product.price && (
              <span className="text-xs text-ink/40 line-through">{formatINR(product.mrp)}</span>
            )}
          </div>
          {product.price >= 3000 && (
            <p className="text-[11px] text-plum/80 mt-1">EMI from {formatINR(estimateEmi(product.price))}/mo</p>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-[11px] text-coral/80 mt-1">Only {product.stock} left</p>
          )}
          {product.stock === 0 && <p className="text-[11px] text-red-400 mt-1">Out of stock</p>}
        </div>
      </Link>
    </motion.div>
  )
}
