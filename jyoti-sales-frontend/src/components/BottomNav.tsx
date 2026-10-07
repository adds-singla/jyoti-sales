import { Link, useLocation } from 'react-router-dom'
import { Home, Grid3x3, ShoppingCart, Heart, User } from 'lucide-react'
import clsx from 'clsx'

export default function BottomNav({ cartCount }: { cartCount: number }) {
  const { pathname } = useLocation()
  const items = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/products', icon: Grid3x3, label: 'Shop' },
    { to: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
    { to: '/wishlist', icon: Heart, label: 'Wishlist' },
    { to: '/profile', icon: User, label: 'Profile' },
  ]
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-hairline/10 flex justify-around py-2">
      {items.map(({ to, icon: Icon, label, badge }) => (
        <Link key={to} to={to} className={clsx('flex flex-col items-center gap-0.5 text-[10px] px-2 relative',
          pathname === to ? 'text-coral' : 'text-ink/50')}>
          <Icon className="h-5 w-5" />
          {label}
          {!!badge && (
            <span className="absolute -top-0.5 right-0 bg-coral text-onaccent text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
              {badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )
}
