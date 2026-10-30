import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { DashboardAnalytics, DashboardStats } from '../../types'
import { formatINR } from '../../lib/format'
import {
  AlertTriangle, TrendingUp, ShoppingBag, Users, Package,
  RefreshCw, IndianRupee, BarChart3, PieChart as PieIcon,
  Trophy, ArrowUpRight
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month' | 'financial_year' | 'all_time'

// ─── Colour palettes ──────────────────────────────────────────────────────────

const PIE_COLORS = ['#f2a65a', '#c084fc', '#34d399', '#60a5fa', '#fb923c', '#f87171', '#a78bfa']

const STATUS_COLORS: Record<string, string> = {
  DELIVERED:  '#34d399',
  CONFIRMED:  '#60a5fa',
  PACKED:     '#a78bfa',
  SHIPPED:    '#06b6d4',
  PENDING:    '#fbbf24',
  CANCELLED:  '#f87171',
  REFUNDED:   '#fb923c',
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg border border-hairline/10 px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold mb-1 text-ink/70">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'Revenue' ? formatINR(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const now = new Date()
  const curYear  = now.getFullYear()
  const curMonth = now.getMonth() + 1
  const fyYear   = curMonth >= 4 ? curYear : curYear - 1

  const [period, setPeriod]  = useState<Period>('all_time')
  const [year, setYear]      = useState(fyYear)
  const [month, setMonth]    = useState(curMonth)

  // Legacy stats (top KPI cards)
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats, isFetching: statsFetching } =
    useQuery({
      queryKey: ['admin-dashboard'],
      queryFn: async () => (await api.get<DashboardStats>('/admin/dashboard/stats')).data,
      retry: 10,
      retryDelay: (a) => Math.min(3000 * (a + 1), 15000),
      refetchInterval: (q) => q.state.status === 'error' ? 8000 : false,
    })

  // Rich analytics
  const analyticsParams = new URLSearchParams({
    period,
    year: String(year),
    month: String(month),
  })

  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError, refetch: refetchAnalytics, isFetching: analyticsFetching } =
    useQuery({
      queryKey: ['admin-analytics', period, year, month],
      queryFn: async () =>
        (await api.get<DashboardAnalytics>(`/admin/dashboard/analytics?${analyticsParams}`)).data,
      retry: 5,
      retryDelay: (a) => Math.min(3000 * (a + 1), 15000),
      refetchInterval: (q) => q.state.status === 'error' ? 8000 : false,
    })

  const handleRefresh = () => { refetchStats(); refetchAnalytics() }
  const isFetching = statsFetching || analyticsFetching

  // ── Period label ────────────────────────────────────────────────────────────
  const periodLabel = {
    day: `Today`,
    week: `This Week`,
    month: `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
    financial_year: `FY ${year}-${String(year + 1).slice(-2)}`,
    all_time: `All Time`,
  }[period]

  // ── Stat cards (top row) ────────────────────────────────────────────────────
  const kpiCards = [
    { label: 'Total Revenue',     value: stats ? formatINR(stats.totalRevenue)     : '—', icon: IndianRupee,  color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Total Orders',      value: stats?.totalOrders     ?? '—',              icon: ShoppingBag,     color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
    { label: 'Total Customers',   value: stats?.totalCustomers  ?? '—',              icon: Users,           color: 'text-violet-400',  bg: 'bg-violet-400/10'  },
    { label: 'Low Stock Items',   value: stats?.lowStockCount   ?? '—',              icon: Package,         color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
  ]

  const periodKpis = [
    { label: `Revenue (${periodLabel})`, value: analytics ? formatINR(analytics.periodRevenue) : '—', icon: TrendingUp, color: 'text-coral' },
    { label: `Orders (${periodLabel})`,  value: analytics?.periodOrders ?? '—',                        icon: BarChart3,  color: 'text-sky-400' },
    { label: 'Avg. Order Value',         value: analytics ? formatINR(analytics.avgOrderValue)  : '—', icon: ArrowUpRight, color: 'text-purple-400' },
  ]

  // ── Year options ────────────────────────────────────────────────────────────
  const yearOptions = Array.from({ length: 5 }, (_, i) => curYear - i)

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-ink/50 hover:text-coral transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────────────────── */}
      {(statsError || analyticsError) && (
        <div className="glass rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-400 text-sm">Backend is waking up…</p>
            <p className="text-xs text-ink/50 mt-0.5">
              Render free tier sleeps after 15 min of inactivity. Auto-retrying every 8s —&nbsp;
              <button onClick={handleRefresh} className="text-coral underline">retry now</button>.
            </p>
            <div className="mt-2 h-1 w-48 bg-panel rounded-full overflow-hidden">
              <div className="h-full bg-amber-400/60 rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* ── All-time KPI cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <div key={c.label} className="glass rounded-card p-5 border border-hairline/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-ink/40">{c.label}</p>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.bg}`}>
                <c.icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </div>
            {statsLoading
              ? <div className="h-8 w-20 bg-panel rounded animate-pulse" />
              : <p className={`font-display text-2xl font-bold ${statsError ? 'text-ink/20' : ''}`}>{c.value}</p>
            }
          </div>
        ))}
      </div>

      {/* ── Period selector ──────────────────────────────────────────────────── */}
      <div className="glass rounded-card p-4 border border-hairline/10">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-ink/40 font-medium mr-1">Period:</span>
          {(['day','week','month','financial_year','all_time'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => { setPeriod(p); if (p === 'financial_year') setYear(fyYear) }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                period === p ? 'bg-coral text-white' : 'bg-panel text-ink/60 hover:bg-panel/80'
              }`}
            >
              {p === 'financial_year' ? 'Financial Year' : p === 'all_time' ? 'All Time' : p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}

          {/* Year picker */}
          {(period === 'financial_year' || period === 'month') && (
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="ml-2 px-2 py-1 rounded-lg bg-panel border border-hairline/20 text-xs text-ink"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>
                  {period === 'financial_year' ? `FY ${y}-${String(y+1).slice(-2)}` : y}
                </option>
              ))}
            </select>
          )}

          {/* Month picker */}
          {period === 'month' && (
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="px-2 py-1 rounded-lg bg-panel border border-hairline/20 text-xs text-ink"
            >
              {Array.from({length:12},(_,i)=>i+1).map(m => (
                <option key={m} value={m}>
                  {new Date(2000, m-1).toLocaleString('default',{month:'long'})}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Period KPI mini-cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {periodKpis.map(c => (
          <div key={c.label} className="glass rounded-card p-4 border border-hairline/10 flex items-center gap-4">
            <c.icon className={`h-8 w-8 ${c.color} shrink-0`} />
            <div>
              <p className="text-xs text-ink/40">{c.label}</p>
              {analyticsLoading
                ? <div className="h-6 w-24 bg-panel rounded animate-pulse mt-1" />
                : <p className="font-display text-xl font-bold">{c.value}</p>
              }
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue trend chart ───────────────────────────────────────────────── */}
      <div className="glass rounded-card p-5 border border-hairline/10">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-coral" />
          Revenue Trend — {periodLabel}
        </h2>
        {analyticsLoading ? (
          <div className="h-52 bg-panel rounded animate-pulse" />
        ) : analytics?.revenueTrend && analytics.revenueTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analytics.revenueTrend} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f2a65a" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f2a65a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
              <XAxis dataKey="label" tick={{ fill: '#ffffff55', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill: '#ffffff55', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f2a65a" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#c084fc" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-ink/30 text-sm py-10">No revenue data for this period.</p>
        )}
      </div>

      {/* ── Two-column row: Order status pie + Payment method pie ──────────────── */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Order status breakdown */}
        <div className="glass rounded-card p-5 border border-hairline/10">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-purple-400" />
            Order Status Breakdown
          </h2>
          {analyticsLoading ? (
            <div className="h-48 bg-panel rounded animate-pulse" />
          ) : analytics?.orderStatusBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.orderStatusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                >
                  {analytics.orderStatusBreakdown.map((entry, i) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ background:'#161616', border:'1px solid #ffffff15', borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-ink/30 text-sm py-10">No order data.</p>
          )}
        </div>

        {/* Payment method breakdown */}
        <div className="glass rounded-card p-5 border border-hairline/10">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-emerald-400" />
            Payment Methods
          </h2>
          {analyticsLoading ? (
            <div className="h-48 bg-panel rounded animate-pulse" />
          ) : analytics?.paymentMethodBreakdown?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.paymentMethodBreakdown}
                  dataKey="count"
                  nameKey="method"
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  paddingAngle={3}
                >
                  {analytics.paymentMethodBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} contentStyle={{ background:'#161616', border:'1px solid #ffffff15', borderRadius:8, fontSize:12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-ink/30 text-sm py-10">No payment data for this period.</p>
          )}
        </div>
      </div>

      {/* ── Top Products table ────────────────────────────────────────────────── */}
      <div className="glass rounded-card p-5 border border-hairline/10">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Top Products — Revenue & Units Sold
        </h2>

        {analyticsLoading ? (
          <div className="space-y-2">
            {Array.from({length:5}).map((_,i) => (
              <div key={i} className="h-10 bg-panel rounded animate-pulse" />
            ))}
          </div>
        ) : analytics?.topProducts?.length ? (
          <>
            {/* Bar chart */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={analytics.topProducts.slice(0,8)}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" horizontal={false} />
                <XAxis type="number" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} tick={{ fill:'#ffffff55', fontSize:10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="productName" width={130} tick={{ fill:'#ffffff99', fontSize:11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v.length > 20 ? v.slice(0,19)+'…' : v} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#f2a65a" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Detail table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-hairline/10 text-ink/40">
                    <th className="text-left pb-2 font-medium">#</th>
                    <th className="text-left pb-2 font-medium">Product</th>
                    <th className="text-right pb-2 font-medium">Units Sold</th>
                    <th className="text-right pb-2 font-medium">Avg Price</th>
                    <th className="text-right pb-2 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topProducts.map((p, i) => (
                    <tr key={p.productId} className="border-b border-hairline/10 last:border-0 hover:bg-panel/30 transition-colors">
                      <td className="py-2.5 text-ink/30 font-bold">{i+1}</td>
                      <td className="py-2.5 font-medium">{p.productName}</td>
                      <td className="py-2.5 text-right text-sky-400 font-semibold">{p.unitsSold}</td>
                      <td className="py-2.5 text-right text-ink/60">{formatINR(p.avgSellingPrice)}</td>
                      <td className="py-2.5 text-right text-emerald-400 font-semibold">{formatINR(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-center text-ink/30 text-sm py-10">No product data for this period.</p>
        )}
      </div>

      {/* ── Top Customers ─────────────────────────────────────────────────────── */}
      {analytics?.topCustomers && analytics.topCustomers.length > 0 && (
        <div className="glass rounded-card p-5 border border-hairline/10">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" />
            Top Customers — {periodLabel}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-hairline/10 text-ink/40">
                  <th className="text-left pb-2 font-medium">#</th>
                  <th className="text-left pb-2 font-medium">Customer</th>
                  <th className="text-right pb-2 font-medium">Orders</th>
                  <th className="text-right pb-2 font-medium">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {analytics.topCustomers.map((c, i) => (
                  <tr key={c.userId} className="border-b border-hairline/10 last:border-0 hover:bg-panel/30 transition-colors">
                    <td className="py-2.5 text-ink/30 font-bold">{i+1}</td>
                    <td className="py-2.5 font-medium">{c.name}</td>
                    <td className="py-2.5 text-right text-blue-400">{c.orderCount}</td>
                    <td className="py-2.5 text-right text-emerald-400 font-semibold">{formatINR(c.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Low stock alerts ─────────────────────────────────────────────────── */}
      {stats?.lowStockItems && stats.lowStockItems.length > 0 && (
        <div className="glass rounded-card p-5 border border-amber-400/20">
          <h2 className="font-semibold flex items-center gap-2 mb-4 text-amber-400 text-sm">
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

      {/* Loading overlay for initial load */}
      {statsLoading && (
        <div className="text-center py-8 text-ink/30 text-sm">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-coral/50" />
          Loading dashboard… (server may be waking up)
        </div>
      )}
    </div>
  )
}
