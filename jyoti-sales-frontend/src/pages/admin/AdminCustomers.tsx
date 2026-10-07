import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { User } from '../../types'

export default function AdminCustomers() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => (await api.get('/admin/customers', { params: { size: 50 } })).data,
  })

  async function toggleBlock(user: User) {
    await api.patch(`/admin/customers/${user.id}/${user.blocked ? 'unblock' : 'block'}`)
    qc.invalidateQueries({ queryKey: ['admin-customers'] })
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Customers</h1>
      <div className="glass rounded-card border border-hairline/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-ink/40 border-b border-hairline/10">
            <tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {data?.content?.map((u: User) => (
              <tr key={u.id} className="border-b border-hairline/10">
                <td className="p-3">{u.fullName}</td>
                <td className="p-3 text-ink/50">{u.email || u.phone}</td>
                <td className="p-3">{u.role === 'ROLE_ADMIN' ? 'Admin' : 'Customer'}</td>
                <td className="p-3">{u.blocked ? <span className="text-red-400">Blocked</span> : <span className="text-plum">Active</span>}</td>
                <td className="p-3">
                  {u.role !== 'ROLE_ADMIN' && (
                    <button onClick={() => toggleBlock(u)} className="text-xs text-ink/60 hover:text-coral">
                      {u.blocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
