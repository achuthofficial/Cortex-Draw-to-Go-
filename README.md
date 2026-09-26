

You are a senior product designer and frontend engineer. Build a complete, clickable, high-fidelity web prototype for "DrawToShip" (working name), an AI-native Manufacturing OS for small and mid-sized make-to-print manufacturers (CNC machine shops, sheet-metal fabricators, contract manufacturers).

It replaces four separate tools with one connected app: PLM (drawings, BOMs, revisions), ERP (orders, inventory, purchasing), MES (shop-floor scheduling) and QMS (inspection, NCR, CAPA). The hero feature is AI quoting: upload a 2D engineering drawing, the AI extracts dimensions and GD&T, then generates a process plan, cost estimate and customer quote in minutes.

This prototype uses only static mock data (no backend, no real AI calls). It will later be packaged as a desktop app (Tauri or Electron), so design it desktop-first and keep the code desktop-ready.

## 1. Tech stack
- React 18 + TypeScript (strict) + Vite
- Tailwind CSS + shadcn/ui components, lucide-react icons
- React Router with HashRouter (works inside a desktop wrapper)
- Zustand for in-memory app state (no backend, no browser storage)
- TanStack Table for data tables (sort, filter, column resize, row selection)
- Recharts for charts
- react-resizable-panels for split panes
- cmdk for the command palette
- Mock data as typed TS files in src/data/
- No browser-only assumptions: isolate file open/save and PDF download behind a small adapter in src/lib/platform.ts so it can be swapped for Tauri/Electron APIs later

## 2. Design direction
- Feel: precise, calm, industrial-professional. An engineering tool, not a marketing site. Dense but readable.
- Desktop-first: optimized for 1440 to 1920 px wide, fully usable at 1280 px. The only touch layout is Operator mode (tablet, 1024 px).
- Light and dark themes with a toggle in the top bar. Neutral slate/zinc grays, one primary accent (deep blue), and a separate accent for AI-generated content (violet with a sparkle icon) so users always know what the AI produced.
- Status colors: green = accepted/pass/running, amber = needs review/warning/idle, red = flagged/fail/down, blue = in progress, gray = draft.
- Typography: Inter for UI; JetBrains Mono with tabular numbers for dimensions, tolerances, part numbers and money.
- Compact tables (32 to 36 px rows), sticky headers, right-aligned numbers.
- Every AI output shows a confidence badge (High: 90% and above, Medium: 70 to 89%, Low: below 70%) and is editable. Human-edited values get an "Edited" chip.
- Accessibility: WCAG AA contrast, visible focus rings, full keyboard navigation.
- Locale: India. INR with Indian digit grouping (e.g. ₹1,25,000.00), metric units (mm, kg), dates as DD-MMM-YYYY, GST 18% on quotes.

## 3. App shell (desktop-app feel)
- Left sidebar, collapsible to icons: Dashboard, RFQs and Quotes, Parts and Drawings, Orders, Inventory and Purchasing, Production, Quality, Customers, Suppliers, Reports, Settings.
- Top bar: company name, global search and command palette (Ctrl+K), "New RFQ" button (Ctrl+N), notifications, theme toggle, user menu.
- Workspace tabs under the top bar, like an IDE: opening a quote, part or work order opens it as a tab; tabs can be closed and reordered.
- AI Copilot drawer on the right (toggle Ctrl+J), available on every page and aware of the current screen. Use canned static answers and suggested prompts such as "Why is this quote 12% higher than the last one?" and "Which jobs are at risk this week?".
- Bottom status bar: "All changes saved", AI usage, current user role, app version.
- Right-click context menus on table rows (Open, Open in new tab, Duplicate, Assign, Archive).
- Keyboard shortcuts overlay (press ?).

## 4. Screens

### 4.1 Dashboard
- KPI cards: Open RFQs, Avg quote turnaround (hours), Win rate (30 days), Quoted value this month, On-time delivery %, Open NCRs.
- Charts: RFQ-to-order funnel; win-rate trend (12 weeks); quote turnaround trend comparing manual vs AI-assisted.
- Lists: RFQs due today, jobs at risk of late delivery, machines down, AI insights feed (e.g. "3 open RFQs from Kestrel Aerodyne use SS316; review material pricing").

