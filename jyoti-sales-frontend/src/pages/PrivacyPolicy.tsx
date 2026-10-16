import { BUSINESS } from '../lib/business'

export default function PrivacyPolicy() {
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs text-ink/40 uppercase tracking-widest mb-2">Legal</p>
        <h1 className="font-display text-3xl font-bold mb-3">Privacy Policy</h1>
        <p className="text-sm text-ink/40">Last updated: {today}</p>
      </div>

      <div className="prose prose-sm prose-invert max-w-none space-y-8 text-ink/70 leading-relaxed">

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">1. Who We Are</h2>
          <p>
            {BUSINESS.name} ({BUSINESS.altName}), located at {BUSINESS.address}, operates the
            website and mobile web platform at this domain (the "Platform"). We are an electronics retail
            business selling TVs, ACs, refrigerators, and other consumer electronics.
          </p>
          <p className="mt-2">For privacy-related queries, contact us at <a href={`mailto:${BUSINESS.email}`} className="text-coral hover:underline">{BUSINESS.email}</a>.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">2. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account information:</strong> name, email address, and/or phone number when you register or sign in via Google or phone OTP.</li>
            <li><strong>Order information:</strong> delivery address, items purchased, payment method, and transaction IDs.</li>
            <li><strong>Payment information:</strong> we do <strong>not</strong> store card numbers, CVVs, UPI credentials, or net banking passwords. All payment data is processed by Razorpay (a PCI-DSS-compliant payment gateway). We only store Razorpay order and payment reference IDs.</li>
            <li><strong>Usage data:</strong> pages visited, search queries, and device/browser type for analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To process and fulfill your orders.</li>
            <li>To send order confirmation, shipping, and delivery notifications via email or SMS.</li>
            <li>To respond to your queries and provide customer support.</li>
            <li>To improve our Platform and personalise your shopping experience.</li>
            <li>To comply with applicable laws and regulations.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">4. Information Sharing</h2>
          <p>We do <strong>not</strong> sell, rent, or trade your personal information to third parties. We share data only with:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Razorpay</strong> — to process payments. Governed by <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener" className="text-coral hover:underline">Razorpay's Privacy Policy</a>.</li>
            <li><strong>Google Firebase</strong> — for authentication (Google Sign-In, Phone OTP). Governed by <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener" className="text-coral hover:underline">Google's Privacy Policy</a>.</li>
            <li><strong>Courier/logistics partners</strong> — your name, phone, and delivery address are shared with the delivery partner for your order.</li>
            <li><strong>Legal authorities</strong> — when required by law or court order.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">5. Data Security</h2>
          <p>
            We use industry-standard security measures including HTTPS encryption, JWT-based authentication,
            bcrypt password hashing, and access-controlled databases. However, no internet transmission is
            100% secure. We encourage you to keep your account credentials confidential.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">6. Cookies</h2>
          <p>
            We use browser local storage (not third-party cookies) to maintain your login session and cart.
            We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">7. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Request access to the personal data we hold about you.</li>
            <li>Request correction or deletion of your personal data.</li>
            <li>Withdraw consent for communications by contacting us.</li>
          </ul>
          <p className="mt-2">To exercise these rights, email us at <a href={`mailto:${BUSINESS.email}`} className="text-coral hover:underline">{BUSINESS.email}</a>.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">8. Children's Privacy</h2>
          <p>Our Platform is not directed at children under 13. We do not knowingly collect personal information from minors.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Continued use of the Platform after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-ink mb-2">10. Contact Us</h2>
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
