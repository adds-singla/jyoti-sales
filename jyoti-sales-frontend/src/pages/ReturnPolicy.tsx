import { BUSINESS } from '../lib/business'
import { RefreshCcw, AlertTriangle, CheckCircle2, Phone } from 'lucide-react'

export default function ReturnPolicy() {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs text-ink/40 uppercase tracking-widest mb-2">Legal</p>
        <h1 className="font-display text-3xl font-bold mb-3">Return &amp; Refund Policy</h1>
        <p className="text-sm text-ink/40">Last updated: {today}</p>
      </div>

      {/* Quick summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: RefreshCcw, title: '7-Day Returns', desc: 'For eligible products in original condition', color: 'text-coral' },
          { icon: CheckCircle2, title: 'Full Refunds', desc: 'Processed within 5–7 business days', color: 'text-green-400' },
          { icon: Phone, title: 'Easy Process', desc: `Call ${BUSINESS.phone} to initiate`, color: 'text-blue-400' },
        ].map(({ icon: Icon, title, desc, color }) => (
          <div key={title} className="glass rounded-card p-4 border border-hairline/10 flex gap-3 items-start">
            <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${color}`} />
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-ink/50 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-8 text-ink/70 leading-relaxed text-sm">

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">1. Return Window</h2>
          <p>
            We accept returns within <strong>7 days</strong> from the date of delivery for eligible products,
            provided the product is in its original, unopened condition with all accessories, manuals,
            and original packaging intact.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">2. Eligible Reasons for Return</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Product received is physically damaged or broken.</li>
            <li>Wrong product delivered (different model/colour from what was ordered).</li>
            <li>Product is defective or does not turn on out of the box.</li>
            <li>Missing accessories or components listed in the product description.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">3. Non-Returnable Items</h2>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200/80 text-xs">The following items cannot be returned unless they arrive damaged or defective.</p>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>Products that have been used, installed, or altered after delivery.</li>
            <li>Products with a broken or missing manufacturer seal.</li>
            <li>Damage caused by improper voltage, power surges, or physical mishandling after delivery.</li>
            <li>Products reported after the 7-day return window.</li>
            <li>Consumable items (filters, bulbs, batteries) once opened.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">4. How to Request a Return</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Contact us within 7 days of delivery via phone ({BUSINESS.phone}) or email ({BUSINESS.email}).</li>
            <li>Share your order number, photos/video of the damaged or wrong product.</li>
            <li>Our team will review your request within 1 business day.</li>
            <li>If approved, we will arrange a pickup or guide you to drop off the product at our store.</li>
            <li>Once the product is inspected and verified, we will process your refund.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">5. Refund Process</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Online payments (Razorpay):</strong> Refunded to the original payment method (UPI, card, wallet) within 5–7 business days after return verification.</li>
            <li><strong>Cash on Delivery orders:</strong> Refunded via bank transfer (NEFT/IMPS). You will need to provide your bank account details.</li>
            <li>Razorpay transaction fees (if any) are non-refundable.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">6. Warranty Repairs</h2>
          <p>
            For products that develop a fault after the 7-day return window but within the manufacturer warranty
            period, please contact the brand's authorised service centre or reach out to us — we will
            assist in coordinating the warranty claim.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">7. Order Cancellations</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Orders can be cancelled before dispatch by contacting us immediately.</li>
            <li>Once dispatched, cancellation is not possible — you may initiate a return after delivery.</li>
            <li>For COD orders, simply refuse delivery if you have changed your mind.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">8. Contact Us</h2>
          <p>
            For return/refund queries:<br />
            📞 <a href={`tel:${BUSINESS.phone}`} className="text-coral hover:underline">{BUSINESS.phone}</a><br />
            ✉️ <a href={`mailto:${BUSINESS.email}`} className="text-coral hover:underline">{BUSINESS.email}</a><br />
            🏪 {BUSINESS.address}
          </p>
        </section>
      </div>
    </div>
  )
}
