import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Banner } from '../types'
import { Link } from 'react-router-dom'
import { Tag } from 'lucide-react'

export default function Offers() {
  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => (await api.get<Banner[]>('/banners')).data,
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">Offers & Coupons</h1>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {banners?.map((b) => (
          <Link key={b.id} to={b.linkUrl || '/products'} className="relative rounded-card overflow-hidden border border-hairline/10 group">
            <img src={b.imageUrl} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-surface/90 to-transparent flex flex-col justify-end p-5">
              <h3 className="font-display text-xl font-bold">{b.title}</h3>
              {b.subtitle && <p className="text-sm text-ink/70">{b.subtitle}</p>}
            </div>
          </Link>
        ))}
      </div>

      <div className="glass rounded-card p-6 border border-hairline/10">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-coral" /> Active Coupon Codes</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-hairline/10 pb-2">
            <span className="font-mono text-coral">WELCOME500</span>
            <span className="text-ink/50">₹500 off on orders above ₹5,000</span>
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-coral">DIWALI10</span>
            <span className="text-ink/50">10% off on orders above ₹10,000</span>
          </div>
        </div>
        <p className="text-xs text-ink/30 mt-4">Apply codes at checkout. See admin panel for live coupon management.</p>
      </div>
    </div>
  )
}
