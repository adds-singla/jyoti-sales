import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Search, ShoppingCart, Heart, User, Menu, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { cartIconRef } from '../lib/flyToCart'
import ThemeToggle from './ThemeToggle'

export default function Navbar({ cartCount }: { cartCount: number }) {
  const navigate = useNavigate()
  const { fullName, role, logout } = useAuthStore()
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) navigate(`/products?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="sticky top-0 z-40 glass border-b border-hairline/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-xl font-bold tracking-tight text-gradient">Jyoti Sales</span>
          </Link>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search TVs, ACs, fridges, and more..."
                className="w-full rounded-full bg-panel/80 border border-hairline/15 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-coral/60 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink/40" />
            </div>
          </form>

          <div className="hidden md:flex items-center gap-5 text-sm">
            <Link to="/offers" className="hover:text-coral transition-colors">Offers</Link>
            {role === 'ROLE_ADMIN' && (
              <Link to="/admin" className="hover:text-plum transition-colors">Admin</Link>
            )}
            <Link to="/wishlist" className="hover:text-coral transition-colors"><Heart className="h-5 w-5" /></Link>
            <Link ref={(el) => { cartIconRef.current = el }} to="/cart" className="relative hover:text-coral transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-coral text-onaccent text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <ThemeToggle />
            {fullName ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-1 hover:text-coral transition-colors">
                  <User className="h-5 w-5" /> <span className="max-w-[100px] truncate">{fullName.split(' ')[0]}</span>
                </Link>
                <button onClick={logout} className="text-ink/50 hover:text-ink">Logout</button>
              </div>
            ) : (
              <Link to="/login" className="rounded-full bg-coral text-onaccent px-4 py-1.5 font-semibold hover:shadow-glow transition-shadow">
                Login
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <button onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden glass border-t border-hairline/10 px-4 py-4 space-y-3">
          <form onSubmit={submitSearch}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-full bg-panel/80 border border-hairline/15 px-4 py-2 text-sm"
            />
          </form>
          <div className="flex flex-col gap-3 text-sm">
            <Link to="/offers" onClick={() => setMenuOpen(false)}>Offers</Link>
            <Link to="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({cartCount})</Link>
            {role === 'ROLE_ADMIN' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
            {fullName ? (
              <button onClick={() => { logout(); setMenuOpen(false) }} className="text-left text-ink/50">Logout</button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
