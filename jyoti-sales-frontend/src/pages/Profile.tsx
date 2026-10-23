import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Order, Address, User } from '../types'
import { formatINR } from '../lib/format'
import { useAuthStore } from '../store/authStore'
import { Navigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import {
  Package, MapPin, User as UserIcon, ChevronDown, ChevronUp,
  Clock, CheckCircle2, Truck, Box, Star, XCircle, Plus, Trash2, Edit3, Save, X, Download
} from 'lucide-react'
import InvoiceDownloadButton from '../components/InvoiceDownloadButton'

// ── Status config ──
const TRACKING_STEPS = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const
const statusMeta: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  PENDING: { label: 'Order Placed', icon: Clock, color: 'text-amber-400' },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-400' },
  PACKED: { label: 'Packed', icon: Box, color: 'text-violet-400' },
  SHIPPED: { label: 'Shipped', icon: Truck, color: 'text-cyan-400' },
  DELIVERED: { label: 'Delivered', icon: Star, color: 'text-emerald-400' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-400' },
  REFUNDED: { label: 'Refunded', icon: XCircle, color: 'text-orange-400' },
}

type Tab = 'orders' | 'addresses' | 'account'

export default function Profile() {
  const { accessToken, fullName } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState('')

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const emptyAddress = { label: 'Home', recipientName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false }
  const [addressForm, setAddressForm] = useState(emptyAddress)
  const [addressMsg, setAddressMsg] = useState('')

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<User>('/users/me')).data,
    enabled: !!accessToken,
  })
  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => (await api.get('/orders?size=50')).data.content as Order[],
    enabled: !!accessToken,
  })
  const { data: addresses, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get<Address[]>('/addresses')).data,
    enabled: !!accessToken,
  })

  async function cancelOrder(orderId: number) {
    if (!confirm('Are you sure you want to cancel this order? This cannot be undone.')) return
    setCancellingId(orderId)
    setCancelError('')
    try {
      await api.patch(`/orders/${orderId}/cancel`)
      qc.invalidateQueries({ queryKey: ['my-orders'] })
    } catch (err: any) {
      setCancelError(err?.response?.data?.message || 'Failed to cancel order. Please try again.')
    } finally {
      setCancellingId(null)
    }
  }

  if (!accessToken) return <Navigate to="/login" replace />

  // ── Address handlers ──
  function startEditAddress(a: Address) {
    setAddressForm({
      label: a.label, recipientName: a.recipientName, phone: a.phone,
      line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state,
      pincode: a.pincode, isDefault: a.isDefault,
    })
    setEditingAddressId(a.id)
    setShowAddressForm(true)
    setAddressMsg('')
  }

  function startNewAddress() {
    setAddressForm({ ...emptyAddress, recipientName: fullName || '', phone: user?.phone || '' })
    setEditingAddressId(null)
    setShowAddressForm(true)
    setAddressMsg('')
  }

  async function saveAddress() {
    try {
      if (editingAddressId) {
        await api.put(`/addresses/${editingAddressId}`, addressForm)
      } else {
        await api.post('/addresses', addressForm)
      }
      await refetchAddresses()
      setShowAddressForm(false)
      setAddressMsg(editingAddressId ? 'Address updated!' : 'Address saved!')
      setTimeout(() => setAddressMsg(''), 3000)
    } catch (e) {
      setAddressMsg(apiErrorMessage(e))
    }
  }

  async function deleteAddress(id: number) {
    await api.delete(`/addresses/${id}`)
    refetchAddresses()
  }

  // ── Tracking helper ──
  function getStepIndex(status: string) {
    const idx = TRACKING_STEPS.indexOf(status as any)
    return idx >= 0 ? idx : -1
  }

  const tabs = [
    { id: 'orders' as Tab, label: 'My Orders', icon: Package, count: orders?.length },
    { id: 'addresses' as Tab, label: 'Addresses', icon: MapPin, count: addresses?.length },
    { id: 'account' as Tab, label: 'Account', icon: UserIcon },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">My Account</h1>
        <p className="text-ink/50 text-sm mt-1">{fullName} · {user?.email || user?.phone}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-hairline/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === t.id ? 'border-coral text-coral' : 'border-transparent text-ink/50 hover:text-ink/80'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[10px] bg-panel border border-hairline/15 px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ─── Orders Tab ─── */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders?.length ? orders.map((o) => {
            const isExpanded = expandedOrderId === o.id
            const isCancelled = o.status === 'CANCELLED' || o.status === 'REFUNDED'
            const currentStepIdx = getStepIndex(o.status)
            const meta = statusMeta[o.status] || statusMeta.PENDING
            const StatusIcon = meta.icon

            return (
              <motion.div
                key={o.id}
                layout
                className="glass rounded-card border border-hairline/10 overflow-hidden"
              >
                {/* Order summary row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-panel/30 transition-colors"
                  onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                >
                  <div className={clsx('shrink-0 h-10 w-10 rounded-full flex items-center justify-center', meta.color, 'bg-current/10')}>
                    <StatusIcon className={clsx('h-5 w-5', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{o.orderNumber}</span>
                      <span className={clsx('text-[10px] font-bold uppercase', meta.color)}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-ink/40 mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{o.items.length} item{o.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="font-display font-bold">{formatINR(o.total)}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-ink/30" /> : <ChevronDown className="h-4 w-4 text-ink/30" />}
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-hairline/10 p-4 space-y-5">
                        {/* ── Order Tracking Timeline ── */}
                        {!isCancelled && (
                          <div>
                            <h4 className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-4">Order Tracking</h4>
                            <div className="flex items-start justify-between relative">
                              {/* Progress bar behind the icons */}
                              <div className="absolute top-5 left-5 right-5 h-0.5 bg-hairline/15">
                                <div
                                  className="h-full bg-gradient-to-r from-coral to-plum transition-all duration-500"
                                  style={{ width: `${(currentStepIdx / (TRACKING_STEPS.length - 1)) * 100}%` }}
                                />
                              </div>

                              {TRACKING_STEPS.map((step, idx) => {
                                const s = statusMeta[step]
                                const Icon = s.icon
                                const isDone = idx <= currentStepIdx
                                const isCurrent = idx === currentStepIdx

                                return (
                                  <div key={step} className="flex flex-col items-center z-10 flex-1">
                                    <div className={clsx(
                                      'h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all',
                                      isCurrent
                                        ? 'border-coral bg-coral/20 shadow-[0_0_12px_rgba(242,166,90,0.3)]'
                                        : isDone
                                          ? 'border-emerald-400/50 bg-emerald-400/10'
                                          : 'border-hairline/20 bg-surface'
                                    )}>
                                      <Icon className={clsx('h-4 w-4', isDone ? (isCurrent ? 'text-coral' : 'text-emerald-400') : 'text-ink/20')} />
                                    </div>
                                    <span className={clsx(
                                      'text-[10px] mt-1.5 text-center',
                                      isCurrent ? 'text-coral font-semibold' : isDone ? 'text-ink/60' : 'text-ink/25'
                                    )}>
                                      {s.label}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {isCancelled && (
                          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                            <XCircle className="h-4 w-4" />
                            This order has been {o.status.toLowerCase()}.
                          </div>
                        )}

                        {/* ── Items ── */}
                        <div>
                          <h4 className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2">Items</h4>
                          <div className="space-y-2">
                            {o.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm bg-panel/30 rounded-lg px-3 py-2">
                                <div>
                                  <span className="font-medium">{item.productName}</span>
                                  <span className="text-ink/40 ml-2">× {item.quantity}</span>
                                </div>
                                <span className="font-semibold">{formatINR(item.unitPrice * item.quantity)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── Price breakdown ── */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-panel/30 rounded-lg px-3 py-2">
                            <span className="text-ink/40">Subtotal</span>
                            <p className="font-semibold mt-0.5">{formatINR(o.subtotal)}</p>
                          </div>
                          {o.discount > 0 && (
                            <div className="bg-panel/30 rounded-lg px-3 py-2">
                              <span className="text-ink/40">Discount</span>
                              <p className="font-semibold text-plum mt-0.5">-{formatINR(o.discount)}</p>
                            </div>
                          )}
                          <div className="bg-panel/30 rounded-lg px-3 py-2">
                            <span className="text-ink/40">Shipping</span>
                            <p className="font-semibold mt-0.5">{o.shippingFee > 0 ? formatINR(o.shippingFee) : 'Free'}</p>
                          </div>
                          <div className="bg-panel/30 rounded-lg px-3 py-2">
                            <span className="text-ink/40">Total</span>
                            <p className="font-display font-bold mt-0.5">{formatINR(o.total)}</p>
                          </div>
                        </div>

                        {/* ── Actions: Cancel + Invoice ── */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Cancel button — only for PENDING or CONFIRMED */}
                          {(o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                            <button
                              onClick={() => cancelOrder(o.id)}
                              disabled={cancellingId === o.id}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-400/40 text-red-400 text-xs font-semibold hover:bg-red-400/10 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              {cancellingId === o.id ? 'Cancelling…' : 'Cancel Order'}
                            </button>
                          )}
                          <InvoiceDownloadButton orderId={o.id} orderNumber={o.orderNumber} apiPath="/orders" />
                        </div>
                        {cancelError && <p className="text-red-400 text-xs mt-1">{cancelError}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          }) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-ink/10 mx-auto mb-4" />
              <p className="text-ink/40 text-lg">No orders yet</p>
              <p className="text-ink/30 text-sm mt-1">Your order history will appear here</p>
              <Link to="/products" className="inline-block mt-4 rounded-full bg-coral text-onaccent font-semibold px-6 py-3 hover:shadow-glow transition-shadow">
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ─── Addresses Tab ─── */}
      {activeTab === 'addresses' && (
        <div className="space-y-4">
          {addressMsg && <p className="text-sm text-plum">{addressMsg}</p>}

          {/* Saved addresses */}
          {addresses?.map((a) => (
            <div key={a.id} className={clsx(
              'glass rounded-card p-4 border transition-colors',
              a.isDefault ? 'border-coral/30' : 'border-hairline/10'
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.label}</span>
                    {a.isDefault && (
                      <span className="text-[10px] bg-coral/15 text-coral px-2 py-0.5 rounded-full font-semibold">Default</span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{a.recipientName} · {a.phone}</p>
                  <p className="text-sm text-ink/50 mt-0.5">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                  <p className="text-sm text-ink/50">{a.city}, {a.state} {a.pincode}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEditAddress(a)} className="h-8 w-8 rounded-full border border-hairline/15 flex items-center justify-center hover:bg-panel transition-colors" title="Edit">
                    <Edit3 className="h-3.5 w-3.5 text-ink/50" />
                  </button>
                  <button onClick={() => deleteAddress(a.id)} className="h-8 w-8 rounded-full border border-hairline/15 flex items-center justify-center hover:bg-red-400/10 hover:border-red-400/30 transition-colors" title="Delete">
                    <Trash2 className="h-3.5 w-3.5 text-ink/50" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add / Edit form */}
          {showAddressForm ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-card p-5 border border-coral/20 space-y-3"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm">{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
                <button onClick={() => setShowAddressForm(false)} className="text-ink/30 hover:text-ink/60">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Label selector */}
              <div className="flex gap-2">
                {['Home', 'Work', 'Office', 'Other'].map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => setAddressForm((f) => ({ ...f, label: lbl }))}
                    className={clsx(
                      'px-3 py-1.5 rounded-full text-xs border transition-colors',
                      addressForm.label === lbl ? 'border-coral text-coral bg-coral/10' : 'border-hairline/15 text-ink/50'
                    )}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="Recipient Name *"
                  className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={addressForm.recipientName}
                  onChange={(e) => setAddressForm((f) => ({ ...f, recipientName: e.target.value }))}
                />
                <input
                  placeholder="Phone Number *"
                  className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <input
                placeholder="Address Line 1 *"
                className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                value={addressForm.line1}
                onChange={(e) => setAddressForm((f) => ({ ...f, line1: e.target.value }))}
              />
              <input
                placeholder="Address Line 2 (Landmark, etc.)"
                className="w-full bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                value={addressForm.line2}
                onChange={(e) => setAddressForm((f) => ({ ...f, line2: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  placeholder="City *"
                  className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                />
                <input
                  placeholder="State *"
                  className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                />
                <input
                  placeholder="Pincode *"
                  className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm((f) => ({ ...f, pincode: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink/60">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded"
                />
                Set as default address
              </label>
              <button onClick={saveAddress} className="flex items-center gap-2 rounded-full bg-coral text-onaccent px-5 py-2 text-sm font-semibold hover:shadow-glow transition-shadow">
                <Save className="h-4 w-4" />
                {editingAddressId ? 'Update Address' : 'Save Address'}
              </button>
            </motion.div>
          ) : (
            <button onClick={startNewAddress} className="flex items-center gap-2 text-sm text-coral hover:text-coral/80 transition-colors">
              <Plus className="h-4 w-4" /> Add new address
            </button>
          )}

          {!addresses?.length && !showAddressForm && (
            <div className="text-center py-16">
              <MapPin className="h-16 w-16 text-ink/10 mx-auto mb-4" />
              <p className="text-ink/40">No saved addresses</p>
              <p className="text-ink/30 text-sm mt-1">Add an address for faster checkout</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Account Tab ─── */}
      {activeTab === 'account' && (
        <div className="space-y-6 max-w-lg">
          <div className="glass rounded-card p-5 border border-hairline/10 space-y-4">
            <h3 className="font-semibold">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-ink/40 text-xs">Full Name</label>
                <p className="font-medium mt-0.5">{user?.fullName || '—'}</p>
              </div>
              <div>
                <label className="text-ink/40 text-xs">Email</label>
                <p className="font-medium mt-0.5">{user?.email || '—'}</p>
              </div>
              <div>
                <label className="text-ink/40 text-xs">Phone</label>
                <p className="font-medium mt-0.5">{user?.phone || '—'}</p>
              </div>
              <div>
                <label className="text-ink/40 text-xs">Account Type</label>
                <p className="font-medium mt-0.5">{user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Customer'}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-card p-5 border border-hairline/10">
            <h3 className="font-semibold mb-3">Quick Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-display text-2xl font-bold">{orders?.length ?? 0}</p>
                <p className="text-xs text-ink/40">Total Orders</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold">{addresses?.length ?? 0}</p>
                <p className="text-xs text-ink/40">Saved Addresses</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold">
                  {orders ? formatINR(orders.reduce((s, o) => s + o.total, 0)) : '—'}
                </p>
                <p className="text-xs text-ink/40">Total Spent</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
