import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../../lib/api'
import { Category } from '../../types'
import { Plus, Trash2 } from 'lucide-react'

export default function AdminCategories() {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: '', parentId: '' })
  const [error, setError] = useState('')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/admin/categories', { name: form.name, parentId: form.parentId ? Number(form.parentId) : null })
      qc.invalidateQueries({ queryKey: ['categories'] })
      setForm({ name: '', parentId: '' })
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return
    await api.delete(`/admin/categories/${id}`)
    qc.invalidateQueries({ queryKey: ['categories'] })
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Categories</h1>

      <form onSubmit={handleSubmit} className="glass rounded-card p-5 border border-hairline/10 mb-8 flex gap-3 items-end flex-wrap">
        <div>
          <label className="text-xs text-ink/40 block mb-1">Category Name</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-ink/40 block mb-1">Parent (optional)</label>
          <select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
            className="bg-panel border border-hairline/15 rounded-lg px-3 py-2 text-sm">
            <option value="">None (top-level)</option>
            {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit" className="flex items-center gap-1 rounded-full bg-coral text-onaccent px-4 py-2 text-sm font-semibold">
          <Plus className="h-4 w-4" /> Add
        </button>
        {error && <p className="text-red-400 text-sm w-full">{error}</p>}
      </form>

      <div className="space-y-3">
        {categories?.map((c) => (
          <div key={c.id} className="glass rounded-card p-4 border border-hairline/10">
            <div className="flex justify-between items-center">
              <span className="font-medium">{c.name}</span>
              <button onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-ink/40 hover:text-red-400" /></button>
            </div>
            {c.subcategories.length > 0 && (
              <div className="mt-2 pl-4 space-y-1">
                {c.subcategories.map((s) => (
                  <div key={s.id} className="flex justify-between items-center text-sm text-ink/60">
                    <span>— {s.name}</span>
                    <button onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5 hover:text-red-400" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
