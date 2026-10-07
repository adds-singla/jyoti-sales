import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { LayoutDashboard, Package, FolderTree, Tag, ClipboardList, Users } from 'lucide-react'
import clsx from 'clsx'

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/categories', icon: FolderTree, label: 'Categories' },
  { to: '/admin/offers', icon: Tag, label: 'Offers & Banners' },
  { to: '/admin/orders', icon: ClipboardList, label: 'Orders', badge: true },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
]

export default function AdminLayout() {
  const { role } = useAuthStore()

  const { data: pendingData } = useQuery({
    queryKey: ['admin-pending-count'],
    queryFn: async () => (await api.get('/admin/orders/pending-count')).data,
    refetchInterval: 15000, // poll every 15s for new orders
    enabled: role === 'ROLE_ADMIN',
  })
  const pendingCount = pendingData?.count ?? 0

  if (role !== 'ROLE_ADMIN') return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid md:grid-cols-[220px_1fr] gap-8">
      <aside className="space-y-1">
        <h2 className="font-display text-lg font-bold mb-4 text-gradient">Admin Panel</h2>
        {links.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors relative',
              isActive ? 'bg-coral/10 text-coral' : 'text-ink/60 hover:bg-panel'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge && pendingCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[10px] font-bold bg-amber-400 text-black rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
