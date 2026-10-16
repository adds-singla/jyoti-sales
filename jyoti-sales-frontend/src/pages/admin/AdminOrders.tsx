import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Order, OrderItem } from '../../types'
import { formatINR } from '../../lib/format'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, ChevronDown, ChevronUp, CheckCircle2, Clock, Truck, XCircle, AlertCircle, RefreshCw, User } from 'lucide-react'
import InvoiceDownloadButton from '../../components/InvoiceDownloadButton'

const STATUSES = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const

const statusConfig: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  PENDING: { color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30', icon: Clock },
  CONFIRMED: { color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30', icon: CheckCircle2 },
  PACKED: { color: 'text-violet-400', bg: 'bg-violet-400/10 border-violet-400/30', icon: Package },
  SHIPPED: { color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/30', icon: Truck },
  DELIVERED: { color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', icon: CheckCircle2 },
  CANCELLED: { color: 'text-red-400', bg: 'bg-red-400/10 border-red-400/30', icon: XCircle },
  REFUNDED: { color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30', icon: RefreshCw },
}

export default function AdminOrders() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: async () => (await api.get('/admin/orders', { params: { status: filter || undefined, size: 50 } })).data,
  })

  const { data: pendingData } = useQuery({
    queryKey: ['admin-pending-count'],
    queryFn: async () => (await api.get('/admin/orders/pending-count')).data,
    refetchInterval: 15000, // poll every 15s
  })

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id)
    try {
      await api.patch(`/admin/orders/${id}/status?status=${status}`)
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-pending-count'] })
    } finally {
      setUpdatingId(null)
    }
  }

  async function quickAction(id: number, status: string) {
    await updateStatus(id, status)
  }

  const pendingCount = pendingData?.count ?? 0

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            Orders
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-amber-400/15 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full animate-pulse">
                <AlertCircle className="h-3.5 w-3.5" />
                {pendingCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-ink/40 mt-1">Manage and track all customer orders</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-ink/40">Loading orders...</div>
      ) : !data?.content?.length ? (
        <div className="text-center py-20">
          <Package className="h-16 w-16 text-ink/10 mx-auto mb-4" />
          <p className="text-ink/40">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {data.content.map((o: Order) => {
              const config = statusConfig[o.status] || statusConfig.PENDING
              const StatusIcon = config.icon
              const isExpanded = expandedId === o.id
              const isUpdating = updatingId === o.id
              const isPending = o.status === 'PENDING'
              const isActive = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)

              return (
                <motion.div
                  key={o.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`glass rounded-card border overflow-hidden transition-colors ${
                    isPending ? 'border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.05)]' : 'border-hairline/10'
                  }`}
                >
                  {/* Order header row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-panel/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  >
                    {/* Status indicator */}
                    <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center border ${config.bg}`}>
                      <StatusIcon className={`h-5 w-5 ${config.color}`} />
                    </div>

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold">{o.orderNumber}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                          {o.status}
                        </span>
                        {isPending && (
                          <span className="text-[10px] text-amber-400 animate-pulse">● NEW</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ink/40">
                        {o.customerName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {o.customerName}
                          </span>
                        )}
                        <span>{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        <span>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="text-right shrink-0">
                      <span className="font-display font-bold">{formatINR(o.total)}</span>
                    </div>

                    {/* Quick actions (visible without expanding) */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      {isPending && (
                        <button
                          onClick={(e) => { e.stopPropagation(); quickAction(o.id, 'CONFIRMED') }}
                          disabled={isUpdating}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
                        >
                          {isUpdating ? '...' : 'Confirm'}
                        </button>
                      )}
                      {o.status === 'CONFIRMED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); quickAction(o.id, 'PACKED') }}
                          disabled={isUpdating}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-400/30 hover:bg-violet-500/25 transition-colors disabled:opacity-40"
                        >
                          {isUpdating ? '...' : 'Mark Packed'}
                        </button>
                      )}
                      {o.status === 'PACKED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); quickAction(o.id, 'SHIPPED') }}
                          disabled={isUpdating}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-500/25 transition-colors disabled:opacity-40"
                        >
                          {isUpdating ? '...' : 'Mark Shipped'}
                        </button>
                      )}
                      {o.status === 'SHIPPED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); quickAction(o.id, 'DELIVERED') }}
                          disabled={isUpdating}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
                        >
                          {isUpdating ? '...' : '✓ Delivered'}
                        </button>
                      )}
                    </div>

                    {/* Expand toggle */}
                    <button className="shrink-0 text-ink/30">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
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
                        <div className="border-t border-hairline/10 p-4 space-y-4">
                          {/* Items list */}
                          <div>
                            <h4 className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-2">Order Items</h4>
                            <div className="space-y-2">
                              {o.items.map((item: OrderItem, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-panel/30 rounded-lg px-3 py-2">
                                  <div>
                                    <span className="font-medium">{item.productName}</span>
                                    <span className="text-ink/40 ml-2">× {item.quantity}</span>
                                  </div>
                                  <span className="font-semibold">{formatINR(item.unitPrice * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Price breakdown */}
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

                          {/* Customer info */}
                          {o.customerName && (
                            <div className="text-xs text-ink/40">
                              <span className="font-semibold text-ink/60">Customer:</span> {o.customerName}
                              {o.customerEmail && <span className="ml-2">({o.customerEmail})</span>}
                            </div>
                          )}

                          {/* Invoice download */}
                          <div className="pt-1 border-t border-hairline/10">
                            <InvoiceDownloadButton orderId={o.id} orderNumber={o.orderNumber} apiPath="/admin/orders" />
                          </div>

                          {/* Status update */}
                          {isActive && (
                            <div className="flex items-center gap-3 pt-2 border-t border-hairline/10">
                              <span className="text-xs text-ink/40">Update status:</span>
                              <select
                                value={o.status}
                                onChange={(e) => updateStatus(o.id, e.target.value)}
                                disabled={isUpdating}
                                className="bg-panel border border-hairline/15 rounded-lg px-2 py-1 text-xs disabled:opacity-40"
                              >
                                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                              {isPending && (
                                <>
                                  <button
                                    onClick={() => quickAction(o.id, 'CONFIRMED')}
                                    disabled={isUpdating}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-40"
                                  >
                                    ✓ Confirm Order
                                  </button>
                                  <button
                                    onClick={() => quickAction(o.id, 'CANCELLED')}
                                    disabled={isUpdating}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-400/30 hover:bg-red-500/25 transition-colors disabled:opacity-40"
                                  >
                                    ✕ Cancel
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
