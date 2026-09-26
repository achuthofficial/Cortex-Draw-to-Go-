import { useEffect } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { EmptyState } from '@/components/common/States'
import { Dashboard } from '@/features/dashboard/Dashboard'
import { RfqInbox } from '@/features/rfq/RfqInbox'
import { QuoteWorkspace } from '@/features/quote-workspace/QuoteWorkspace'
import { PartsPage } from '@/features/plm/PartsPage'
import { PartDetail } from '@/features/plm/PartDetail'
import { RevisionCompare } from '@/features/plm/RevisionCompare'
import { EcoDetail } from '@/features/plm/EcoDetail'
import { OrdersPage } from '@/features/orders/OrdersPage'
import { OrderDetail } from '@/features/orders/OrderDetail'
import { InventoryPage } from '@/features/inventory/InventoryPage'
import { PoDetail } from '@/features/inventory/PoDetail'
import { ProductionPage } from '@/features/production/ProductionPage'
import { WorkOrderDetail } from '@/features/production/WorkOrderDetail'
import { OperatorMode } from '@/features/production/OperatorMode'
import { QualityPage } from '@/features/quality/QualityPage'
import { InspectionPlanDetail } from '@/features/quality/InspectionPlanDetail'
import { NcrDetail } from '@/features/quality/NcrDetail'
import { CustomersPage, CustomerDetail } from '@/features/crm/Customers'
import { SuppliersPage, SupplierDetail } from '@/features/crm/Suppliers'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { useUi } from '@/store/ui'
import { Shell } from './Shell'

function ThemeSync() {
  const theme = useUi((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])
  return null
}

export function App() {
  const theme = useUi((s) => s.theme)
  return (
    <TooltipProvider delayDuration={300}>
      <ThemeSync />
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/operator" element={<OperatorMode />} />
          <Route path="/operator/:woId" element={<OperatorMode />} />
          <Route element={<Shell />}>
            <Route index element={<Dashboard />} />
            <Route path="rfqs" element={<RfqInbox />} />
            <Route path="quotes/:rfqId" element={<QuoteWorkspace />} />
            <Route path="parts" element={<PartsPage />} />
            <Route path="parts/:partNo" element={<PartDetail />} />
            <Route path="parts/:partNo/compare" element={<RevisionCompare />} />
            <Route path="eco/:id" element={<EcoDetail />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/po/:id" element={<PoDetail />} />
            <Route path="production" element={<ProductionPage />} />
            <Route path="production/wo/:id" element={<WorkOrderDetail />} />
            <Route path="quality" element={<QualityPage />} />
            <Route path="quality/plan/:id" element={<InspectionPlanDetail />} />
            <Route path="quality/ncr/:id" element={<NcrDetail />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="suppliers/:id" element={<SupplierDetail />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<EmptyState title="Page not found" description="That screen does not exist in this prototype." />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster position="bottom-right" theme={theme} richColors closeButton toastOptions={{ className: 'text-[13px]' }} />
    </TooltipProvider>
  )
}
