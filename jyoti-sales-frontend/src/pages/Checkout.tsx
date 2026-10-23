import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api, apiErrorMessage } from '../lib/api'
import { Address, User } from '../types'
import { formatINR } from '../lib/format'
import { useCart } from '../lib/useCart'
import { useAuthStore } from '../store/authStore'
import { Banknote, CheckCircle2, XCircle, Plus, MapPin, ShieldCheck, Tag, ChevronDown, X as XIcon } from 'lucide-react'
import Confetti from '../components/Confetti'
import clsx from 'clsx'

type Step = 'address' | 'payment' | 'processing' | 'result'

// Razorpay global type
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; email?: string; contact?: string }
  theme?: { color?: string }
  handler: (response: RazorpayResponse) => void
  modal?: { ondismiss?: () => void }
}
interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}
interface RazorpayInstance { open(): void }

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) { resolve(true); return }
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function Checkout() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { cart } = useCart()
  const { accessToken, fullName } = useAuthStore()
  const [step, setStep] = useState<Step>('address')
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null)
  const [method, setMethod] = useState<'ONLINE' | 'COD'>('ONLINE')
  const [orderId, setOrderId] = useState<number | null>(null)
  const [orderTotal, setOrderTotal] = useState(0)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<null | { code: string; discount: number; label: string }>(null)
  const [couponError, setCouponError] = useState('')
  const [showCouponList, setShowCouponList] = useState(false)

  const [newAddress, setNewAddress] = useState({
    label: 'Home', recipientName: '', phone: '', line1: '',
    line2: '', city: '', state: '', pincode: '', isDefault: true,
  })
  const [showAddressForm, setShowAddressForm] = useState(false)

  const { data: addresses, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get<Address[]>('/addresses')).data,
    enabled: !!accessToken,
  })

  const { data: activeCoupons } = useQuery({
    queryKey: ['active-coupons'],
    queryFn: async () => (await api.get('/coupons/active')).data as any[],
    enabled: !!accessToken,
  })

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<User>('/users/me')).data,
    enabled: !!accessToken,
  })

  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a) => a.isDefault)
      setSelectedAddress(def ? def.id : addresses[0].id)
    }
  }, [addresses])

  function openNewAddressForm() {
    setNewAddress({
      label: 'Home',
      recipientName: user?.fullName || fullName || '',
      phone: user?.phone || '',
      line1: '', line2: '', city: '', state: '', pincode: '',
      isDefault: !addresses?.length,
    })
    setShowAddressForm(true)
  }

  async function saveAddress() {
    if (!newAddress.recipientName.trim()) { setError('Please enter recipient name.'); return }
    if (!newAddress.phone.trim()) { setError('Please enter phone number.'); return }
    if (!newAddress.line1.trim()) { setError('Please enter address line 1.'); return }
    if (!newAddress.city.trim()) { setError('Please enter city.'); return }
    if (!newAddress.state.trim()) { setError('Please enter state.'); return }
    if (!newAddress.pincode.trim()) { setError('Please enter pincode.'); return }
    try {
      setError('')
      const res = await api.post('/addresses', newAddress)
      await refetchAddresses()
      setSelectedAddress(res.data.id)
      setShowAddressForm(false)
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  }

  function calcDiscount(c: any, subtotal: number): number {
    if (!c) return 0
    if (subtotal < (c.minOrderValue ?? 0)) return 0
    if (c.discountType === 'FLAT') return Math.min(c.discountValue, subtotal)
    return parseFloat((subtotal * c.discountValue / 100).toFixed(2))
  }

  function applyCoupon(c: any) {
    setCouponError('')
    const subtotal = cart.total
    if (subtotal < (c.minOrderValue ?? 0)) {
      setCouponError(`Minimum order value ₹${c.minOrderValue} required for this coupon.`)
      return
    }
    const discount = calcDiscount(c, subtotal)
    const label = c.discountType === 'FLAT' ? `₹${c.discountValue} off` : `${c.discountValue}% off`
    setAppliedCoupon({ code: c.code, discount, label })
    setCouponCode(c.code)
    setShowCouponList(false)
    setCouponError('')
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  function applyManualCoupon() {
    if (!couponCode.trim()) return
    const match = activeCoupons?.find((c: any) => c.code.toLowerCase() === couponCode.trim().toLowerCase())
    if (!match) { setCouponError('Invalid or expired coupon code.'); return }
    applyCoupon(match)
  }

  const discountedTotal = appliedCoupon ? Math.max(0, cart.total - appliedCoupon.discount) : cart.total

  async function placeOrder() {
    setError('')
    if (!selectedAddress) { setError('Please select or add a delivery address.'); return }
    try {
      const res = await api.post('/orders/checkout', { addressId: selectedAddress, couponCode: appliedCoupon?.code || null })
      setOrderId(res.data.id)
      setOrderTotal(res.data.total)
      setStep('payment')
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  }

  // ── COD placement ────────────────────────────────────────────────────────
  async function handleCOD() {
    if (!orderId) return
    setStep('processing')
    try {
      await api.post('/payments/initiate', { orderId, method: 'COD' })
      qc.invalidateQueries({ queryKey: ['cart'] })
      setResult({ success: true, message: 'Order placed! Pay cash on delivery.' })
    } catch (e) {
      setResult({ success: false, message: apiErrorMessage(e) })
    }
    setStep('result')
  }

  // ── Razorpay online payment ──────────────────────────────────────────────
  async function handleRazorpay() {
    if (!orderId) return
    setStep('processing')

    const loaded = await loadRazorpayScript()
    if (!loaded || !window.Razorpay) {
      setResult({ success: false, message: 'Failed to load Razorpay. Check your internet connection.' })
      setStep('result')
      return
    }

    try {
      // Step 1: Create Razorpay order on backend
      const { data } = await api.post('/payments/initiate', { orderId, method: 'CARD' })

      if (!data.razorpayOrderId || !data.razorpayKeyId) {
        setResult({ success: false, message: 'Could not create payment order. Please try again.' })
        setStep('result')
        return
      }

      // Step 2: Open Razorpay modal
      setStep('processing') // keep spinner behind the modal
      const rzp = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: Math.round(orderTotal * 100), // paise
        currency: 'INR',
        name: 'Jyoti Sales',
        description: `Order #${orderId}`,
        order_id: data.razorpayOrderId,
        prefill: {
          name: user?.fullName || fullName || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#F2A65A' },
        handler: async (response: RazorpayResponse) => {
          // Step 3: Verify signature on backend
          try {
            await api.post('/payments/razorpay/verify', {
              paymentId: data.paymentId,
              razorpayOrderId:  response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            qc.invalidateQueries({ queryKey: ['cart'] })
            setResult({ success: true, message: 'Payment successful! Your order is confirmed.' })
          } catch (e) {
            setResult({ success: false, message: 'Payment captured but verification failed. Please contact support.' })
          }
          setStep('result')
        },
        modal: {
          ondismiss: () => {
            // User closed the modal without paying
            setResult({ success: false, message: 'Payment cancelled. Your order is saved — try again anytime.' })
            setStep('result')
          },
        },
      })

      rzp.open()
    } catch (e) {
      setResult({ success: false, message: apiErrorMessage(e) })
      setStep('result')
    }
  }

  if (!cart || cart.items.length === 0) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-ink/50">Your cart is empty.</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-2xl font-bold mb-2">Checkout</h1>

      {/* Step indicator */}
      <div className="flex gap-2 text-xs text-ink/40 mb-8">
        {(['address', 'payment', 'result'] as const).map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            {i > 0 && <span>→</span>}
            <span className={step === s ? 'text-coral font-semibold' : ''}>
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </span>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* ── Step 1: Address ── */}
      {step === 'address' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-ink/60">
            <MapPin className="h-4 w-4" /> Select Delivery Address
          </h2>

          {addresses?.map((a) => (
            <label
              key={a.id}
              className={clsx(
                'block glass rounded-card p-4 border cursor-pointer transition-all',
                selectedAddress === a.id
                  ? 'border-coral shadow-[0_0_12px_rgba(242,166,90,0.1)]'
                  : 'border-hairline/10 hover:border-hairline/30',
              )}
            >
              <div className="flex items-start gap-3">
                <input type="radio" name="address" className="mt-1 accent-[hsl(var(--coral))]"
                  checked={selectedAddress === a.id} onChange={() => setSelectedAddress(a.id)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.label}</span>
                    {a.isDefault && (
                      <span className="text-[10px] bg-coral/15 text-coral px-2 py-0.5 rounded-full font-semibold">Default</span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{a.recipientName} · {a.phone}</p>
                  <p className="text-sm text-ink/50 mt-0.5">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                  </p>
                </div>
              </div>
            </label>
          ))}

          {!showAddressForm ? (
            <button onClick={openNewAddressForm}
              className="flex items-center gap-2 text-sm text-coral hover:text-coral/80 transition-colors">
              <Plus className="h-4 w-4" /> Add new address
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass rounded-card p-5 border border-coral/20 space-y-3">
              <h3 className="font-semibold text-sm mb-1">New Delivery Address</h3>

              <div>
                <label className="text-xs text-ink/40 mb-1 block">Address Type</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Office', 'Other'].map((lbl) => (
                    <button key={lbl} onClick={() => setNewAddress((f) => ({ ...f, label: lbl }))}
                      className={clsx('px-3 py-1.5 rounded-full text-xs border transition-colors',
                        newAddress.label === lbl ? 'border-coral text-coral bg-coral/10' : 'border-hairline/15 text-ink/50')}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-ink/40 mb-1 block">Recipient Name *</label>
                  <input placeholder="Full name" className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                    value={newAddress.recipientName} onChange={(e) => setNewAddress((f) => ({ ...f, recipientName: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-ink/40 mb-1 block">Phone Number *</label>
                  <input placeholder="10-digit mobile" className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                    value={newAddress.phone} onChange={(e) => setNewAddress((f) => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="text-xs text-ink/40 mb-1 block">Address Line 1 *</label>
                <input placeholder="House no., Building, Street" className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={newAddress.line1} onChange={(e) => setNewAddress((f) => ({ ...f, line1: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-ink/40 mb-1 block">Address Line 2</label>
                <input placeholder="Locality, Landmark (optional)" className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={newAddress.line2} onChange={(e) => setNewAddress((f) => ({ ...f, line2: e.target.value }))} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[['city', 'City *'], ['state', 'State *'], ['pincode', 'Pincode *']].map(([field, lbl]) => (
                  <div key={field}>
                    <label className="text-xs text-ink/40 mb-1 block">{lbl}</label>
                    <input placeholder={lbl.replace(' *', '')}
                      className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                      value={(newAddress as any)[field]}
                      onChange={(e) => setNewAddress((f) => ({ ...f, [field]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 text-sm text-ink/60">
                <input type="checkbox" checked={newAddress.isDefault} className="rounded"
                  onChange={(e) => setNewAddress((f) => ({ ...f, isDefault: e.target.checked }))} />
                Save as default address
              </label>

              <div className="flex gap-2">
                <button onClick={saveAddress}
                  className="rounded-full bg-coral text-white px-5 py-2 text-sm font-semibold hover:shadow-glow transition-shadow">
                  Save Address
                </button>
                <button onClick={() => setShowAddressForm(false)}
                  className="rounded-full border border-hairline/15 px-5 py-2 text-sm text-ink/50 hover:bg-panel transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Coupon Section ── */}
          <div className="glass rounded-card border border-hairline/10 p-4 space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Tag className="h-4 w-4 text-coral" /> Apply Coupon
            </h3>

            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-emerald-400/10 border border-emerald-400/30 rounded-xl px-4 py-3">
                <div>
                  <p className="font-mono font-bold text-emerald-400 text-sm">{appliedCoupon.code}</p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">{appliedCoupon.label} applied — you save {formatINR(appliedCoupon.discount)}</p>
                </div>
                <button onClick={removeCoupon} className="text-emerald-400/60 hover:text-red-400 transition-colors">
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Manual entry + dropdown toggle */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError('') }}
                      onKeyDown={(e) => e.key === 'Enter' && applyManualCoupon()}
                      placeholder="Enter coupon code"
                      className="w-full bg-panel border border-hairline/15 rounded-xl px-3 py-2.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-coral/50 transition-colors pr-10"
                    />
                    <button
                      onClick={() => setShowCouponList((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-coral transition-colors"
                      title="Browse available coupons"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${showCouponList ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <button
                    onClick={applyManualCoupon}
                    disabled={!couponCode.trim()}
                    className="px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-semibold disabled:opacity-40 hover:shadow-glow transition-all"
                  >
                    Apply
                  </button>
                </div>

                {couponError && <p className="text-red-400 text-xs">{couponError}</p>}

                {/* Dropdown list */}
                {showCouponList && (
                  <div className="border border-hairline/15 rounded-xl overflow-hidden bg-panel shadow-xl">
                    {!activeCoupons?.length ? (
                      <p className="text-center text-ink/40 text-sm py-4">No coupons available right now</p>
                    ) : (
                      activeCoupons.map((c: any) => {
                        const eligible = cart.total >= (c.minOrderValue ?? 0)
                        const label = c.discountType === 'FLAT' ? `₹${c.discountValue} off` : `${c.discountValue}% off`
                        return (
                          <button
                            key={c.id}
                            onClick={() => eligible && applyCoupon(c)}
                            disabled={!eligible}
                            className={`w-full flex items-center justify-between px-4 py-3 border-b border-hairline/10 last:border-0 text-left transition-colors ${
                              eligible ? 'hover:bg-coral/5 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-coral/10 rounded-lg px-2.5 py-1.5">
                                <span className="font-mono font-bold text-coral text-xs tracking-widest">{c.code}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold">{label}</p>
                                {c.minOrderValue > 0 && (
                                  <p className="text-[11px] text-ink/40">Min order {formatINR(c.minOrderValue)}{!eligible ? ' — add more items' : ''}</p>
                                )}
                                {c.expiresAt && (
                                  <p className="text-[11px] text-ink/30">
                                    Expires {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  </p>
                                )}
                              </div>
                            </div>
                            {eligible && <span className="text-xs text-coral font-semibold shrink-0">Tap to apply</span>}
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order total preview */}
          {appliedCoupon && (
            <div className="glass rounded-xl border border-hairline/10 px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span><span>{formatINR(cart.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Coupon ({appliedCoupon.code})</span><span>−{formatINR(appliedCoupon.discount)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-hairline/10 pt-1.5 mt-1.5">
                <span>Total</span><span className="text-coral">{formatINR(discountedTotal)}</span>
              </div>
            </div>
          )}

          <button onClick={placeOrder}
            className="w-full rounded-full bg-coral text-white font-semibold py-3 mt-4 hover:shadow-glow transition-shadow">
            Continue to Payment · {formatINR(discountedTotal)}
          </button>
        </div>
      )}

      {/* ── Step 2: Payment method ── */}
      {step === 'payment' && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Order summary strip */}
            <div className="glass rounded-card p-4 border border-hairline/10 flex justify-between items-center">
              <span className="text-sm text-ink/60">Order Total</span>
              <span className="font-bold text-lg text-coral">{formatINR(orderTotal)}</span>
            </div>

            {/* Method cards */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMethod('ONLINE')}
                className={clsx(
                  'flex flex-col items-center gap-2 rounded-2xl py-6 border-2 transition-all',
                  method === 'ONLINE'
                    ? 'border-coral bg-coral/10 shadow-[0_0_20px_rgba(242,166,90,0.15)]'
                    : 'border-hairline/15 hover:border-hairline/30',
                )}
              >
                <ShieldCheck className={clsx('h-7 w-7', method === 'ONLINE' ? 'text-coral' : 'text-ink/40')} />
                <div className="text-center">
                  <p className="font-semibold text-sm">Pay Online</p>
                  <p className="text-[11px] text-ink/40 mt-0.5">Card · UPI · Net Banking · Wallet</p>
                </div>
              </button>

              <button
                onClick={() => setMethod('COD')}
                className={clsx(
                  'flex flex-col items-center gap-2 rounded-2xl py-6 border-2 transition-all',
                  method === 'COD'
                    ? 'border-coral bg-coral/10 shadow-[0_0_20px_rgba(242,166,90,0.15)]'
                    : 'border-hairline/15 hover:border-hairline/30',
                )}
              >
                <Banknote className={clsx('h-7 w-7', method === 'COD' ? 'text-coral' : 'text-ink/40')} />
                <div className="text-center">
                  <p className="font-semibold text-sm">Cash on Delivery</p>
                  <p className="text-[11px] text-ink/40 mt-0.5">Pay when you receive</p>
                </div>
              </button>
            </div>

            {/* Razorpay trust badges */}
            {method === 'ONLINE' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-xs text-ink/40 bg-panel border border-hairline/10 rounded-xl px-4 py-3">
                <ShieldCheck className="h-4 w-4 text-green-400 shrink-0" />
                Secured by Razorpay · 256-bit SSL · Supports UPI, Cards, Net Banking & Wallets
              </motion.div>
            )}

            {method === 'COD' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-sm text-ink/60 bg-panel border border-hairline/10 rounded-xl px-4 py-3">
                Pay with cash when your order arrives at your doorstep. No extra charges.
              </motion.div>
            )}

            {/* CTA */}
            <button
              onClick={method === 'COD' ? handleCOD : handleRazorpay}
              className="w-full rounded-full bg-coral text-white font-semibold py-3.5 hover:shadow-glow transition-shadow text-base"
            >
              {method === 'COD' ? 'Place Order (COD)' : `Pay ${formatINR(orderTotal)} Securely`}
            </button>

            <p className="text-center text-xs text-ink/30">
              By continuing, you agree to our Terms of Service
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ── Processing spinner ── */}
      {step === 'processing' && (
        <div className="text-center py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="h-10 w-10 border-4 border-coral border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-ink/60">Processing your payment…</p>
        </div>
      )}

      {/* ── Result ── */}
      {step === 'result' && result && (
        <div className="relative text-center py-16">
          {result.success && <Confetti />}
          {result.success ? (
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          )}
          <h2 className="font-display text-xl font-bold mb-2">
            {result.success ? 'Order Confirmed! 🎉' : 'Payment Failed'}
          </h2>
          <p className="text-ink/60 mb-6 max-w-sm mx-auto">{result.message}</p>
          <div className="flex gap-3 justify-center">
            {result.success ? (
              <button onClick={() => navigate('/profile')}
                className="rounded-full bg-coral text-white px-6 py-3 font-semibold hover:shadow-glow transition-shadow">
                View My Orders
              </button>
            ) : (
              <>
                <button onClick={() => setStep('payment')}
                  className="rounded-full bg-coral text-white px-6 py-3 font-semibold hover:shadow-glow transition-shadow">
                  Try Again
                </button>
                <button onClick={() => navigate('/')}
                  className="rounded-full border border-hairline/20 px-6 py-3 text-sm text-ink/60">
                  Continue Shopping
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
