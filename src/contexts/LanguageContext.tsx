import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSettings } from '@/hooks/useSettings'

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'pt-BR'

type LanguageContextValue = { language: LanguageCode; setLanguage: (language: LanguageCode) => void; t: (text: string) => string }

const translations: Record<LanguageCode, Record<string, string>> = {
  en: {},
  es: { 'Overview': 'Resumen', 'Dashboard': 'Panel', 'Point of Sale': 'Punto de venta', 'Executive Overview': 'Resumen ejecutivo', 'Inventory & Operations': 'Inventario y operaciones', 'Locations': 'Ubicaciones', 'Stock Movements': 'Movimientos de existencias', 'FIFO Batches': 'Lotes FIFO', 'Adjustments': 'Ajustes', 'Low Stock Alerts': 'Alertas de stock bajo', 'Commerce & Orders': 'Comercio y pedidos', 'Purchase Orders': 'Órdenes de compra', 'Sales Orders': 'Órdenes de venta', 'Suppliers': 'Proveedores', 'Returns & Replacements': 'Devoluciones y reemplazos', 'Finance & Governance': 'Finanzas y control', 'P&L Financials': 'Finanzas de pérdidas y ganancias', 'Valuation': 'Valoración', 'Reports & Analytics': 'Informes y análisis', 'Users & Roles': 'Usuarios y roles', 'Audit Trail': 'Auditoría', 'Activity Logs': 'Registros de actividad', 'Settings': 'Configuración', 'Quick Actions': 'Acciones rápidas', 'Add Product': 'Agregar producto', 'Sell Item': 'Vender artículo', 'Bulk Import': 'Importación masiva', 'New PO': 'Nueva orden de compra', 'Add Supplier': 'Agregar proveedor', 'Add Location': 'Agregar ubicación', 'Invite User': 'Invitar usuario', 'Change Password': 'Cambiar contraseña', 'Sign out': 'Cerrar sesión', 'Inventory Dashboard': 'Panel de inventario', 'Admin Panel': 'Panel de administración', 'Product Management': 'Gestión de productos', 'Live Audit Feed': 'Actividad de auditoría en vivo', 'Stage Sale Item': 'Preparar artículo para venta', 'Select Available Product SKU...': 'Selecciona el SKU de producto disponible...', 'Cart': 'Carrito', 'Checkout': 'Finalizar compra' },
  fr: { 'Overview': 'Vue d’ensemble', 'Dashboard': 'Tableau de bord', 'Point of Sale': 'Point de vente', 'Executive Overview': 'Vue exécutive', 'Inventory & Operations': 'Stocks et opérations', 'Locations': 'Emplacements', 'Stock Movements': 'Mouvements de stock', 'Low Stock Alerts': 'Alertes de stock faible', 'Purchase Orders': 'Commandes fournisseurs', 'Sales Orders': 'Commandes clients', 'Suppliers': 'Fournisseurs', 'Users & Roles': 'Utilisateurs et rôles', 'Settings': 'Paramètres', 'Quick Actions': 'Actions rapides', 'Add Product': 'Ajouter un produit', 'Sell Item': 'Vendre un article', 'Sign out': 'Se déconnecter', 'Inventory Dashboard': 'Tableau de bord des stocks', 'Admin Panel': 'Panneau d’administration', 'Product Management': 'Gestion des produits', 'Live Audit Feed': 'Flux d’audit en direct', 'Cart': 'Panier', 'Checkout': 'Passer au paiement' },
  de: { 'Overview': 'Übersicht', 'Dashboard': 'Dashboard', 'Point of Sale': 'Kassensystem', 'Executive Overview': 'Managementübersicht', 'Inventory & Operations': 'Bestand und Betrieb', 'Locations': 'Standorte', 'Stock Movements': 'Bestandsbewegungen', 'Low Stock Alerts': 'Warnungen bei niedrigem Bestand', 'Purchase Orders': 'Bestellungen', 'Sales Orders': 'Verkaufsaufträge', 'Suppliers': 'Lieferanten', 'Users & Roles': 'Benutzer und Rollen', 'Settings': 'Einstellungen', 'Quick Actions': 'Schnellaktionen', 'Add Product': 'Produkt hinzufügen', 'Sell Item': 'Artikel verkaufen', 'Sign out': 'Abmelden', 'Inventory Dashboard': 'Bestandsdashboard', 'Admin Panel': 'Administrationsbereich', 'Product Management': 'Produktverwaltung', 'Live Audit Feed': 'Live-Auditprotokoll', 'Cart': 'Warenkorb', 'Checkout': 'Kasse' },
  'pt-BR': { 'Overview': 'Visão geral', 'Dashboard': 'Painel', 'Point of Sale': 'Ponto de venda', 'Executive Overview': 'Visão executiva', 'Inventory & Operations': 'Estoque e operações', 'Locations': 'Locais', 'Stock Movements': 'Movimentações de estoque', 'Low Stock Alerts': 'Alertas de estoque baixo', 'Purchase Orders': 'Pedidos de compra', 'Sales Orders': 'Pedidos de venda', 'Suppliers': 'Fornecedores', 'Users & Roles': 'Usuários e funções', 'Settings': 'Configurações', 'Quick Actions': 'Ações rápidas', 'Add Product': 'Adicionar produto', 'Sell Item': 'Vender item', 'Sign out': 'Sair', 'Inventory Dashboard': 'Painel de inventário', 'Admin Panel': 'Painel administrativo', 'Product Management': 'Gestão de produtos', 'Live Audit Feed': 'Feed de auditoria ao vivo', 'Cart': 'Carrinho', 'Checkout': 'Finalizar compra' },
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings()
  const [language, setLanguage] = useState<LanguageCode>('en')
  useEffect(() => { const stored = settings?.language; if (stored && stored in translations) setLanguage(stored as LanguageCode) }, [settings?.language])
  useEffect(() => { document.documentElement.lang = language }, [language])
  const value = useMemo(() => ({ language, setLanguage, t: (text: string) => translations[language][text] ?? text }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
