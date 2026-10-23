import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { DashboardStats } from '../../types'
import { formatINR } from '../../lib/format'
import { AlertTriangle, TrendingUp, ShoppingBag, Users, Package, RefreshCw } from 'lucide-react'

const statCards = (stats: DashboardStats | undefined) => [
  { label: 'Total Revenue', value: stats ? formatINR(stats.totalRevenue) : '—', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { label: 'Total Orders', value: stats?.totalOrders ?? '—', icon: ShoppingBag, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { label: 'Total Customers', value: stats?.totalCustomers ?? '—', icon: Users, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  { label: 'Low Stock Items', value: stats?.lowStockCount ?? '—', icon: Package, color: 'text-amber-400', bg: 'bg-amber-400/10' },
]

export default function Dashboard() {
  const { data: stats, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get<DashboardStats>('/admin/dashboard/stats')).data,
    retry: 10,
    retryDelay: (attempt) => Math.min(3000 * (attempt + 1), 15000),
    // Keep retrying every 8s while there's an error (backend waking up)
    refetchInterval: (query) => query.state.status === 'error' ? 8000 : false,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-xs text-ink/50 hover:text-coral transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {isError && (
        <div className="glass rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-400 text-sm">Backend is waking up…</p>
            <p className="text-xs text-ink/50 mt-0.5">
              Render free tier sleeps after 15 min of inactivity. Auto-retrying every 8 seconds —
              <button onClick={() => refetch()} className="text-coral underline ml-1">retry now</button>.
            </p>
            <div className="mt-2 h-1 w-48 bg-panel rounded-full overflow-hidden">
              <div className="h-full bg-amber-400/60 rounded-full animate-[ping_2s_ease-in-out_infinite] w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards(stats).map((c) => (
          <div key={c.label} className="glass rounded-card p-5 border border-hairline/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-ink/40">{c.label}</p>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </div>
            {isLoading ? (
              <div className="h-8 w-16 bg-panel rounded animate-pulse" />
            ) : (
              <p className={`font-display text-2xl font-bold ${isError ? 'text-ink/20' : ''}`}>{c.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Low stock alerts */}
      {stats && stats.lowStockItems.length > 0 && (
        <div className="glass rounded-card p-5 border border-amber-400/20">
          <h2 className="font-semibold flex items-center gap-2 mb-4 text-amber-400">
            <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
          </h2>
          <div className="space-y-2 text-sm">
            {stats.lowStockItems.map((item) => (
              <div key={item.productId} className="flex justify-between border-b border-hairline/10 pb-2 last:border-0 last:pb-0">
                <span>{item.name}</span>
                <span className="text-amber-400 font-semibold">{item.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8 text-ink/30 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-coral/50" />
          Loading dashboard… (server may be waking up)
        </div>
      )}
    </div>
  )
}