### 4.2 RFQs and Quotes (inbox)
- Table: RFQ no., customer, parts count, received date, due date (red when overdue), status (New, Extracting, Needs review, Costing, Sent, Won, Lost), estimator, quoted value, AI confidence.
- Filters, saved views ("My RFQs", "Due this week", "Needs review"), bulk assign.
- "New RFQ" modal: drag-and-drop drawings (PDF/image, multiple), customer picker, required quantities, due date, notes. On submit, simulate AI extraction with a staged progress animation (Reading drawing, Detecting views, Extracting dimensions, Reading GD&T, Cross-view checks, Done) over about 6 seconds, then open the Quote Workspace with pre-built mock results.

### 4.3 Quote Workspace (HERO SCREEN: highest detail and polish)
Header: RFQ no., customer, part no. and revision, status, estimator, a stepper (Upload, Extract, Review, Plan, Cost, Send), a "time saved" chip (e.g. "Quoted in 14 min, est. 3 h manual"), version history dropdown.

Layout: resizable split pane.

Left pane: drawing viewer
- Render a mock 2D engineering drawing as inline SVG: a stepped shaft with a flange, front view, side view, section A-A, title block, dimension lines, GD&T feature control frames and datum symbols A, B, C.
- Zoom, pan, fit to screen, page thumbnails.
- Layer toggles: Dimensions, GD&T, Datums, Notes, Title block.
- Colored bounding-box overlays on every extracted item (color by type; dashed border when confidence is low). Hovering or clicking an overlay highlights the matching table row on the right, and vice versa.
- Balloon mode: numbered balloons on each characteristic (reused by Quality).

Right pane: tabs
a) Extraction
- Title block card: part no., revision, description, material, finish/coating, heat treatment, general tolerance standard (e.g. ISO 2768-m), scale, units.
- Dimensions table: #, view, feature, nominal, upper/lower tolerance, type (linear, diameter, radius, angle, thread), confidence, status (Accepted, Edited, Flagged). Inline editing.
- GD&T table: #, symbol, tolerance, material condition modifier, datum references, feature, confidence, status. Render real GD&T symbols (straightness, flatness, circularity, cylindricity, line and surface profile, angularity, perpendicularity, parallelism, position, concentricity, symmetry, circular and total runout) inside proper bordered feature control frames.
- Datums list and general notes list.
- Review queue that shows low-confidence items first, an "Accept all high-confidence" button, and a counter such as "37 of 42 items reviewed".
b) Checks (manufacturability)
- Flag cards with severity (Critical, Warning, Info), e.g. "Diameter 30 h6 journal needs cylindrical grinding: adds an operation", "Hole depth 9x diameter: deep drilling required", "No tolerance on 12.5 mm step: general tolerance applied", "Front and side views disagree on overall length (120 vs 121.5)".
- Tolerance stack-up card: chain of dimensions, worst-case and RSS results vs requirement, pass/fail.
c) Process Plan
- Ordered operation cards: Op 10 Saw cut, Op 20 CNC turning, Op 30 VMC milling, Op 40 Drilling and tapping, Op 50 Heat treatment (outside), Op 60 Cylindrical grinding, Op 70 Deburr, Op 80 Final inspection (CMM).
- Each card: work center/machine, setup time, cycle time per part, tooling note, "AI rationale" tooltip. Drag to reorder; add, delete, change machine.
d) Costing
- Material: stock shape (round bar), size (e.g. 65 mm dia x 130 mm), grade (EN19), weight (auto-calculated), rate per kg, scrap %.
- Operations cost table: machine, setup hours, cycle hours x quantity, hourly rate, cost.
- Outside processing (heat treatment, plating), inspection, packaging, overhead %, margin % (slider).
- Quantity-break table for 1, 10, 50, 100 and 500 pcs: unit price, total, lead time (days). Everything recalculates live when any input changes.
- Donut chart of the cost split (material, machining, outside processing, overhead, margin).
- "Last quoted price for a similar part" with the difference shown.
e) Quote Preview
- A print-style quote document: letterhead and logo placeholder, customer details, quote no., validity (30 days), line items with quantity breaks, GST, payment and delivery terms, signature block.
- Actions: Download PDF (mock), Send by email (modal with a pre-filled draft), Mark as sent, Mark as won (creates a sales order), Mark as lost (reason picker: price, lead time, capability, no response).

### 4.4 Parts and Drawings (PLM)
- Part library table: part no., description, customer, material, current revision, status (Released, In change, Obsolete), last updated.
- Part detail with tabs: Overview, Revisions (timeline A, B, C with change notes), BOM (expandable tree with qty and unit), Drawings (viewer), Where-used, Quote and order history, Inspection plan.
- Revision compare: side-by-side drawings with changed dimensions highlighted.
- Engineering changes: ECR/ECO list and detail with an approval workflow (Draft, Review, Approved, Implemented) and affected parts.

