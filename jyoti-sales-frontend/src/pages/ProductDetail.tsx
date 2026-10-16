import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { Product, Review } from '../types'
import { formatINR, estimateEmi } from '../lib/format'
import { useCart } from '../lib/useCart'
import { useAuthStore } from '../store/authStore'
import Rating from '../components/Rating'
import ProductCard from '../components/ProductCard'
import { ShieldCheck, Truck, Undo2, Star, Heart, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { triggerFlyToCart } from '../lib/flyToCart'

export default function ProductDetail() {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const qc = useQueryClient()
  const { accessToken } = useAuthStore()
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>(undefined)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [reviewMsg, setReviewMsg] = useState('')
  const galleryImgRef = useRef<HTMLImageElement>(null)
  const [lightbox, setLightbox] = useState(false)
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get<Product>(`/products/slug/${slug}`)).data,
  })

  // Keyboard navigation for gallery — defined after product so it's in scope
  const navigate = useCallback((dir: 1 | -1) => {
    if (!product) return
    setActiveImage((prev) => {
      const next = (prev + dir + product.imageUrls.length) % product.imageUrls.length
      setTimeout(() => {
        const el = thumbnailsRef.current?.children[next] as HTMLElement
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }, 0)
      return next
    })
  }, [product])

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'ArrowLeft')  navigate(-1)
      if (e.key === 'Escape')     setLightbox(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightbox, navigate])

  const { data: related } = useQuery({
    queryKey: ['related', product?.id],
    queryFn: async () => (await api.get(`/products/${product!.id}/related`)).data as Product[],
    enabled: !!product,
  })

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: async () => (await api.get(`/reviews/product/${product!.id}`)).data,
    enabled: !!product,
  })

  const { data: wishlistProducts } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => (await api.get<Product[]>('/wishlist')).data,
    enabled: !!accessToken,
  })
  const isWishlisted = wishlistProducts?.some((p) => p.id === product?.id) ?? false

  async function toggleWishlist() {
    if (!accessToken || !product) return
    if (isWishlisted) {
      await api.delete(`/wishlist/${product.id}`)
    } else {
      await api.post(`/wishlist/${product.id}`)
    }
    qc.invalidateQueries({ queryKey: ['wishlist'] })
  }

  if (isLoading) return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-ink/50">Loading product...</div>
  if (!product) return <div className="mx-auto max-w-7xl px-4 py-20 text-center">Product not found.</div>

  const activePrice = product.price + (product.variants.find((v) => v.id === selectedVariant)?.priceDelta || 0)
  const variantGroups = Array.from(new Set(product.variants.map((v) => v.variantType)))

  async function handleAddToCart() {
    if (galleryImgRef.current) {
      triggerFlyToCart(galleryImgRef.current.src, galleryImgRef.current)
    }
    await addToCart(product!, qty, selectedVariant)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/reviews', { productId: product!.id, ...reviewForm })
      setReviewMsg('Thanks for your review!')
      setReviewForm({ rating: 5, title: '', body: '' })
      refetchReviews()
    } catch (err: any) {
      setReviewMsg(err?.response?.data?.message || 'Could not submit review.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        {/* ── Gallery ── */}
        <div>
          {/* Main image with prev/next arrows */}
          <div className="relative aspect-square rounded-card overflow-hidden glass border border-hairline/10 group">
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                ref={galleryImgRef}
                src={product.imageUrls[activeImage] || product.imageUrls[0]}
                alt={`${product.name} — image ${activeImage + 1}`}
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setLightbox(true)}
              />
            </AnimatePresence>

            {/* Image counter badge */}
            {product.imageUrls.length > 1 && (
              <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                {activeImage + 1} / {product.imageUrls.length}
              </span>
            )}

            {/* Expand / fullscreen button */}
            <button
              onClick={() => setLightbox(true)}
              className="absolute top-3 left-3 bg-black/50 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
              title="View fullscreen"
            >
              <Expand className="h-4 w-4" />
            </button>

            {/* Prev arrow */}
            {product.imageUrls.length > 1 && (
              <>
                <button
                  onClick={() => navigate(-1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {product.imageUrls.length > 1 && (
            <div
              ref={thumbnailsRef}
              className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide"
            >
              {product.imageUrls.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                    i === activeImage
                      ? 'border-coral ring-2 ring-coral/30 scale-105'
                      : 'border-hairline/15 hover:border-hairline/40'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Dot indicators (mobile) */}
          {product.imageUrls.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-3 md:hidden">
              {product.imageUrls.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeImage ? 'w-5 bg-coral' : 'w-1.5 bg-ink/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Lightbox modal ── */}
        <AnimatePresence>
          {lightbox && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightbox(false)}
            >
              <motion.img
                key={activeImage}
                src={product.imageUrls[activeImage]}
                alt={product.name}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-full max-h-full object-contain rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />

              {/* Close */}
              <button
                onClick={() => setLightbox(false)}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-sm"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Lightbox arrows */}
              {product.imageUrls.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(-1) }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(1) }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}

              {/* Lightbox counter */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <span className="text-white/60 text-sm">{activeImage + 1} of {product.imageUrls.length}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info */}
        <div>
          <p className="text-sm text-ink/50">{product.brand} · {product.categoryName}</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Rating value={product.ratingAverage} />
            <span className="text-sm text-ink/50">({product.ratingCount} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mt-4">
            <span className="font-display text-3xl font-bold">{formatINR(activePrice)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-ink/40 line-through">{formatINR(product.mrp)}</span>
                <span className="text-plum text-sm font-semibold">{product.discountPercent}% off</span>
              </>
            )}
          </div>
          {activePrice >= 3000 && (
            <p className="text-sm text-plum/80 mt-1">or from {formatINR(estimateEmi(activePrice))}/mo with easy EMI</p>
          )}

          {variantGroups.map((type) => (
            <div key={type} className="mt-5">
              <p className="text-sm font-medium mb-2">{type}</p>
              <div className="flex gap-2 flex-wrap">
                {product.variants.filter((v) => v.variantType === type).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`px-4 py-2 rounded-full text-sm border ${selectedVariant === v.id ? 'border-coral text-coral bg-coral/10' : 'border-hairline/20 text-ink/70'}`}
                  >
                    {v.variantValue}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 mt-6">
            <div className="flex items-center border border-hairline/20 rounded-full">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2">-</button>
              <span className="px-3">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2">+</button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 rounded-full bg-coral text-onaccent font-semibold py-3 disabled:opacity-40 hover:shadow-glow transition-shadow"
            >
              {added ? 'Added ✓' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <Link to="/cart" onClick={handleAddToCart} className="rounded-full border border-plum text-plum font-semibold py-3 px-6 hover:bg-plum/10 transition-colors">
              Buy Now
            </Link>
            {accessToken && (
              <button
                onClick={toggleWishlist}
                className="h-12 w-12 rounded-full border border-hairline/20 flex items-center justify-center hover:bg-coral/10 transition-colors"
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-coral text-coral' : 'text-ink/50'}`} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 text-xs text-ink/60">
            <div className="flex flex-col items-center gap-1 text-center"><ShieldCheck className="h-5 w-5 text-coral" />Genuine Warranty</div>
            <div className="flex flex-col items-center gap-1 text-center"><Truck className="h-5 w-5 text-coral" />Fast Delivery</div>
            <div className="flex flex-col items-center gap-1 text-center"><Undo2 className="h-5 w-5 text-coral" />Easy Returns</div>
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="mt-14 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Description</h2>
          <p className="text-ink/70 leading-relaxed">{product.description}</p>
        </div>
        <div>
          <h2 className="font-display text-xl font-bold mb-4">Specifications</h2>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(product.specs || {}).map(([k, v]) => (
                <tr key={k} className="border-b border-hairline/10">
                  <td className="py-2 text-ink/50">{k}</td>
                  <td className="py-2 text-right font-medium">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-14">
        <h2 className="font-display text-xl font-bold mb-4">Reviews</h2>
        <div className="space-y-4 mb-8">
          {reviews?.content?.length ? reviews.content.map((r: Review) => (
            <div key={r.id} className="glass rounded-card p-4 border border-hairline/10">
              <div className="flex items-center gap-2">
                <Rating value={r.rating} size={14} />
                {r.verifiedPurchase && <span className="text-[10px] text-plum">Verified Purchase</span>}
              </div>
              <p className="font-medium mt-1">{r.title}</p>
              <p className="text-sm text-ink/60 mt-1">{r.body}</p>
              <p className="text-xs text-ink/30 mt-2">— {r.userName}</p>
            </div>
          )) : <p className="text-ink/40 text-sm">No reviews yet. Be the first to review this product.</p>}
        </div>

        {accessToken ? (
          <form onSubmit={submitReview} className="glass rounded-card p-5 border border-hairline/10 space-y-3 max-w-lg">
            <h3 className="font-semibold">Write a review</h3>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                  <Star className={`h-5 w-5 ${n <= reviewForm.rating ? 'fill-coral text-coral' : 'text-ink/20'}`} />
                </button>
              ))}
            </div>
            <input value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Title" className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
            <textarea value={reviewForm.body} onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Share your experience..." className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" rows={3} />
            <button type="submit" className="rounded-full bg-coral text-onaccent px-5 py-2 text-sm font-semibold">Submit Review</button>
            {reviewMsg && <p className="text-xs text-plum">{reviewMsg}</p>}
          </form>
        ) : (
          <p className="text-sm text-ink/40"><Link to="/login" className="text-coral">Log in</Link> to write a review.</p>
        )}
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-xl font-bold mb-4">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}
