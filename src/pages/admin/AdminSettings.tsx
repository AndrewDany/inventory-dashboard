import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  Globe2,
  KeyRound,
  LayoutDashboard,
  Languages,
  Moon,
  PackageSearch,
  Palette,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useSettings, useUpdateSetting } from '@/hooks/useSettings'
import { useLanguage } from '@/contexts/LanguageContext'

type TabId = 'organization' | 'inventory' | 'notifications' | 'language' | 'preferences'

const tabs: Array<{ id: TabId; label: string; icon: typeof Building2 }> = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'inventory', label: 'Inventory', icon: PackageSearch },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'language', label: 'Language', icon: Languages },
  { id: 'preferences', label: 'Preferences', icon: Palette },
]

const settingKeys = [
  'company_name',
  'currency',
  'timezone',
  'default_reorder_level',
  'default_date_range',
  'low_stock_alerts',
  'purchase_order_updates',
  'activity_summary',
  'language',
  'dashboard_density',
  'theme_mode',
  'accent_color',
] as const

type SettingsDraft = Record<(typeof settingKeys)[number], string>

const defaults: SettingsDraft = {
  company_name: '',
  currency: 'USD',
  timezone: 'America/Los_Angeles',
  default_reorder_level: '10',
  default_date_range: '30',
  low_stock_alerts: 'true',
  purchase_order_updates: 'true',
  activity_summary: 'false',
  language: 'en',
  dashboard_density: 'comfortable',
  theme_mode: 'system',
  accent_color: 'indigo',
}

type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'pt-BR'

