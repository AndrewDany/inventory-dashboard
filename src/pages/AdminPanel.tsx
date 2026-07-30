import { Outlet } from 'react-router-dom'
import PageLayout from '../components/layout/PageLayout'

export default function AdminPanel() {
  return (
    <PageLayout title="Admin Panel">
      <div className="space-y-6">
        {/* Hero banner */}
        <div className="overflow-hidden rounded-[32px] border border-indigo-200 bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-600 p-8 text-white shadow-[0_24px_70px_rgba(79,70,229,0.18)]">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Executive command center
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                Manage inventory operations with precision
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
                Control locations, users, suppliers, purchase orders, and stock movement activity from a refined, high-confidence workspace.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Coverage</p>
                <p className="mt-2 text-lg font-semibold text-white">Multi-site</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Access</p>
                <p className="mt-2 text-lg font-semibold text-white">Role-based</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">Audit</p>
                <p className="mt-2 text-lg font-semibold text-white">Trackable</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page content from nested route */}
        <div className="rounded-[24px] border border-slate-200/80 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.06)] p-6">
          <Outlet />
        </div>
      </div>
    </PageLayout>
  )
}

