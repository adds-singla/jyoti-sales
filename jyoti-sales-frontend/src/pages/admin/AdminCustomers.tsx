import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, ShieldCheck, ShieldOff, Mail, Phone, Crown, User as UserIcon, RefreshCw, AlertTriangle } from 'lucide-react'

interface CustomerSummary {
  id: number
  fullName: string
  email: string | null
  phone: string | null
  role: string
  blocked: boolean
  createdAt: string
}

export default function AdminCustomers() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => (await api.get('/admin/customers', { params: { size: 100 } })).data,
    retry: 10,
    retryDelay: (attempt) => Math.min(3000 * (attempt + 1), 15000),
    refetchInterval: (query) => query.state.status === 'error' ? 8000 : false,
  })

  const customers: CustomerSummary[] = data?.content ?? []

  const filtered = customers.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    )
  })

  async function toggleBlock(u: CustomerSummary) {
    setTogglingId(u.id)
    try {
      await api.patch(`/admin/customers/${u.id}/${u.blocked ? 'unblock' : 'block'}`)
      qc.invalidateQueries({ queryKey: ['admin-customers'] })
    } finally {
      setTogglingId(null)
    }
  }

  const totalCustomers = customers.filter(u => u.role !== 'ROLE_ADMIN').length
  const blockedCount = customers.filter(u => u.blocked).length
  const adminCount = customers.filter(u => u.role === 'ROLE_ADMIN').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-3">
            <Users className="h-6 w-6 text-coral" />
            Customers
          </h1>
          <p className="text-sm text-ink/40 mt-1">Manage all registered users</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-ink/50 hover:text-coral transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
          {/* Stats */}
          <div className="glass border border-hairline/10 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-lg">{totalCustomers}</p>
            <p className="text-[10px] text-ink/40 uppercase tracking-wide">Customers</p>
          </div>
          <div className="glass border border-hairline/10 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-lg text-red-400">{blockedCount}</p>
            <p className="text-[10px] text-ink/40 uppercase tracking-wide">Blocked</p>
          </div>
          <div className="glass border border-hairline/10 rounded-xl px-4 py-2 text-center">
            <p className="font-bold text-lg text-amber-400">{adminCount}</p>
            <p className="text-[10px] text-ink/40 uppercase tracking-wide">Admins</p>
          </div>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div className="glass rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-400 text-sm">Backend is waking up…</p>
            <p className="text-xs text-ink/50 mt-0.5">
              Render free tier sleeps after 15 min of inactivity. Auto-retrying every 8 seconds —
              <button onClick={() => refetch()} className="text-coral underline ml-1">retry now</button>.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full bg-panel border border-hairline/15 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-coral/50 transition-colors"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-coral/50" />
          <p className="text-ink/40 text-sm">Loading customers… (server may be waking up)</p>
        </div>
      ) : isError ? null : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-16 w-16 text-ink/10 mx-auto mb-4" />
          <p className="text-ink/40">{search ? 'No customers match your search' : 'No customers yet'}</p>
        </div>
      ) : (
        <div className="glass rounded-card border border-hairline/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-ink/40 border-b border-hairline/10 bg-panel/40">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((u) => {
                    const isAdmin = u.role === 'ROLE_ADMIN'
                    const isToggling = togglingId === u.id
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-hairline/10 hover:bg-panel/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isAdmin ? 'bg-amber-400/20 text-amber-400' : 'bg-coral/15 text-coral'
                            }`}>
                              {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium leading-tight">{u.fullName}</p>
                              <p className="text-[11px] text-ink/30">#{u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {u.email && (
                              <p className="flex items-center gap-1.5 text-ink/60 text-xs">
                                <Mail className="h-3 w-3 shrink-0" />{u.email}
                              </p>
                            )}
                            {u.phone && (
                              <p className="flex items-center gap-1.5 text-ink/60 text-xs">
                                <Phone className="h-3 w-3 shrink-0" />{u.phone}
                              </p>
                            )}
                            {!u.email && !u.phone && <span className="text-ink/30 text-xs">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/30">
                              <Crown className="h-3 w-3" /> Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-blue-400/10 text-blue-400 border border-blue-400/20">
                              <UserIcon className="h-3 w-3" /> Customer
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-ink/50">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {u.blocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
                              <ShieldOff className="h-3 w-3" /> Blocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                              <ShieldCheck className="h-3 w-3" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!isAdmin && (
                            <button
                              onClick={() => toggleBlock(u)}
                              disabled={isToggling}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                                u.blocked
                                  ? 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10'
                                  : 'border-red-400/30 text-red-400 hover:bg-red-400/10'
                              }`}
                            >
                              {isToggling ? '…' : u.blocked ? 'Unblock' : 'Block'}
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-hairline/10 text-xs text-ink/30">
            Showing {filtered.length} of {customers.length} users
          </div>
        </div>
      )}
    </div>
  )
}