const languageCopy: Record<LanguageCode, {
  settings: string
  subtitle: string
  save: string
  saving: string
  tabs: Record<TabId, string>
  languageTitle: string
  languageDescription: string
  interfaceLanguage: string
  interfaceLanguageHelp: string
  translationReadiness: string
  translationDescription: string
  preview: string
}> = {
  en: {
    settings: 'Settings', subtitle: 'Manage organization defaults, inventory policies, and operational preferences.', save: 'Save changes', saving: 'Saving changes...',
    tabs: { organization: 'Organization', inventory: 'Inventory', notifications: 'Notifications', language: 'Language', preferences: 'Preferences' },
    languageTitle: 'Language & regional format', languageDescription: 'Choose the primary language preference for this operations workspace.', interfaceLanguage: 'Interface language', interfaceLanguageHelp: 'Changes apply immediately in Settings. Save to keep this preference.', translationReadiness: 'Translation readiness', translationDescription: 'Settings navigation and language controls update immediately. Full workspace translation can be expanded screen by screen.', preview: 'Language preview',
  },
  es: {
    settings: 'Configuración', subtitle: 'Administra los valores predeterminados de la organización, las políticas de inventario y las preferencias operativas.', save: 'Guardar cambios', saving: 'Guardando cambios...',
    tabs: { organization: 'Organización', inventory: 'Inventario', notifications: 'Notificaciones', language: 'Idioma', preferences: 'Preferencias' },
    languageTitle: 'Idioma y formato regional', languageDescription: 'Elige el idioma principal para este espacio de operaciones.', interfaceLanguage: 'Idioma de la interfaz', interfaceLanguageHelp: 'Los cambios se aplican inmediatamente en Configuración. Guarda para mantener esta preferencia.', translationReadiness: 'Estado de la traducción', translationDescription: 'La navegación y los controles de idioma de Configuración se actualizan inmediatamente. La traducción completa se puede ampliar pantalla por pantalla.', preview: 'Vista previa del idioma',
  },
  fr: {
    settings: 'Paramètres', subtitle: 'Gérez les paramètres de l’organisation, les règles d’inventaire et les préférences opérationnelles.', save: 'Enregistrer', saving: 'Enregistrement...',
    tabs: { organization: 'Organisation', inventory: 'Inventaire', notifications: 'Notifications', language: 'Langue', preferences: 'Préférences' },
    languageTitle: 'Langue et format régional', languageDescription: 'Choisissez la langue principale de cet espace opérationnel.', interfaceLanguage: 'Langue de l’interface', interfaceLanguageHelp: 'Les modifications s’appliquent immédiatement dans les paramètres. Enregistrez pour conserver cette préférence.', translationReadiness: 'État de la traduction', translationDescription: 'La navigation et les commandes linguistiques des paramètres se mettent à jour immédiatement. La traduction complète peut être étendue écran par écran.', preview: 'Aperçu de la langue',
  },
  de: {
    settings: 'Einstellungen', subtitle: 'Verwalten Sie Organisationsvorgaben, Bestandsrichtlinien und betriebliche Präferenzen.', save: 'Änderungen speichern', saving: 'Änderungen werden gespeichert...',
    tabs: { organization: 'Organisation', inventory: 'Inventar', notifications: 'Benachrichtigungen', language: 'Sprache', preferences: 'Präferenzen' },
    languageTitle: 'Sprache und Regionalformat', languageDescription: 'Wählen Sie die primäre Sprache für diesen Arbeitsbereich.', interfaceLanguage: 'Oberflächensprache', interfaceLanguageHelp: 'Änderungen werden in den Einstellungen sofort angewendet. Speichern Sie die Auswahl dauerhaft.', translationReadiness: 'Übersetzungsstatus', translationDescription: 'Navigation und Sprachsteuerung in den Einstellungen werden sofort aktualisiert. Die vollständige Übersetzung kann Seite für Seite erweitert werden.', preview: 'Sprachvorschau',
  },
  'pt-BR': {
    settings: 'Configurações', subtitle: 'Gerencie padrões da organização, políticas de estoque e preferências operacionais.', save: 'Salvar alterações', saving: 'Salvando alterações...',
    tabs: { organization: 'Organização', inventory: 'Estoque', notifications: 'Notificações', language: 'Idioma', preferences: 'Preferências' },
    languageTitle: 'Idioma e formato regional', languageDescription: 'Escolha o idioma principal deste espaço de operações.', interfaceLanguage: 'Idioma da interface', interfaceLanguageHelp: 'As alterações são aplicadas imediatamente em Configurações. Salve para manter esta preferência.', translationReadiness: 'Status da tradução', translationDescription: 'A navegação e os controles de idioma das Configurações são atualizados imediatamente. A tradução completa pode ser ampliada tela por tela.', preview: 'Prévia do idioma',
  },
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  )
}

function Field({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      {helper && <span className="mt-1 block text-xs leading-5 text-slate-500">{helper}</span>}
      <div className="mt-2">{children}</div>
    </label>
  )
}

