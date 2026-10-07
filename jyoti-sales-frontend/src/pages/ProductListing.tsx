import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Product, Category } from '../types'
import ProductCard from '../components/ProductCard'
import SkeletonCard from '../components/SkeletonCard'
import { SlidersHorizontal } from 'lucide-react'

export default function ProductListing() {
  const [params, setParams] = useSearchParams()
  const { slug: categorySlug } = useParams()
  const [showFilters, setShowFilters] = useState(false)

  const q = params.get('q') || ''
  const brand = params.get('brand') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const minRating = params.get('minRating') || ''
  const sortBy = params.get('sortBy') || 'createdAt'
  const sortDir = params.get('sortDir') || 'desc'
  const page = parseInt(params.get('page') || '0')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  })

  const categoryIdFromSlug = categorySlug
    ? categories?.flatMap((c) => [c, ...c.subcategories]).find((c) => c.slug === categorySlug)?.id
    : undefined
  const categoryId = categoryIdFromSlug ? String(categoryIdFromSlug) : params.get('categoryId') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['products', q, categoryId, brand, minPrice, maxPrice, minRating, sortBy, sortDir, page],
    queryFn: async () =>
      (
        await api.get('/products', {
          params: {
            q: q || undefined,
            categoryId: categoryId || undefined,
            brand: brand || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            minRating: minRating || undefined,
            sortBy,
            sortDir,
            page,
            size: 12,
          },
        })
      ).data,
  })

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const brands = ['LG', 'Samsung', 'Sony', 'Whirlpool', 'IFB', 'Voltas', 'Mi', 'Haier', 'Prestige', 'Philips', 'Bajaj', 'JBL', 'Symphony']

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">
          {q ? `Results for "${q}"` : 'All Products'}
        </h1>
        <button onClick={() => setShowFilters((v) => !v)} className="md:hidden flex items-center gap-1 text-sm border border-hairline/15 rounded-full px-3 py-1.5">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        <aside className={`space-y-6 ${showFilters ? 'block' : 'hidden'} md:block`}>
          <div>
            <h3 className="font-semibold text-sm mb-2">Category</h3>
            <div className="space-y-1 text-sm">
              <button onClick={() => updateParam('categoryId', '')} className={`block ${!categoryId ? 'text-coral' : 'text-ink/60'}`}>All</button>
              {categories?.map((c) => (
                <button key={c.id} onClick={() => updateParam('categoryId', String(c.id))}
                  className={`block ${categoryId === String(c.id) ? 'text-coral' : 'text-ink/60'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Brand</h3>
            <select value={brand} onChange={(e) => updateParam('brand', e.target.value)}
              className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm">
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Price Range</h3>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => updateParam('minPrice', e.target.value)}
                className="w-1/2 bg-panel border border-hairline/15 rounded-lg px-2 py-1.5 text-sm" />
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => updateParam('maxPrice', e.target.value)}
                className="w-1/2 bg-panel border border-hairline/15 rounded-lg px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-2">Minimum Rating</h3>
            <select value={minRating} onChange={(e) => updateParam('minRating', e.target.value)}
              className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm">
              <option value="">Any</option>
              <option value="4">4★ & up</option>
              <option value="3">3★ & up</option>
            </select>
          </div>
        </aside>

        <div>
          <div className="flex justify-end mb-4">
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split(':')
                const next = new URLSearchParams(params)
                next.set('sortBy', sb); next.set('sortDir', sd); next.delete('page')
                setParams(next)
              }}
              className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
            >
              <option value="createdAt:desc">Newest</option>
              <option value="price:asc">Price: Low to High</option>
              <option value="price:desc">Price: High to Low</option>
              <option value="ratingAverage:desc">Top Rated</option>
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoading
              ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
              : data?.content?.map((p: Product) => <ProductCard key={p.id} product={p} />)}
          </div>

          {data?.content?.length === 0 && (
            <p className="text-center text-ink/50 py-16">No products found. Try adjusting your filters.</p>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: data.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => { const next = new URLSearchParams(params); next.set('page', String(i)); setParams(next) }}
                  className={`h-8 w-8 rounded-full text-sm ${i === page ? 'bg-coral text-onaccent' : 'bg-panel text-ink/60'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
