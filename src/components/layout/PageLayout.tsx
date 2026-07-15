import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function PageLayout({
  children,
  title,
  onAddItem,
  onChangePassword,
  onInviteUser,
  onSettings,
  onAddSupplier,
  onAddLocation,
}: {
  children: ReactNode
  title: string
  onAddItem?: () => void
  onChangePassword?: () => void
  onInviteUser?: () => void
  onSettings?: () => void
  onAddSupplier?: () => void
  onAddLocation?: () => void
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onAddItem={onAddItem}
        onChangePassword={onChangePassword}
        onInviteUser={onInviteUser}
        onSettings={onSettings}
        onAddSupplier={onAddSupplier}
        onAddLocation={onAddLocation}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1">
          <div className="max-w-6xl mx-auto p-4 sm:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}