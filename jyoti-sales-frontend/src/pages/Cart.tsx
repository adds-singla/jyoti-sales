import { Link } from 'react-router-dom'
import { useCart } from '../lib/useCart'
import { formatINR } from '../lib/format'
import { Trash2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Cart() {
  const { cart, updateQuantity, removeItem } = useCart()
  const { accessToken } = useAuthStore()

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold mb-3">Your cart is empty</h1>
        <p className="text-ink/50 mb-6">Looks like you haven't added anything yet.</p>
        <Link to="/products" className="rounded-full bg-coral text-onaccent px-6 py-3 font-semibold">Start Shopping</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-2xl font-bold mb-6">Your Cart ({cart.items.length})</h1>
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.cartItemId} className="glass rounded-card p-4 border border-hairline/10 flex gap-4">
              <img src={item.imageUrl || 'https://placehold.co/200x200/14171C/F2A65A'} className="h-20 w-20 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium text-sm">{item.productName}</p>
                {item.variantLabel && <p className="text-xs text-ink/40">{item.variantLabel}</p>}
                {/* Price + MRP + discount % */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-sm text-coral font-semibold">{formatINR(item.unitPrice)}</p>
                  {item.mrp > item.unitPrice && (
                    <>
                      <p className="text-xs text-ink/40 line-through">{formatINR(item.mrp)}</p>
                      <span className="text-[10px] bg-green-400/15 text-green-400 font-bold px-1.5 py-0.5 rounded-full">
                        {Math.round(((item.mrp - item.unitPrice) / item.mrp) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-hairline/20 rounded-full text-sm">
                    <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1, item.productId, item.variantId)} className="px-2 py-1">-</button>
                    <span className="px-2">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartItemId, item.quantity + 1, item.productId, item.variantId)} className="px-2 py-1">+</button>
                  </div>
                  <button onClick={() => removeItem(item.cartItemId, item.productId, item.variantId)} className="text-ink/40 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="font-semibold">{formatINR(item.lineTotal)}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-card p-5 border border-hairline/10 h-fit space-y-4">
          <h2 className="font-semibold">Order Summary</h2>
          <div className="text-sm space-y-2 border-t border-hairline/10 pt-4">
            {(() => {
              const totalMrp = cart.items.reduce((sum, i) => sum + i.mrp * i.quantity, 0)
              const totalPrice = cart.total
              const saved = totalMrp - totalPrice
              const discPct = totalMrp > 0 ? Math.round((saved / totalMrp) * 100) : 0
              return (
                <>
                  <div className="flex justify-between text-ink/50">
                    <span>MRP</span>
                    <span className="line-through">{formatINR(totalMrp)}</span>
                  </div>
                  {saved > 0 && (
                    <div className="flex justify-between text-green-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        Discount
                        <span className="text-[10px] bg-green-400/15 text-green-400 font-bold px-1.5 py-0.5 rounded-full">
                          {discPct}% OFF
                        </span>
                      </span>
                      <span>− {formatINR(saved)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-hairline/10 pt-2">
                    <span>Total</span>
                    <span>{formatINR(totalPrice)}</span>
                  </div>
                  {saved > 0 && (
                    <p className="text-center text-xs text-green-400 bg-green-400/10 rounded-lg py-1.5 font-medium">
                      🎉 You save {formatINR(saved)} on this order!
                    </p>
                  )}
                </>
              )
            })()}
          </div>
          {accessToken ? (
            <Link to="/checkout" className="block text-center rounded-full bg-coral text-onaccent font-semibold py-3 hover:shadow-glow transition-shadow">
              Proceed to Checkout
            </Link>
          ) : (
            <Link
              to="/login?redirect=%2Fcheckout"
              className="block text-center rounded-full bg-coral text-onaccent font-semibold py-3 hover:opacity-90 transition-opacity"
            >
              Log in to Checkout
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