### 4.5 Orders (ERP)
- Sales order table: SO no., customer PO no., customer, value, order date, promised date, status (Confirmed, In production, Ready to ship, Shipped, Invoiced), linked quote.
- Order detail: line items, delivery schedule, linked work orders with progress bars, dispatch documents (mock), invoice status.
- "Create from won quote" flow.

### 4.6 Inventory and Purchasing
- Stock table: material, grade, form, size, on hand, reserved, available, reorder point, location, status (OK, Low, Out).
- Purchase orders: list and detail with supplier, lines, expected date, goods-receipt status.
- AI reorder suggestion card, e.g. "Order 180 kg EN19 65 mm bar from Ironvale Steels: covers 4 open orders".

### 4.7 Production (MES)
- Machine board: a tile per machine (CNC Turning Center 1-2, VMC 1-3, 5-axis VMC, Cylindrical Grinder, Wire EDM, CMM) showing state (Running, Idle, Setup, Down, Maintenance), current job, operator and today's utilization %.
- Weekly schedule: Gantt timeline by machine; drag jobs between machines and time slots; conflicts highlighted.
- AI banner when a machine is down, e.g. "VMC 2 is down: 3 jobs affected. Suggested reschedule keeps 2 of 3 on time." with Preview and Apply (applies a pre-built alternative schedule).
- Work orders: list and detail with operations, status, planned vs actual time, good and scrap quantities.
- Operator mode: full-screen, large touch targets for a tablet at the machine: current job, drawing, start/pause/complete, record quantity, report an issue.

### 4.8 Quality (QMS)
- Inspection plans generated from the drawing's GD&T: ballooned drawing next to a characteristic table (balloon no., characteristic, nominal, tolerance, gauge/method such as vernier, micrometer, height gauge or CMM, sampling frequency).
- Inspection report entry: measured values per part with automatic pass/fail coloring and a summary.
- First Article Inspection report: AS9102-style Forms 1, 2 and 3 (mock).
- NCR list and detail: part, defect, quantity, disposition (Rework, Scrap, Use as is, Return to supplier), photo placeholders.
- CAPA board: Kanban (Open, Root cause, Action, Verification, Closed) with 5-Why and 8D templates.
- Documents: controlled documents, gauge calibration register (due dates, overdue in red), certifications (ISO 9001, AS9100) with expiry dates.

### 4.9 Customers and Suppliers
- Customer list and detail: contacts, RFQ history, win rate, total orders, average margin, quality issues.
- Supplier list and detail: materials supplied, on-time %, rejection %, open POs.

### 4.10 Reports
- Quote win/loss by customer and reason; estimator productivity (quotes per week, average time); margin by part family; on-time delivery trend; quality PPM trend; machine utilization. Date range picker and export (mock).

### 4.11 Settings
- Company profile, letterhead and GST details.
- Machines and work centers: capabilities, max part size, hourly rate, shift calendar.
- Material price list (price per kg, density).
- Quoting rules: default overhead %, margin % by customer tier, minimum order value, rounding, quote validity.
- Users and roles: Owner, Estimator, Planner, Operator, Quality, Viewer, with a permissions matrix view.
- AI settings: confidence threshold for auto-accept, and item types that always need human review.
- Integrations (placeholders): Email, Tally, SAP Business One, WhatsApp Business.

## 5. Mock data (src/data/)
Create realistic, internally consistent data where IDs link across modules:
- 1 company: "Precision Works (demo)", Hyderabad.
- 8 fictional customers (e.g. Kestrel Aerodyne, Orbitra EV Motors, Tarangi Pumps and Valves, Nilgiri Hydraulics, Vayu Rail Systems). Never use real company names.
- 5 fictional suppliers (e.g. Ironvale Steels, Kavach Alloys).
- 25 RFQs across all statuses; 3 fully detailed with complete extraction results (a stepped shaft, a flange, a bracket).
- For each detailed drawing: about 40 dimensions, 10 GD&T callouts, 3 datums and 6 notes, with overlay coordinates that match the SVG.
- 40 parts with revisions; 2 assemblies with 3-level BOMs.
- 15 sales orders, 30 work orders, 10 machines with a week of schedule.
- 20 stock items, 8 purchase orders.
- 12 NCRs, 6 CAPAs, 3 inspection plans, 15 gauges.
- Materials: EN8, EN19, EN24, C45, SS304, SS316, Al 6061-T6, IS 2062 mild steel.
- 12 weeks of history for dashboard and report charts.

