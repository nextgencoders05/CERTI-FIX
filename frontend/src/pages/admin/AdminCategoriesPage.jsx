import React, { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { categoryAPI } from '../../services/endpoints'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    categoryAPI
      .list(true)
      .then((res) => setCategories(res.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    await categoryAPI.create({ name, description })
    setName('')
    setDescription('')
    load()
  }

  const columns = [
    { key: 'name', label: 'Category Name', render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: 'description', label: 'Description' },
    {
      key: 'is_active',
      label: 'Status',
      render: (r) => <StatusBadge status={r.is_active ? 'verified' : 'suspended'} />,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Certificate Categories</h1>
        <p className="text-sm text-slate-600">Manage default and custom certificate categories.</p>
      </div>

      <form onSubmit={handleAdd} className="card flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-700 mb-1">New Category Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div className="flex-1 min-w-[240px]">
          <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" />
        </div>
        <button type="submit" className="btn-primary">
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </form>

      <DataTable columns={columns} data={categories} loading={loading} searchKeys={['name']} />
    </div>
  )
}
