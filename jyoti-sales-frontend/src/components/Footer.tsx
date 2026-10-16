import { Link } from 'react-router-dom'
import { BUSINESS } from '../lib/business'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-hairline/10 bg-surface2/60 pb-24 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div>
          <h3 className="font-display text-lg font-bold text-gradient mb-2">{BUSINESS.name}</h3>
          <p className="text-sm text-ink/60">{BUSINESS.altName}</p>
          <p className="text-sm text-ink/50 mt-2">{BUSINESS.tagline}</p>
          <div className="flex gap-2 flex-wrap mt-4">
            {BUSINESS.brands.slice(0, 6).map((b) => (
              <span key={b} className="text-[11px] px-2 py-1 rounded-full bg-panel border border-hairline/15 text-ink/60">{b}</span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="text-sm space-y-3">
          <h4 className="font-semibold text-ink mb-1">Visit Us</h4>
          <p className="flex items-start gap-2 text-ink/60"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> {BUSINESS.address}</p>
          <a href={`tel:${BUSINESS.phone}`} className="flex items-center gap-2 text-ink/60 hover:text-coral transition-colors">
            <Phone className="h-4 w-4" /> {BUSINESS.phone}
          </a>
          <a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2 text-ink/60 hover:text-coral transition-colors">
            <Mail className="h-4 w-4" /> {BUSINESS.email}
          </a>
          <p className="flex items-center gap-2 text-ink/60"><Clock className="h-4 w-4" /> {BUSINESS.timings}</p>
        </div>

        {/* Shop links */}
        <div className="text-sm space-y-2">
          <h4 className="font-semibold text-ink mb-1">Shop</h4>
          <Link to="/products" className="block text-ink/60 hover:text-coral transition-colors">All Products</Link>
          <Link to="/offers" className="block text-ink/60 hover:text-coral transition-colors">Offers &amp; Coupons</Link>
          <Link to="/profile" className="block text-ink/60 hover:text-coral transition-colors">My Orders</Link>
          <Link to="/cart" className="block text-ink/60 hover:text-coral transition-colors">Cart</Link>
        </div>

        {/* Legal links + store info */}
        <div className="text-sm space-y-2">
          <h4 className="font-semibold text-ink mb-1">Information</h4>
          <Link to="/privacy-policy" className="block text-ink/60 hover:text-coral transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="block text-ink/60 hover:text-coral transition-colors">Terms &amp; Conditions</Link>
          <Link to="/return-policy" className="block text-ink/60 hover:text-coral transition-colors">Returns &amp; Refunds</Link>
          <Link to="/shipping-policy" className="block text-ink/60 hover:text-coral transition-colors">Shipping Policy</Link>
          <p className="text-ink/40 pt-3 text-xs border-t border-hairline/10 mt-3">GSTIN: {BUSINESS.gstin}</p>
        </div>
      </div>

      <div className="border-t border-hairline/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-ink/40">
          <span>© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
          <span className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-coral transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-coral transition-colors">Terms</Link>
            <Link to="/return-policy" className="hover:text-coral transition-colors">Returns</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
