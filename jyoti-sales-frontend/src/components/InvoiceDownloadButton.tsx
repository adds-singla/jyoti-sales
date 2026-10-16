import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

interface Props {
  orderId: number
  orderNumber: string
  /** '/orders' for customer, '/admin/orders' for admin */
  apiPath: string
}

/**
 * Reusable download-invoice button.
 * Streams the PDF blob from the backend and triggers a browser download.
 * Works for both customer (/orders/{id}/invoice) and admin (/admin/orders/{id}/invoice).
 */
export default function InvoiceDownloadButton({ orderId, orderNumber, apiPath }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`${apiPath}/${orderId}/invoice`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `Invoice-${orderNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Could not download invoice. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 pt-1">
      <button
        id={`invoice-download-${orderId}`}
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border border-coral/40 text-coral hover:bg-coral/10 transition-colors disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
          : <><Download className="h-3.5 w-3.5" /> Download Invoice</>
        }
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
