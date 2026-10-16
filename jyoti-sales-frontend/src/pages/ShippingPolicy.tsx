import { BUSINESS } from '../lib/business'
import { Truck, Clock, MapPin, Package } from 'lucide-react'

export default function ShippingPolicy() {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs text-ink/40 uppercase tracking-widest mb-2">Legal</p>
        <h1 className="font-display text-3xl font-bold mb-3">Shipping Policy</h1>
        <p className="text-sm text-ink/40">Last updated: {today}</p>
      </div>

      {/* Quick summary cards */}
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {[
          { icon: Truck,   title: 'Local Delivery', desc: 'Same-day or next-day within Rampura Phul & nearby areas', color: 'text-coral' },
          { icon: Clock,   title: '2–5 Business Days', desc: 'For other districts in Punjab', color: 'text-blue-400' },
          { icon: MapPin,  title: 'Delivery Zones', desc: 'Punjab & select North India pincodes', color: 'text-plum' },
          { icon: Package, title: 'Free Installation', desc: 'For ACs, washing machines & large appliances (local)', color: 'text-green-400' },
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
          <h2 className="font-semibold text-base text-ink mb-2">1. Delivery Areas</h2>
          <p>
            We currently deliver to Rampura Phul and surrounding areas in Bathinda and Mansa districts of Punjab.
            We also ship to other pincodes across Punjab and select North Indian cities.
            To check if we deliver to your pincode, contact us at {BUSINESS.phone} before placing an order.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">2. Delivery Timelines</h2>
          <div className="overflow-hidden rounded-xl border border-hairline/15">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-panel border-b border-hairline/15">
                  <th className="text-left px-4 py-3 font-semibold text-ink">Delivery Zone</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink">Estimated Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/10">
                {[
                  ['Rampura Phul (local)', 'Same day or next business day'],
                  ['Bathinda & Mansa district', '1–2 business days'],
                  ['Other Punjab districts', '2–4 business days'],
                  ['Other North Indian cities', '3–5 business days'],
                ].map(([zone, time]) => (
                  <tr key={zone} className="hover:bg-panel/40 transition-colors">
                    <td className="px-4 py-3">{zone}</td>
                    <td className="px-4 py-3 text-coral">{time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink/40">
            Timelines are estimates and may vary due to public holidays, weather conditions, or courier delays.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">3. Delivery Charges</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Local delivery (Rampura Phul &amp; nearby):</strong> Free for orders above ₹2,000. ₹100 for smaller orders.</li>
            <li><strong>Other areas:</strong> Shipping charges will be calculated at checkout based on your pincode and order weight. For large appliances, a transport charge may apply — you will be informed before dispatch.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">4. Order Processing</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Orders placed before 12:00 PM on a business day are processed the same day.</li>
            <li>Orders placed after 12:00 PM or on weekends/public holidays are processed the next business day.</li>
            <li>Our business hours are: {BUSINESS.timings}.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">5. Large Appliance Delivery &amp; Installation</h2>
          <p>
            For products such as ACs, refrigerators, washing machines, and televisions, our team will
            call you after your order is confirmed to schedule a convenient delivery and installation slot.
            <strong> Free installation is included for local deliveries</strong> within Rampura Phul and nearby areas.
            For outstation deliveries, our partner service centres handle installation — charges may apply.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">6. Tracking Your Order</h2>
          <p>
            You can track your order status in real time from your{' '}
            <a href="/profile" className="text-coral hover:underline">My Orders</a> page.
            Our team will also call or WhatsApp you with delivery updates.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">7. Failed / Missed Delivery</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>If you are unavailable at the time of delivery, our team will attempt delivery again or contact you to reschedule.</li>
            <li>After 2 failed delivery attempts, the order may be held at our store for pickup or returned. Reshipping charges may apply for a third delivery attempt.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">8. Contact Us</h2>
          <p>
            For delivery queries:<br />
            📞 <a href={`tel:${BUSINESS.phone}`} className="text-coral hover:underline">{BUSINESS.phone}</a><br />
            ✉️ <a href={`mailto:${BUSINESS.email}`} className="text-coral hover:underline">{BUSINESS.email}</a><br />
            🏪 {BUSINESS.address}
          </p>
        </section>
      </div>
    </div>
  )
}
