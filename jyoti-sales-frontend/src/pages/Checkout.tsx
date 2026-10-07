import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { api, apiErrorMessage } from '../lib/api'
import { Address, User } from '../types'
import { formatINR } from '../lib/format'
import { useCart } from '../lib/useCart'
import { useAuthStore } from '../store/authStore'
import { CreditCard, Smartphone, Landmark, Banknote, ShieldAlert, CheckCircle2, XCircle, Plus, MapPin } from 'lucide-react'
import Confetti from '../components/Confetti'
import clsx from 'clsx'

type Method = 'CARD' | 'UPI' | 'NET_BANKING' | 'COD'
type Step = 'address' | 'payment' | 'processing' | 'result'

export default function Checkout() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { cart } = useCart()
  const { accessToken, fullName } = useAuthStore()
  const [step, setStep] = useState<Step>('address')
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null)
  const [method, setMethod] = useState<Method>('CARD')
  const [orderId, setOrderId] = useState<number | null>(null)
  const [orderTotal, setOrderTotal] = useState(0)
  const [result, setResult] = useState<{ success: boolean; message: string; orderNumber?: string } | null>(null)
  const [error, setError] = useState('')

  const [newAddress, setNewAddress] = useState({ label: 'Home', recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: true })
  const [showAddressForm, setShowAddressForm] = useState(false)

  const { data: addresses, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get<Address[]>('/addresses')).data,
    enabled: !!accessToken,
  })

  // Fetch user profile to auto-fill name & phone
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<User>('/users/me')).data,
    enabled: !!accessToken,
  })

  // Auto-select default address
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddress) {
      const def = addresses.find((a) => a.isDefault)
      setSelectedAddress(def ? def.id : addresses[0].id)
    }
  }, [addresses])

  // payment form state
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' })
  const [upiId, setUpiId] = useState('')
  const [bankCode, setBankCode] = useState('HDFC')
  const [flipped, setFlipped] = useState(false)
  const dragX = useMotionValue(0)
  const [swiped, setSwiped] = useState(false)

  function openNewAddressForm() {
    // Auto-fill name & phone from user profile
    setNewAddress({
      label: 'Home',
      recipientName: user?.fullName || fullName || '',
      phone: user?.phone || '',
      line1: '', line2: '', city: '', state: '', pincode: '',
      isDefault: !addresses?.length, // default if no other addresses
    })
    setShowAddressForm(true)
  }

  async function saveAddress() {
    // Validation
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

  async function placeOrder() {
    setError('')
    if (!selectedAddress) { setError('Please select or add a delivery address.'); return }
    try {
      const res = await api.post('/orders/checkout', { addressId: selectedAddress })
      setOrderId(res.data.id)
      setOrderTotal(res.data.total)
      setStep('payment')
    } catch (e) {
      setError(apiErrorMessage(e))
    }
  }

  async function submitPayment() {
    if (!orderId) return
    setStep('processing')
    setError('')
    try {
      const payload: any = { orderId, method }
      if (method === 'CARD') {
        payload.cardNumber = card.number.replace(/\s/g, '')
        payload.cardExpiry = card.expiry
        payload.cardCvv = card.cvv
      } else if (method === 'UPI') {
        payload.upiId = upiId
      } else if (method === 'NET_BANKING') {
        payload.bankCode = bankCode
      }
      const res = await api.post('/payments/initiate', payload)
      qc.invalidateQueries({ queryKey: ['cart'] })
      if (res.data.status === 'SUCCESS') {
        setResult({ success: true, message: 'Payment successful! Your order is confirmed.' })
      } else if (res.data.status === 'INITIATED' && method === 'COD') {
        setResult({ success: true, message: 'Order placed! Pay cash on delivery.' })
      } else {
        setResult({ success: false, message: res.data.failureReason || 'Payment failed. Please try another method.' })
      }
      setStep('result')
    } catch (e) {
      setResult({ success: false, message: apiErrorMessage(e) })
      setStep('result')
    }
  }

  function handleDragEnd() {
    if (dragX.get() > 180) {
      setSwiped(true)
      submitPayment()
    } else {
      dragX.set(0)
    }
  }

  if (!cart || cart.items.length === 0) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-ink/50">Your cart is empty.</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-2xl font-bold mb-2">Checkout</h1>
      <div className="flex gap-2 text-xs text-ink/40 mb-8">
        <span className={step === 'address' ? 'text-coral' : ''}>1. Address</span> →
        <span className={step === 'payment' ? 'text-coral' : ''}>2. Payment</span> →
        <span className={step === 'result' ? 'text-coral' : ''}>3. Confirmation</span>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {step === 'address' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-ink/60">
            <MapPin className="h-4 w-4" /> Select Delivery Address
          </h2>

          {/* Saved addresses */}
          {addresses?.map((a) => (
            <label
              key={a.id}
              className={clsx(
                'block glass rounded-card p-4 border cursor-pointer transition-all',
                selectedAddress === a.id ? 'border-coral shadow-[0_0_12px_rgba(242,166,90,0.1)]' : 'border-hairline/10 hover:border-hairline/30'
              )}
            >
              <div className="flex items-start gap-3">
                <input type="radio" name="address" className="mt-1 accent-[hsl(var(--coral))]" checked={selectedAddress === a.id} onChange={() => setSelectedAddress(a.id)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.label}</span>
                    {a.isDefault && (
                      <span className="text-[10px] bg-coral/15 text-coral px-2 py-0.5 rounded-full font-semibold">Default</span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{a.recipientName} · {a.phone}</p>
                  <p className="text-sm text-ink/50 mt-0.5">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}</p>
                </div>
              </div>
            </label>
          ))}

          {/* Add new address */}
          {!showAddressForm ? (
            <button onClick={openNewAddressForm} className="flex items-center gap-2 text-sm text-coral hover:text-coral/80 transition-colors">
              <Plus className="h-4 w-4" /> Add new address
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-card p-5 border border-coral/20 space-y-3"
            >
              <h3 className="font-semibold text-sm mb-1">New Delivery Address</h3>

              {/* Label selector */}
              <div>
                <label className="text-xs text-ink/40 mb-1 block">Address Type</label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Office', 'Other'].map((lbl) => (
                    <button
                      key={lbl}
                      onClick={() => setNewAddress((f) => ({ ...f, label: lbl }))}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-xs border transition-colors',
                        newAddress.label === lbl ? 'border-coral text-coral bg-coral/10' : 'border-hairline/15 text-ink/50'
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-ink/40 mb-1 block">Recipient Name *</label>
                  <input
                    placeholder="Full name"
                    className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                    value={newAddress.recipientName}
                    onChange={(e) => setNewAddress((f) => ({ ...f, recipientName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink/40 mb-1 block">Phone Number *</label>
                  <input
                    placeholder="10-digit mobile"
                    className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
              </div>

              {/* Address lines */}
              <div>
                <label className="text-xs text-ink/40 mb-1 block">Address Line 1 *</label>
                <input
                  placeholder="House no., Building, Street"
                  className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={newAddress.line1}
                  onChange={(e) => setNewAddress((f) => ({ ...f, line1: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-ink/40 mb-1 block">Address Line 2</label>
                <input
                  placeholder="Locality, Landmark (optional)"
                  className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={newAddress.line2}
                  onChange={(e) => setNewAddress((f) => ({ ...f, line2: e.target.value }))}
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-ink/40 mb-1 block">City *</label>
                  <input
                    placeholder="City"
                    className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink/40 mb-1 block">State *</label>
                  <input
                    placeholder="State"
                    className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                    value={newAddress.state}
                    onChange={(e) => setNewAddress((f) => ({ ...f, state: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-ink/40 mb-1 block">Pincode *</label>
                  <input
                    placeholder="6-digit"
                    className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress((f) => ({ ...f, pincode: e.target.value }))}
                  />
                </div>
              </div>

              {/* Save as default */}
              <label className="flex items-center gap-2 text-sm text-ink/60">
                <input
                  type="checkbox"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded"
                />
                Save as default address for future orders
              </label>

              <div className="flex gap-2">
                <button onClick={saveAddress} className="rounded-full bg-coral text-onaccent px-5 py-2 text-sm font-semibold hover:shadow-glow transition-shadow">
                  Save Address
                </button>
                <button onClick={() => setShowAddressForm(false)} className="rounded-full border border-hairline/15 px-5 py-2 text-sm text-ink/50 hover:bg-panel transition-colors">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          <button onClick={placeOrder} className="w-full rounded-full bg-coral text-onaccent font-semibold py-3 mt-4 hover:shadow-glow transition-shadow">
            Continue to Payment · {formatINR(cart.total)}
          </button>
        </div>
      )}

      {step === 'payment' && (
        <div>
          <div className="flex items-center gap-2 mb-4 text-xs text-coral bg-coral/10 border border-coral/30 rounded-lg px-3 py-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Sandbox / Test Mode — no real money is charged. This is a dummy payment gateway seeded for demo purposes.
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { id: 'CARD', label: 'Card', icon: CreditCard },
              { id: 'UPI', label: 'UPI', icon: Smartphone },
              { id: 'NET_BANKING', label: 'Net Banking', icon: Landmark },
              { id: 'COD', label: 'COD', icon: Banknote },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setMethod(id as Method)}
                className={`flex flex-col items-center gap-1 rounded-card py-3 border text-xs ${method === id ? 'border-coral text-coral bg-coral/10' : 'border-hairline/15 text-ink/60'}`}>
                <Icon className="h-5 w-5" /> {label}
              </button>
            ))}
          </div>

          {method === 'CARD' && (
            <div className="space-y-4">
              <div className="[perspective:1000px] mx-auto max-w-sm h-52">
                <motion.div
                  className="relative w-full h-full [transform-style:preserve-3d]"
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl bg-gradient-to-br from-panel to-surface2 border border-hairline/15 p-5 flex flex-col justify-between shadow-glow">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-ink/40">Jyoti Sales Test Card</span>
                      <span className="text-[10px] bg-coral/20 text-coral px-2 py-0.5 rounded-full">TEST MODE</span>
                    </div>
                    <p className="font-mono text-lg tracking-widest">{card.number || '•••• •••• •••• ••••'}</p>
                    <div className="flex justify-between text-xs text-ink/50">
                      <span>{card.expiry || 'MM/YY'}</span>
                      <span>{detectCardType(card.number)}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl bg-gradient-to-br from-panel to-surface2 border border-hairline/15 p-5">
                    <div className="h-10 bg-black/60 mt-2 rounded" />
                    <div className="mt-6 flex justify-end">
                      <div className="bg-white text-black text-sm font-mono px-3 py-1 rounded">{card.cvv || 'CVV'}</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <input
                placeholder="Card Number (try 4111 1111 1111 1111)"
                value={card.number}
                onChange={(e) => setCard((c) => ({ ...c, number: formatCardNumber(e.target.value) }))}
                maxLength={19}
                className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard((c) => ({ ...c, expiry: e.target.value }))}
                  className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm font-mono" />
                <input placeholder="CVV" value={card.cvv} onFocus={() => setFlipped(true)} onBlur={() => setFlipped(false)}
                  onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                  className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm font-mono" maxLength={3} />
              </div>
              <p className="text-[11px] text-ink/30">Test cards: •••1111 → success · •••0002 → declined · any other valid Luhn number → success</p>

              <button onClick={submitPayment} className="w-full rounded-full bg-coral text-onaccent font-semibold py-3 hover:shadow-glow transition-shadow">
                Pay {formatINR(orderTotal)}
              </button>
            </div>
          )}

          {method === 'UPI' && (
            <div className="space-y-4">
              <input placeholder="yourname@upi (try success@upi or failure@upi)" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
              <div className="glass rounded-card p-6 flex flex-col items-center gap-2 border border-hairline/10">
                <div className="h-32 w-32 bg-white rounded-lg flex items-center justify-center text-onaccent text-xs font-mono">MOCK QR</div>
                <p className="text-xs text-ink/40">Simulated UPI QR — scan is not required in test mode</p>
              </div>
              <button onClick={submitPayment} className="w-full rounded-full bg-coral text-onaccent font-semibold py-3 hover:shadow-glow transition-shadow">
                Pay {formatINR(orderTotal)}
              </button>
            </div>
          )}

          {method === 'NET_BANKING' && (
            <div className="space-y-4">
              <select value={bankCode} onChange={(e) => setBankCode(e.target.value)}
                className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm">
                <option value="HDFC">HDFC Bank</option>
                <option value="SBI">State Bank of India</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="FAILBANK">FAILBANK (test decline)</option>
              </select>
              <button onClick={submitPayment} className="w-full rounded-full bg-coral text-onaccent font-semibold py-3 hover:shadow-glow transition-shadow">
                Pay {formatINR(orderTotal)}
              </button>
            </div>
          )}

          {method === 'COD' && (
            <div className="space-y-4">
              <p className="text-sm text-ink/60">Pay with cash when your order is delivered.</p>
              <div className="relative h-14 rounded-full bg-panel border border-hairline/15 overflow-hidden select-none">
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 220 }}
                  dragElastic={0.1}
                  style={{ x: dragX }}
                  onDragEnd={handleDragEnd}
                  className="absolute top-1 left-1 h-12 w-12 rounded-full bg-coral flex items-center justify-center text-onaccent font-bold cursor-grab active:cursor-grabbing"
                >
                  →
                </motion.div>
                <p className="absolute inset-0 flex items-center justify-center text-sm text-ink/40">
                  {swiped ? 'Processing…' : 'Swipe to place order (simulated)'}
                </p>
              </div>
              <button onClick={submitPayment} className="w-full rounded-full border border-hairline/20 py-2 text-sm text-ink/60">
                Or tap to place order
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-24">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="h-10 w-10 border-4 border-coral border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-ink/60">Processing payment via dummy gateway (test mode)...</p>
        </div>
      )}

      {step === 'result' && result && (
        <div className="relative text-center py-16">
          {result.success && <Confetti />}
          {result.success ? (
            <CheckCircle2 className="h-16 w-16 text-plum mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          )}
          <h2 className="font-display text-xl font-bold mb-2">{result.success ? 'Order Confirmed!' : 'Payment Failed'}</h2>
          <p className="text-ink/60 mb-6">{result.message}</p>
          <div className="flex gap-3 justify-center">
            {result.success ? (
              <button onClick={() => navigate('/profile')} className="rounded-full bg-coral text-onaccent px-6 py-3 font-semibold">
                View My Orders
              </button>
            ) : (
              <button onClick={() => setStep('payment')} className="rounded-full bg-coral text-onaccent px-6 py-3 font-semibold">
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatCardNumber(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function detectCardType(number: string) {
  const digits = number.replace(/\s/g, '')
  if (digits.startsWith('4')) return 'VISA'
  if (/^5[1-5]/.test(digits)) return 'MASTERCARD'
  if (/^3[47]/.test(digits)) return 'AMEX'
  if (digits.startsWith('6')) return 'RUPAY'
  return ''
}
