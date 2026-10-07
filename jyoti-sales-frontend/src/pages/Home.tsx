import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { Product, Category, Banner } from '../types'
import ProductCard from '../components/ProductCard'
import SkeletonCard from '../components/SkeletonCard'
import { ShieldCheck, Truck, CreditCard, Headphones } from 'lucide-react'
import { BUSINESS } from '../lib/business'
import Reveal from '../components/Reveal'

export default function Home() {
  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => (await api.get<Banner[]>('/banners')).data,
  })
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  })
  const { data: featured, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: async () => (await api.get('/products', { params: { featured: true, size: 8 } })).data.content as Product[],
  })
  const { data: latest } = useQuery({
    queryKey: ['products', 'latest'],
    queryFn: async () => (await api.get('/products', { params: { size: 8, sortBy: 'createdAt', sortDir: 'desc' } })).data.content as Product[],
  })

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient border-b border-hairline/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-plum font-medium text-sm tracking-wide uppercase mb-3">{BUSINESS.tagline}</p>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight max-w-3xl">
              Premium electronics, <span className="text-gradient">honest prices.</span>
            </h1>
            <p className="text-ink/60 mt-4 max-w-xl">
              TVs, ACs, refrigerators & more from {BUSINESS.brands.slice(0, 4).join(', ')} and other trusted brands —
              in-store in Rampura Phul and now online.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/products" className="rounded-full bg-coral text-onaccent px-6 py-3 font-semibold hover:shadow-glow transition-shadow">
                Shop Now
              </Link>
              <Link to="/offers" className="rounded-full border border-hairline/20 px-6 py-3 font-semibold hover:border-plum/50 hover:text-plum transition-colors">
                View Offers
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Banner carousel (simple stacked banners) */}
      {banners && banners.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-2 gap-6">
          {banners.map((b) => (
            <Link key={b.id} to={b.linkUrl || '/products'} className="relative rounded-card overflow-hidden group border border-hairline/10">
              <img src={b.imageUrl} alt={b.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent flex flex-col justify-end p-5">
                <h3 className="font-display text-xl font-bold">{b.title}</h3>
                {b.subtitle && <p className="text-sm text-ink/70">{b.subtitle}</p>}
              </div>
            </Link>
          ))}
        </section>
      )}

      {/* Trust strip */}
      <section className="border-y border-hairline/10 bg-surface2/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: ShieldCheck, label: 'Genuine Products, Full Warranty' },
            { icon: Truck, label: 'Fast Local Delivery' },
            { icon: CreditCard, label: 'Easy EMI Options' },
            { icon: Headphones, label: 'Friendly After-Sales Support' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="h-6 w-6 text-coral" />
              <p className="text-xs text-ink/60">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Category grid */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <Reveal>
            <h2 className="font-display text-2xl font-bold mb-6">Shop by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/products?categoryId=${c.id}`}
                  className="glass rounded-card p-6 text-center hover:border-coral/40 border border-transparent transition-colors"
                >
                  <p className="font-medium text-sm">{c.name}</p>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Featured deals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Reveal>
          <h2 className="font-display text-2xl font-bold mb-6">Featured Deals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : featured?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </Reveal>
      </section>

      {/* Latest arrivals */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <Reveal>
          <h2 className="font-display text-2xl font-bold mb-6">New Arrivals</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {latest?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </Reveal>
      </section>
    </div>
  )
}