function ChoiceCard({ selected, onClick, icon, title, description }: {
  selected: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-28 w-full flex-col items-start rounded-xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        selected
          ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
      }`}
    >
      <span className={`mb-3 ${selected ? 'text-indigo-700' : 'text-slate-500'}`}>{icon}</span>
      <span className="text-sm font-semibold text-slate-900">{title}</span>
      <span className="mt-1 text-xs leading-5 text-slate-500">{description}</span>
      {selected && <Check size={16} className="absolute right-3 top-3 text-indigo-700" aria-label="Selected" />}
    </button>
  )
}

function ToggleRow({ checked, onChange, title, description }: { checked: boolean; onChange: (value: boolean) => void; title: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 py-4 last:border-0 last:pb-0 first:pt-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

export default function AdminSettings() {
  const { setLanguage: setAppLanguage } = useLanguage()
  const { data: settings, isLoading } = useSettings()
  const updateSetting = useUpdateSetting()
  const [activeTab, setActiveTab] = useState<TabId>('organization')
  const [draft, setDraft] = useState<SettingsDraft>(defaults)
  const copy = languageCopy[draft.language as LanguageCode] ?? languageCopy.en

  useEffect(() => {
    if (!settings) return
    setDraft((current) => {
      const next = { ...current }
      settingKeys.forEach((key) => { next[key] = settings[key] ?? defaults[key] })
      return next
    })
  }, [settings])

  useEffect(() => {
    if (isLoading) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const isDark = draft.theme_mode === 'dark' || (draft.theme_mode === 'system' && mediaQuery.matches)
      document.documentElement.classList.toggle('dark', isDark)
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
    }

    applyTheme()
    mediaQuery.addEventListener('change', applyTheme)
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [draft.theme_mode, isLoading])

  useEffect(() => {
    if (!isLoading) document.documentElement.lang = draft.language
  }, [draft.language, isLoading])

  const setValue = (key: keyof SettingsDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }))

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    await Promise.all(settingKeys.map((key) => updateSetting.mutateAsync({ key, value: draft[key] })))
  }

  if (isLoading) return <p className="py-8 text-sm text-slate-500">Loading organization settings...</p>

  return (
    <form onSubmit={handleSave} className="admin-settings space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
            <ShieldCheck size={15} /> Administration
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{copy.settings}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{copy.subtitle}</p>
        </div>
        <Button type="submit" disabled={updateSetting.isPending} className="shrink-0 bg-indigo-600 hover:bg-indigo-700">
          {updateSetting.isPending ? copy.saving : copy.save}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)]">
        <nav className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1.5 lg:flex-col lg:overflow-visible" aria-label="Settings sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${activeTab === id ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'}`}>
              <Icon size={16} /> {copy.tabs[id] ?? label}
            </button>
          ))}
        </nav>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          {activeTab === 'organization' && <div className="space-y-7">
            <SectionHeading title="Organization profile" description="These details appear across internal documents and operational reports." />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Company name" helper="Used in generated documents and workspace labels."><input value={draft.company_name} onChange={(e) => setValue('company_name', e.target.value)} className="settings-input" placeholder="Inventory Suite" /></Field>
              <Field label="Display currency" helper="Default currency for financial totals and reports."><select value={draft.currency} onChange={(e) => setValue('currency', e.target.value)} className="settings-input"><option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option><option value="CAD">CAD — Canadian Dollar</option></select></Field>
              <Field label="Time zone" helper="Used for activity timestamps and reporting periods."><select value={draft.timezone} onChange={(e) => setValue('timezone', e.target.value)} className="settings-input"><option value="America/Los_Angeles">Pacific Time (US & Canada)</option><option value="America/New_York">Eastern Time (US & Canada)</option><option value="Europe/London">London</option><option value="UTC">UTC</option></select></Field>
            </div>
          </div>}

          {activeTab === 'inventory' && <div className="space-y-7">
            <SectionHeading title="Inventory defaults" description="Set sensible operational defaults for new products and reporting views." />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Default reorder level" helper="Applied when a new product does not specify a reorder point."><input type="number" min="0" value={draft.default_reorder_level} onChange={(e) => setValue('default_reorder_level', e.target.value)} className="settings-input" /></Field>
              <Field label="Default reporting range" helper="Initial time range when opening dashboard reports."><select value={draft.default_date_range} onChange={(e) => setValue('default_date_range', e.target.value)} className="settings-input"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last quarter</option><option value="365">Last 12 months</option></select></Field>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900"><span className="font-semibold">Operational note:</span> changing the default reorder level affects new products only; existing product thresholds remain unchanged.</div>
          </div>}

          {activeTab === 'notifications' && <div className="space-y-7">
            <SectionHeading title="Operational notifications" description="Control which events require attention from your operations team." />
            <div className="rounded-xl border border-slate-200 p-5">
              <ToggleRow checked={draft.low_stock_alerts === 'true'} onChange={(value) => setValue('low_stock_alerts', String(value))} title="Low-stock alerts" description="Surface alerts when available stock reaches its reorder level." />
              <ToggleRow checked={draft.purchase_order_updates === 'true'} onChange={(value) => setValue('purchase_order_updates', String(value))} title="Purchase order updates" description="Notify the team when purchase order status changes." />
              <ToggleRow checked={draft.activity_summary === 'true'} onChange={(value) => setValue('activity_summary', String(value))} title="Activity summary" description="Include a concise operational activity summary in the workspace." />
            </div>
          </div>}

          {activeTab === 'language' && <div className="space-y-7">
            <SectionHeading title={copy.languageTitle} description={copy.languageDescription} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={copy.interfaceLanguage} helper={copy.interfaceLanguageHelp}>
                <select value={draft.language} onChange={(e) => { setValue('language', e.target.value); setAppLanguage(e.target.value as LanguageCode) }} className="settings-input">
                  <option value="en">English</option>
                  <option value="es">Español — Spanish</option>
                  <option value="fr">Français — French</option>
                  <option value="de">Deutsch — German</option>
                  <option value="pt-BR">Português (Brasil)</option>
                </select>
              </Field>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex gap-3">
                <Languages size={18} className="mt-0.5 shrink-0 text-indigo-600" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{copy.translationReadiness}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{copy.translationDescription}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-sm text-indigo-950"><span className="font-semibold">{copy.preview}:</span> {copy.settings} · {copy.tabs.inventory} · {copy.tabs.notifications}</div>
          </div>}

          {activeTab === 'preferences' && <div className="space-y-8">
            <SectionHeading title="Workspace preferences" description="Choose a clear, focused interface for day-to-day operations." />
            <div><div className="mb-3 flex flex-wrap items-baseline justify-between gap-2"><p className="text-sm font-medium text-slate-800">Interface mode</p><p className="text-xs text-slate-500">Applies immediately. Save changes to keep it.</p></div><div className="grid gap-3 sm:grid-cols-3">
              <ChoiceCard selected={draft.theme_mode === 'light'} onClick={() => setValue('theme_mode', 'light')} icon={<Sun size={19} />} title="Light" description="Crisp, high-contrast workspace." />
              <ChoiceCard selected={draft.theme_mode === 'dark'} onClick={() => setValue('theme_mode', 'dark')} icon={<Moon size={19} />} title="Dark" description="Reduced brightness for late shifts." />
              <ChoiceCard selected={draft.theme_mode === 'system'} onClick={() => setValue('theme_mode', 'system')} icon={<Globe2 size={19} />} title="System" description="Follow the device appearance." />
            </div></div>
            <div><p className="mb-3 text-sm font-medium text-slate-800">Information density</p><div className="grid gap-3 sm:grid-cols-3">
              <ChoiceCard selected={draft.dashboard_density === 'compact'} onClick={() => setValue('dashboard_density', 'compact')} icon={<LayoutDashboard size={19} />} title="Compact" description="More information per screen." />
              <ChoiceCard selected={draft.dashboard_density === 'comfortable'} onClick={() => setValue('dashboard_density', 'comfortable')} icon={<LayoutDashboard size={19} />} title="Comfortable" description="Balanced everyday spacing." />
              <ChoiceCard selected={draft.dashboard_density === 'spacious'} onClick={() => setValue('dashboard_density', 'spacious')} icon={<LayoutDashboard size={19} />} title="Spacious" description="Extra room for focused review." />
            </div></div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"><p className="text-sm font-semibold text-slate-800">Access & security</p><p className="mt-1 text-xs leading-5 text-slate-500">Manage users, roles, and authentication from the administration workspace.</p><Link to="/admin/users" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-800">Manage users and roles <ChevronRight size={15} /></Link><div className="mt-3 border-t border-slate-200 pt-3"><Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-950"><KeyRound size={15} /> Change your password from the dashboard profile menu</Link></div></div>
          </div>}
        </div>
      </div>
    </form>
  )
}
