import { BUSINESS } from '../lib/business'

export default function TermsAndConditions() {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs text-ink/40 uppercase tracking-widest mb-2">Legal</p>
        <h1 className="font-display text-3xl font-bold mb-3">Terms &amp; Conditions</h1>
        <p className="text-sm text-ink/40">Last updated: {today}</p>
      </div>

      <div className="prose prose-sm max-w-none space-y-8 text-ink/70 leading-relaxed">

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the {BUSINESS.name} platform ("Platform"), you agree to be bound by these
            Terms &amp; Conditions. If you do not agree, please do not use the Platform.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">2. About Us</h2>
          <p>
            {BUSINESS.name} ({BUSINESS.altName}) is a consumer electronics retail business operating from
            {' '}{BUSINESS.address}. GSTIN: {BUSINESS.gstin}.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">3. Eligibility</h2>
          <p>
            You must be at least 18 years of age to place an order on this Platform. By placing an order,
            you confirm that you are 18 or older and legally capable of entering into a contract.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">4. Product Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>We make every effort to display accurate product descriptions, images, and prices.</li>
            <li>Prices are in Indian Rupees (₹) and inclusive of applicable taxes unless stated otherwise.</li>
            <li>We reserve the right to correct pricing errors. If a product is incorrectly priced, we will notify you and you may choose to proceed at the correct price or cancel your order.</li>
            <li>Product images are for illustrative purposes. Actual product colour may vary slightly.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">5. Orders &amp; Payment</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Placing an order constitutes an offer to purchase the product. The contract is formed when we confirm and dispatch the order.</li>
            <li>We accept payment via UPI, credit/debit cards, net banking, wallets (processed by Razorpay), and Cash on Delivery.</li>
            <li>All online transactions are secured by Razorpay's PCI-DSS-compliant infrastructure.</li>
            <li>We reserve the right to refuse or cancel any order at our discretion, including for fraud detection, stock unavailability, or pricing errors. A full refund will be issued in such cases.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">6. Delivery</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Delivery timelines are estimates and may vary due to location, weather, or courier conditions.</li>
            <li>We currently deliver within our serviceable areas. Contact us to check availability for your pincode.</li>
            <li>Risk of loss and title passes to you upon delivery to the specified address.</li>
            <li>Large appliances (ACs, refrigerators, washing machines) may require scheduled installation. Our team will contact you to arrange this.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">7. Warranty</h2>
          <p>
            All products are covered by the manufacturer's standard warranty. Warranty claims should be directed
            to the manufacturer's authorised service centre or to us — we will assist in facilitating the claim.
            Warranty does not cover accidental damage, misuse, or water damage.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">8. User Accounts</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>Notify us immediately of any unauthorised use of your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">9. Prohibited Conduct</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Placing fraudulent or duplicate orders.</li>
            <li>Providing false delivery or contact information.</li>
            <li>Attempting to hack, scrape, or disrupt the Platform.</li>
            <li>Misuse of coupon codes or promotional offers.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">10. Intellectual Property</h2>
          <p>
            All content on the Platform — logos, text, images, and design — is the property of {BUSINESS.name}
            or its licensors. Reproduction without written permission is prohibited.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">11. Limitation of Liability</h2>
          <p>
            To the extent permitted by law, {BUSINESS.name} shall not be liable for indirect, incidental, or
            consequential damages arising from your use of the Platform. Our maximum liability in any case
            is limited to the value of the order in question.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive
            jurisdiction of the courts in Punjab, India.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">13. Contact</h2>
          <p>
            {BUSINESS.name} · {BUSINESS.address}<br />
            Email: <a href={`mailto:${BUSINESS.email}`} className="text-coral hover:underline">{BUSINESS.email}</a><br />
            Phone: {BUSINESS.phone}
          </p>
        </section>
      </div>
    </div>
  )
}
