import { useState, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../../lib/api'
import { Product, Category } from '../../types'
import { formatINR } from '../../lib/format'
import {
  Plus, Pencil, Trash2, X, ImagePlus, Images, Upload,
  Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface UploadingFile {
  id: string
  name: string
  preview: string
  progress: number          // 0-100
  status: 'uploading' | 'done' | 'error'
  url?: string
  error?: string
}

const emptyForm = {
  id: null as number | null,
  name: '', categoryId: '', brand: '', description: '', sku: '',
  price: '', mrp: '', stock: '', featured: false, active: true,
  imageUrls: [] as string[],
  newImageUrl: '',
  specsText: '',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminProducts() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  })
  const { data } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => (await api.get('/products', { params: { size: 100 } })).data,
  })

  function flatCategories(cats: Category[] = []): Category[] {
    return cats.flatMap((c) => [c, ...flatCategories(c.subcategories)])
  }

  function startEdit(p: Product) {
    setForm({
      id: p.id, name: p.name, categoryId: String(p.categoryId), brand: p.brand,
      description: p.description, sku: p.sku, price: String(p.price), mrp: String(p.mrp),
      stock: String(p.stock), featured: p.featured, active: p.active,
      imageUrls: [...p.imageUrls], newImageUrl: '',
      specsText: Object.entries(p.specs || {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
    })
    setUploading([])
    setShowForm(true)
  }

  function startNew() {
    setForm({ ...emptyForm, imageUrls: [] })
    setUploading([])
    setShowForm(true)
  }

  // ── Image ordering helpers ───────────────────────────────────────────────

  function addImageUrl() {
    const url = form.newImageUrl.trim()
    if (!url) return
    setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url], newImageUrl: '' }))
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== idx) }))
  }

  function moveImage(from: number, to: number) {
    const urls = [...form.imageUrls]
    const [item] = urls.splice(from, 1)
    urls.splice(to, 0, item)
    setForm((f) => ({ ...f, imageUrls: urls }))
  }

  // ── File upload logic ────────────────────────────────────────────────────

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (arr.length === 0) return

    const entries: UploadingFile[] = arr.map((file) => ({
      id: Math.random().toString(36).slice(2),
      name: file.name,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading' as const,
    }))
    setUploading((prev) => [...prev, ...entries])

    for (let i = 0; i < arr.length; i++) {
      const file  = arr[i]
      const entry = entries[i]
      const fd    = new FormData()
      fd.append('file', file)

      try {
        // Simulate progress while waiting
        const timer = setInterval(() => {
          setUploading((prev) =>
            prev.map((u) => u.id === entry.id && u.progress < 85
              ? { ...u, progress: u.progress + 15 }
              : u
            )
          )
        }, 300)

        const resp = await api.post<{ url: string }>('/admin/products/upload-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        clearInterval(timer)
        const url = resp.data.url

        setUploading((prev) =>
          prev.map((u) => u.id === entry.id
            ? { ...u, progress: 100, status: 'done', url }
            : u
          )
        )
        setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] }))

      } catch (err) {
        setUploading((prev) =>
          prev.map((u) => u.id === entry.id
            ? { ...u, status: 'error', error: apiErrorMessage(err) }
            : u
          )
        )
      }
    }
  }, [])

  // drag-and-drop
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    uploadFiles(e.dataTransfer.files)
  }

  // ── Product CRUD ─────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return
    await api.delete(`/admin/products/${id}`)
    qc.invalidateQueries({ queryKey: ['admin-products'] })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const specs: Record<string, string> = {}
    form.specsText.split('\n').forEach((line) => {
      const [k, ...rest] = line.split(':')
      if (k && rest.length) specs[k.trim()] = rest.join(':').trim()
    })
    const payload = {
      name: form.name, categoryId: Number(form.categoryId), brand: form.brand,
      description: form.description, sku: form.sku, price: Number(form.price),
      mrp: Number(form.mrp), stock: Number(form.stock), featured: form.featured,
      active: form.active, specs, imageUrls: form.imageUrls, variants: [],
    }
    try {
      if (form.id) await api.put(`/admin/products/${form.id}`, payload)
      else          await api.post('/admin/products', payload)
      qc.invalidateQueries({ queryKey: ['admin-products'] })
      setShowForm(false)
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl font-bold">Products</h1>
        <button onClick={startNew} className="flex items-center gap-1 rounded-full bg-coral text-onaccent px-4 py-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      {showForm && (
        <div className="glass rounded-card p-5 border border-hairline/10 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">{form.id ? 'Edit' : 'New'} Product</h2>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-3">
            <input required placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="SKU" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
            <select required value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm">
              <option value="">Select Category</option>
              {flatCategories(categories).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder="Brand" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
            <input required type="number" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
            <input required type="number" placeholder="MRP (₹)" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
            <input required type="number" placeholder="Stock quantity" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-1"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Active</label>
            </div>
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="md:col-span-2 bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" rows={2} />

            {/* ══ Image Manager ═══════════════════════════════════════════════ */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Images className="h-4 w-4 text-ink/40" />
                <span className="text-sm font-medium">Product Images</span>
                <span className="text-xs text-ink/40">({form.imageUrls.length} added · first = main photo)</span>
              </div>

              {/* ── Drag-and-drop upload zone ── */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`
                  relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
                  cursor-pointer transition-all py-6
                  ${dragOver
                    ? 'border-coral bg-coral/10 scale-[1.01]'
                    : 'border-hairline/20 hover:border-coral/40 hover:bg-coral/5'
                  }
                `}
              >
                <Upload className="h-7 w-7 text-ink/30" />
                <p className="text-sm text-ink/50">
                  <span className="text-coral font-semibold">Click to upload</span> or drag &amp; drop images here
                </p>
                <p className="text-xs text-ink/30">JPEG, PNG, WebP, GIF · max 5 MB per file · multiple files supported</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                />
              </div>

              {/* ── Upload progress cards ── */}
              {uploading.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploading.map((u) => (
                    <div key={u.id} className="relative w-20 h-20 rounded-lg overflow-hidden border border-hairline/20 shrink-0">
                      <img src={u.preview} alt={u.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                        {u.status === 'uploading' && (
                          <>
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                            <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-coral rounded-full transition-all"
                                style={{ width: `${u.progress}%` }}
                              />
                            </div>
                          </>
                        )}
                        {u.status === 'done' && <CheckCircle2 className="h-6 w-6 text-green-400" />}
                        {u.status === 'error' && (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <span className="text-[9px] text-red-300 text-center px-1 leading-tight">{u.error}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Committed image tiles ── */}
              {form.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {form.imageUrls.map((url, i) => (
                    <div
                      key={i}
                      className={`relative group rounded-lg overflow-hidden border-2 h-20 w-20 shrink-0
                        ${i === 0 ? 'border-coral' : 'border-hairline/20'}`}
                    >
                      <img
                        src={url}
                        alt={`Image ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=?' }}
                      />
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                        {i === 0 ? 'Main' : `#${i + 1}`}
                      </span>
                      {/* Hover controls */}
                      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                        <button type="button" onClick={() => removeImage(i)} title="Remove">
                          <X className="h-4 w-4 text-red-400 hover:text-red-300" />
                        </button>
                        <div className="flex gap-1">
                          {i > 0 && (
                            <button type="button" onClick={() => moveImage(i, i - 1)} title="Move left" className="text-white/80 hover:text-white">
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                          )}
                          {i < form.imageUrls.length - 1 && (
                            <button type="button" onClick={() => moveImage(i, i + 1)} title="Move right" className="text-white/80 hover:text-white">
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── URL paste fallback ── */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste an image URL and click Add"
                  value={form.newImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, newImageUrl: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl() } }}
                  className="flex-1 bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  disabled={!form.newImageUrl.trim()}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-coral/20 text-coral border border-coral/30 text-sm font-semibold hover:bg-coral/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ImagePlus className="h-4 w-4" /> Add URL
                </button>
              </div>
              <p className="text-xs text-ink/30">Hover image tiles to reorder (← →) or remove. First tile = main product photo.</p>
            </div>
            {/* ════════════════════════════════════════════════════════════════ */}

            <textarea
              placeholder={'Specs (key: value, one per line)\ne.g. Screen Size: 55 inch'}
              value={form.specsText}
              onChange={(e) => setForm((f) => ({ ...f, specsText: e.target.value }))}
              className="md:col-span-2 bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm font-mono"
              rows={3}
            />
            {error && <p className="md:col-span-2 text-red-400 text-sm">{error}</p>}
            <button type="submit" className="md:col-span-2 rounded-full bg-coral text-onaccent font-semibold py-2.5">
              {form.id ? 'Save Changes' : 'Create Product'}
            </button>
          </form>
        </div>
      )}

      {/* ── Products table ─────────────────────────────────────────────────── */}
      <div className="glass rounded-card border border-hairline/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-ink/40 border-b border-hairline/10">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Images</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {data?.content?.map((p: Product) => (
              <tr key={p.id} className="border-b border-hairline/10 hover:bg-panel/40 transition-colors">
                <td className="p-3 flex items-center gap-2">
                  {/* Image stack preview */}
                  <div className="relative h-10 w-10 shrink-0">
                    {p.imageUrls[1] && (
                      <img src={p.imageUrls[1]} className="absolute top-0.5 left-0.5 h-9 w-9 rounded object-cover opacity-60" />
                    )}
                    <img src={p.imageUrls[0] || 'https://placehold.co/40x40?text=?'} className="absolute h-10 w-10 rounded object-cover border border-hairline/10" />
                    {p.imageUrls.length > 1 && (
                      <span className="absolute -top-1 -right-1 bg-coral text-onaccent text-[9px] font-bold px-1 rounded-full">
                        {p.imageUrls.length}
                      </span>
                    )}
                  </div>
                  {p.name}
                </td>
                <td className="p-3 text-ink/50">{p.sku}</td>
                <td className="p-3">{formatINR(p.price)}</td>
                <td className="p-3">{p.stock}</td>
                <td className="p-3 text-ink/40">{p.imageUrls.length} photo{p.imageUrls.length !== 1 ? 's' : ''}</td>
                <td className="p-3">{p.active ? <span className="text-plum">Active</span> : <span className="text-ink/40">Hidden</span>}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => startEdit(p)}><Pencil className="h-4 w-4 text-ink/60 hover:text-coral" /></button>
                  <button onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-ink/60 hover:text-red-400" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