## 6. Behaviour
- Every action updates in-memory state so the prototype feels real: accept/edit extraction items, reorder operations, change margin (prices recalculate), convert a quote to an order, move a job on the Gantt, change NCR status, drag CAPA cards.
- Simulated AI: skeleton loaders and staged progress; AI content marked in violet with a sparkle icon.
- Empty, loading and error states for every list.
- Toasts for completed actions; confirmation dialogs for destructive actions.
- Undo for the last edit in the Quote Workspace (Ctrl+Z).

## 7. Project structure
- src/app: shell, routes, providers
- src/features: dashboard, rfq, quote-workspace, plm, orders, inventory, production, quality, crm, reports, settings, copilot
- src/components/ui: shadcn components
- src/components/common: DataTable, StatusBadge, ConfidenceBadge, FeatureControlFrame, DrawingViewer, GanttChart, KpiCard, MoneyText
- src/data: mock data
- src/store: Zustand stores
- src/lib: formatters (INR, mm, dates), platform adapter

## 8. Build order
1. Shell, theme, navigation, command palette
2. Mock data and store
3. RFQ inbox and Quote Workspace (hero, highest polish)
4. Dashboard
5. Quality inspection plan (reuses the extraction data)
6. Production board and Gantt
7. PLM, Orders, Inventory, Customers/Suppliers, Reports, Settings

## 9. Acceptance criteria
- Every sidebar item opens a working screen filled with mock data; no dead links.
- The full demo path works without a page reload: New RFQ, simulated extraction, review and accept, process plan, costing with live recalculation, quote preview, mark won, sales order created, work orders appear in Production, inspection plan appears in Quality.
- Clicking a drawing overlay highlights its table row, and vice versa.
- Works in light and dark mode; no layout breaks at 1280 px.
- No console errors; TypeScript strict mode passes.

---

## Running the prototype

The prototype described above lives in this repository.

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # TypeScript strict
npm run build      # static build in dist/ (relative paths, HashRouter: ready for Tauri/Electron)
```

All data is static mock data in `src/data/`, held in memory by Zustand (`src/store/`). Reloading the page resets the demo.

### Demo path (about 2 minutes)

1. Press **Ctrl+N**, click **Use sample drawing**, then **Create and extract**. Watch the staged AI extraction.
2. The Quote Workspace opens. Click **Accept all high-confidence**, then press **J** once and hold **A** to accept the rest of the review queue. When everything is reviewed the RFQ moves to Costing.
3. Press **3** (Process plan) to reorder operations, **4** (Costing) to move the margin slider and watch prices recalculate. **Ctrl+Z** undoes the last edit.
4. Press **5** (Quote preview), then **Mark as won**. A sales order, a work order (placed on the Production schedule) and a draft inspection plan (in Quality) are created.

Other things to try: hover or click a box on the drawing to highlight its table row (and the reverse), **Balloons** on the drawing toolbar, **Ctrl+J** for the Copilot ("Why is this quote 12% higher than the last one?"), **Ctrl+K** for the command palette, **?** for all shortcuts, Production → **Preview/Apply** on the VMC 2 reschedule, drag jobs on the Gantt, drag CAPA cards, Operator mode from any machine tile, and Settings → Prototype → **Simulate data errors** to see error states.

### Project layout

| Path | Contents |
| --- | --- |
| `src/app` | Shell (sidebar, top bar, workspace tabs, status bar), routes, command palette, shortcuts |
| `src/features` | One folder per module: dashboard, rfq, quote-workspace, plm, orders, inventory, production, quality, crm, reports, settings, copilot |
| `src/components/ui` | shadcn/ui components (Radix based) |
| `src/components/common` | DataTable, StatusBadge, ConfidenceBadge, FeatureControlFrame, DrawingViewer, GanttChart, KpiCard, MoneyText |
| `src/data` | Typed mock data; `drawings/` holds the three fully extracted drawings (shaft, flange, bracket) |
| `src/lib` | INR/mm/date formatters, costing engine, drawing layout engine, `platform.ts` adapter for file and PDF I/O |

The drawings are generated from the same annotation data as the extraction tables (`src/lib/drawing.ts`), so overlay boxes always line up with the SVG.
