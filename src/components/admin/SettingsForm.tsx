import { useState, useEffect, type FormEvent } from 'react'
import { useSettings, useUpdateSetting } from '../../hooks/useSettings'

export default function SettingsForm() {
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()

  const [companyName, setCompanyName] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')

  useEffect(() => {
    if (settings) {
      setCompanyName(settings.company_name ?? '')
      setReorderLevel(settings.default_reorder_level ?? '')
    }
  }, [settings])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await updateSetting.mutateAsync({ key: 'company_name', value: companyName })
    await updateSetting.mutateAsync({ key: 'default_reorder_level', value: reorderLevel })
  }

  if (isLoading) return <p className="text-gray-500 text-sm">Loading settings...</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Default Reorder Level (used for new items)
        </label>
        <input
          type="number"
          value={reorderLevel}
          onChange={(e) => setReorderLevel(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={updateSetting.isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
      >
        {updateSetting.isPending ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  )
}