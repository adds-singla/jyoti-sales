import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { api } from '../lib/api'
import { Product, Review } from '../types'
import { formatINR, estimateEmi } from '../lib/format'
import { useCart } from '../lib/useCart'
import { useAuthStore } from '../store/authStore'
import Rating from '../components/Rating'
import ProductCard from '../components/ProductCard'
import { ShieldCheck, Truck, Undo2, Star, Heart } from 'lucide-react'
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

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get<Product>(`/products/slug/${slug}`)).data,
  })

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
    await addToCart(product, qty, selectedVariant)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/reviews', { productId: product.id, ...reviewForm })
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
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-card overflow-hidden glass border border-hairline/10">
            <img ref={galleryImgRef} src={product.imageUrls[activeImage] || product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2 mt-3">
            {product.imageUrls.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)}
                className={`h-16 w-16 rounded-lg overflow-hidden border-2 ${i === activeImage ? 'border-coral' : 'border-hairline/15'}`}>
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

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
