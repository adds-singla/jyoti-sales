import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../../lib/api'
import { Coupon, Banner } from '../../types'
import { Plus, Trash2 } from 'lucide-react'

export default function AdminOffers() {
  const qc = useQueryClient()
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'FLAT', discountValue: '', minOrderValue: '', usageLimit: '' })
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '' })
  const [error, setError] = useState('')

  const { data: coupons } = useQuery({ queryKey: ['admin-coupons'], queryFn: async () => (await api.get<Coupon[]>('/admin/coupons')).data })
  const { data: banners } = useQuery({ queryKey: ['admin-banners'], queryFn: async () => (await api.get<Banner[]>('/admin/banners')).data })

  async function submitCoupon(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/admin/coupons', {
        code: couponForm.code, discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        minOrderValue: Number(couponForm.minOrderValue || 0),
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
        active: true,
      })
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      setCouponForm({ code: '', discountType: 'FLAT', discountValue: '', minOrderValue: '', usageLimit: '' })
    } catch (err) { setError(apiErrorMessage(err)) }
  }

  async function submitBanner(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/admin/banners', { ...bannerForm, displayOrder: 0, active: true })
      qc.invalidateQueries({ queryKey: ['admin-banners'] })
      setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '' })
    } catch (err) { setError(apiErrorMessage(err)) }
  }

  async function deleteCoupon(id: number) { await api.delete(`/admin/coupons/${id}`); qc.invalidateQueries({ queryKey: ['admin-coupons'] }) }
  async function deleteBanner(id: number) { await api.delete(`/admin/banners/${id}`); qc.invalidateQueries({ queryKey: ['admin-banners'] }) }

  return (
    <div className="space-y-10">
      <h1 className="font-display text-2xl font-bold">Offers & Banners</h1>

      <section>
        <h2 className="font-semibold mb-3">Coupons</h2>
        <form onSubmit={submitCoupon} className="glass rounded-card p-5 border border-hairline/10 mb-4 grid md:grid-cols-5 gap-2 items-end">
          <input required placeholder="CODE" value={couponForm.code} onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
          <select value={couponForm.discountType} onChange={(e) => setCouponForm((f) => ({ ...f, discountType: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm">
            <option value="FLAT">Flat (₹)</option>
            <option value="PERCENT">Percent (%)</option>
          </select>
          <input required type="number" placeholder="Value" value={couponForm.discountValue} onChange={(e) => setCouponForm((f) => ({ ...f, discountValue: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
          <input type="number" placeholder="Min order" value={couponForm.minOrderValue} onChange={(e) => setCouponForm((f) => ({ ...f, minOrderValue: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="flex items-center justify-center gap-1 rounded-full bg-coral text-onaccent px-4 py-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add</button>
        </form>
        <div className="space-y-2">
          {coupons?.map((c) => (
            <div key={c.id} className="glass rounded-card p-3 border border-hairline/10 flex justify-between items-center text-sm">
              <span className="font-mono text-coral">{c.code}</span>
              <span>{c.discountType === 'FLAT' ? `₹${c.discountValue} off` : `${c.discountValue}% off`} · min ₹{c.minOrderValue}</span>
              <button onClick={() => deleteCoupon(c.id)}><Trash2 className="h-4 w-4 text-ink/40 hover:text-red-400" /></button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Banners</h2>
        <form onSubmit={submitBanner} className="glass rounded-card p-5 border border-hairline/10 mb-4 grid md:grid-cols-2 gap-2">
          <input required placeholder="Title" value={bannerForm.title} onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Subtitle" value={bannerForm.subtitle} onChange={(e) => setBannerForm((f) => ({ ...f, subtitle: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
          <input required placeholder="Image URL" value={bannerForm.imageUrl} onChange={(e) => setBannerForm((f) => ({ ...f, imageUrl: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm md:col-span-2" />
          <input placeholder="Link URL (e.g. /products?featured=true)" value={bannerForm.linkUrl} onChange={(e) => setBannerForm((f) => ({ ...f, linkUrl: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm md:col-span-2" />
          <button type="submit" className="md:col-span-2 rounded-full bg-coral text-onaccent font-semibold py-2 flex items-center justify-center gap-1"><Plus className="h-4 w-4" /> Add Banner</button>
        </form>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {banners?.map((b) => (
            <div key={b.id} className="glass rounded-card overflow-hidden border border-hairline/10 relative">
              <img src={b.imageUrl} className="w-full h-28 object-cover" />
              <button onClick={() => deleteBanner(b.id)} className="absolute top-2 right-2 bg-surface/70 rounded-full p-1.5"><Trash2 className="h-3.5 w-3.5" /></button>
              <div className="p-3">
                <p className="font-medium text-sm">{b.title}</p>
                <p className="text-xs text-ink/40">{b.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
