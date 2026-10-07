import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { DashboardStats } from '../../types'
import { formatINR } from '../../lib/format'
import { AlertTriangle } from 'lucide-react'

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await api.get<DashboardStats>('/admin/dashboard/stats')).data,
  })

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: stats ? formatINR(stats.totalRevenue) : '—' },
          { label: 'Total Orders', value: stats?.totalOrders ?? '—' },
          { label: 'Total Customers', value: stats?.totalCustomers ?? '—' },
          { label: 'Low Stock Items', value: stats?.lowStockCount ?? '—' },
        ].map((c) => (
          <div key={c.label} className="glass rounded-card p-5 border border-hairline/10">
            <p className="text-xs text-ink/40">{c.label}</p>
            <p className="font-display text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {stats && stats.lowStockItems.length > 0 && (
        <div className="glass rounded-card p-5 border border-hairline/10">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><AlertTriangle className="h-4 w-4 text-coral" /> Low Stock Alerts</h2>
          <div className="space-y-2 text-sm">
            {stats.lowStockItems.map((item) => (
              <div key={item.productId} className="flex justify-between border-b border-hairline/10 pb-2">
                <span>{item.name}</span>
                <span className="text-coral font-semibold">{item.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
