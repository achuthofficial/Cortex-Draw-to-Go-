import { BarChart3, Boxes, Building2, ClipboardList, DraftingCompass, Factory, Inbox, LayoutDashboard, Settings, ShieldCheck, Truck } from 'lucide-react'

export const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/rfqs', label: 'RFQs and Quotes', icon: Inbox, match: ['/rfqs', '/quotes'] },
  { to: '/parts', label: 'Parts and Drawings', icon: DraftingCompass, match: ['/parts', '/eco'] },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/inventory', label: 'Inventory and Purchasing', icon: Boxes },
  { to: '/production', label: 'Production', icon: Factory },
  { to: '/quality', label: 'Quality', icon: ShieldCheck },
  { to: '/customers', label: 'Customers', icon: Building2 },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export const SHORTCUTS: { keys: string[]; label: string; group: string }[] = [
  { keys: ['Ctrl', 'K'], label: 'Command palette and search', group: 'General' },
  { keys: ['Ctrl', 'N'], label: 'New RFQ', group: 'General' },
  { keys: ['Ctrl', 'J'], label: 'Toggle AI Copilot', group: 'General' },
  { keys: ['Ctrl', 'B'], label: 'Collapse sidebar', group: 'General' },
  { keys: ['?'], label: 'Keyboard shortcuts', group: 'General' },
  { keys: ['Alt', 'W'], label: 'Close workspace tab', group: 'Tabs' },
  { keys: ['Alt', '['], label: 'Previous tab', group: 'Tabs' },
  { keys: ['Alt', ']'], label: 'Next tab', group: 'Tabs' },
  { keys: ['Ctrl', 'Z'], label: 'Undo last edit (Quote Workspace)', group: 'Quote Workspace' },
  { keys: ['A'], label: 'Accept selected item', group: 'Quote Workspace' },
  { keys: ['F'], label: 'Flag selected item', group: 'Quote Workspace' },
  { keys: ['J', 'K'], label: 'Next / previous item in review queue', group: 'Quote Workspace' },
  { keys: ['1…6'], label: 'Switch workspace tab (Extraction … Preview)', group: 'Quote Workspace' },
  { keys: ['+', '−', '0'], label: 'Zoom in, out, fit (drawing focused)', group: 'Drawing viewer' },
  { keys: ['↑', '↓'], label: 'Move between table rows', group: 'Tables' },
  { keys: ['Enter'], label: 'Open row', group: 'Tables' },
  { keys: ['Shift', 'F10'], label: 'Row context menu', group: 'Tables' },
]
