import { daysFromToday } from '@/lib/dates'
import type { Capa, Certification, ControlledDoc, Gauge, Ncr } from './types'

export const ncrs: Ncr[] = [
  { id: 'NCR-26-052', partNo: 'OEV-SH-104', woId: 'WO-26-0397', defect: 'Ø25 k6 oversize', description: 'Ø25 k6 measured 25.019–25.022 on 3 parts after turning; insert wear suspected.', qty: 3, disposition: 'Rework', status: 'Open', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-1), source: 'In-process', capaId: 'CAPA-26-009' },
  { id: 'NCR-26-051', partNo: 'SAT-BR-090', woId: 'WO-26-0393', defect: 'Burr on slot edge', description: 'Burrs on slot edges beyond 0.3 mm on 11 parts.', qty: 11, disposition: 'Rework', status: 'Dispositioned', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-2), source: 'In-process' },
  { id: 'NCR-26-050', partNo: 'SS316 Round bar Ø160', supplierId: 's-kavach', defect: 'Missing mill TC', description: 'Heat no. 7Q2291 received without EN 10204 3.1 certificate.', qty: 120, disposition: 'Pending', status: 'Under review', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-1), source: 'Incoming' },
  { id: 'NCR-26-049', partNo: 'OEV-MB-210', woId: 'WO-26-0406', defect: 'Position of Ø32 bore out', description: 'Bore position 0.07 vs Ø0.05 allowed on 4 parts (fixture shift).', qty: 4, disposition: 'Scrap', status: 'Closed', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-9), source: 'Final inspection', capaId: 'CAPA-26-008' },
  { id: 'NCR-26-048', partNo: 'KA-7725-PN', defect: 'Hardness below spec', description: 'Hardness 26 HRC vs 28–32 required, batch from Agnikund.', qty: 40, disposition: 'Return to supplier', status: 'Closed', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-15), source: 'Incoming', supplierId: 's-agnikund' },
  { id: 'NCR-26-047', partNo: 'NH-PL-330', defect: 'Premature wear (field)', description: 'Customer return: wear marks after 1,800 h service.', qty: 6, disposition: 'Pending', status: 'Under review', raisedBy: 'u-ravi', raisedAt: daysFromToday(-4), source: 'Customer return', capaId: 'CAPA-26-010' },
  { id: 'NCR-26-046', partNo: 'TPV-IM-210', woId: 'WO-26-0402', defect: 'Surface finish Ra 1.2 vs 0.8', description: 'Chatter marks on bore after turning.', qty: 2, disposition: 'Use as is', status: 'Closed', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-11), source: 'In-process' },
  { id: 'NCR-26-045', partNo: 'VRS-FL-340', woId: 'WO-26-0391', defect: 'Thread damage M12', description: 'Handling damage on 2 tapped holes during packing.', qty: 2, disposition: 'Rework', status: 'Closed', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-20), source: 'Final inspection' },
  { id: 'NCR-26-044', partNo: 'Clear anodise lot 2231', supplierId: 's-chamak', defect: 'Coating thickness 6 µm', description: 'Anodise thickness below 10 µm minimum on 30 pcs.', qty: 30, disposition: 'Return to supplier', status: 'Closed', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-26), source: 'Incoming', capaId: 'CAPA-26-007' },
  { id: 'NCR-26-043', partNo: 'NH-RD-112', woId: 'WO-26-0390', defect: 'Straightness 0.06 vs 0.03', description: 'Rod bent after heat treatment; straightened and re-ground.', qty: 5, disposition: 'Rework', status: 'Closed', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-33), source: 'In-process' },
  { id: 'NCR-26-042', partNo: 'DMD-SP-008', woId: 'WO-26-0395', defect: 'Keyway width 2.03 vs 2 N9', description: 'EDM offset error on first 2 parts.', qty: 2, disposition: 'Scrap', status: 'Closed', raisedBy: 'u-lakshmi', raisedAt: daysFromToday(-7), source: 'In-process' },
  { id: 'NCR-26-041', partNo: 'KPG-CP-118', woId: 'WO-26-0394', defect: 'Missing chamfer', description: 'Bore chamfer 1×45° missed on 1 part.', qty: 1, disposition: 'Rework', status: 'Closed', raisedBy: 'u-deepak', raisedAt: daysFromToday(-12), source: 'Final inspection' },
]

export const capas: Capa[] = [
  { id: 'CAPA-26-010', title: 'Valve plate field wear (Nilgiri)', ncrIds: ['NCR-26-047'], stage: 'Root cause', owner: 'u-lakshmi', dueDate: daysFromToday(14), method: '8D', whys: ['Plate shows adhesive wear on sealing land.', 'EN8 untreated hardness ~190 HB is too soft for the duty cycle.', 'Material chosen in 2019 for a lower pressure rating.'], actions: ['D3: Containment — inspect 60 pcs in customer stock.', 'D5: Propose EN19 H&T via ECR-26-023.'] },
  { id: 'CAPA-26-009', title: 'Ø25 k6 oversize on OEV-SH-104', ncrIds: ['NCR-26-052'], stage: 'Open', owner: 'u-farhan', dueDate: daysFromToday(7), method: '5-Why', whys: ['Diameter drifted +0.02 over 40 parts.'], actions: [] },
  { id: 'CAPA-26-008', title: 'Fixture shift on VMC 2 bracket fixture', ncrIds: ['NCR-26-049'], stage: 'Action', owner: 'u-farhan', dueDate: daysFromToday(3), method: '5-Why', whys: ['Bore position out on 4 parts.', 'Part moved in the fixture.', 'Clamp torque not specified.', 'Set-up sheet lacked torque value.', 'Set-up sheet template has no field for clamp torque.'], actions: ['Add clamp torque field to set-up sheet template.', 'Torque wrench issued to VMC cell.'] },
  { id: 'CAPA-26-007', title: 'Anodise thickness escapes (Chamak)', ncrIds: ['NCR-26-044'], stage: 'Verification', owner: 'u-lakshmi', dueDate: daysFromToday(-1), method: '8D', whys: ['Tank current density not logged.', 'Supplier has no thickness check before dispatch.'], actions: ['Supplier installed coating thickness gauge.', 'Incoming inspection for 3 lots at 100%.'] },
  { id: 'CAPA-26-006', title: 'Heat treatment hardness escapes', ncrIds: ['NCR-26-048'], stage: 'Closed', owner: 'u-lakshmi', dueDate: daysFromToday(-10), method: '8D', whys: ['Furnace thermocouple drifted 15 °C.'], actions: ['Supplier calibrates thermocouples monthly.', 'Hardness test added at incoming for all H&T lots.'] },
  { id: 'CAPA-26-005', title: 'Handling damage to threads during packing', ncrIds: ['NCR-26-045'], stage: 'Closed', owner: 'u-farhan', dueDate: daysFromToday(-18), method: '5-Why', whys: ['Parts packed loose in cartons.', 'No thread protectors specified.'], actions: ['Plastic thread plugs added to packing instruction PI-07.'] },
]

export const gauges: Gauge[] = [
  { id: 'G-VC-001', name: 'Digital vernier 0–150', type: 'Vernier', range: '0–150 mm', lastCal: daysFromToday(-300), dueCal: daysFromToday(65), location: 'Turning cell' },
  { id: 'G-VC-002', name: 'Digital vernier 0–300', type: 'Vernier', range: '0–300 mm', lastCal: daysFromToday(-370), dueCal: daysFromToday(-5), location: 'VMC cell' },
  { id: 'G-MC-003', name: 'Outside micrometer 25–50', type: 'Micrometer', range: '25–50 mm', lastCal: daysFromToday(-150), dueCal: daysFromToday(215), location: 'Grinding' },
  { id: 'G-MC-004', name: 'Outside micrometer 0–25', type: 'Micrometer', range: '0–25 mm', lastCal: daysFromToday(-340), dueCal: daysFromToday(25), location: 'Turning cell' },
  { id: 'G-MC-005', name: 'Outside micrometer 50–75', type: 'Micrometer', range: '50–75 mm', lastCal: daysFromToday(-200), dueCal: daysFromToday(165), location: 'QC lab' },
  { id: 'G-HG-006', name: 'Height gauge 600', type: 'Height gauge', range: '0–600 mm', lastCal: daysFromToday(-90), dueCal: daysFromToday(275), location: 'QC lab' },
  { id: 'G-BG-007', name: 'Bore gauge 50–100', type: 'Bore gauge', range: '50–100 mm', lastCal: daysFromToday(-380), dueCal: daysFromToday(-15), location: 'QC lab' },
  { id: 'G-TG-008', name: 'Thread ring M24×1.5-6g', type: 'Thread gauge', range: 'M24×1.5', lastCal: daysFromToday(-180), dueCal: daysFromToday(185), location: 'Turning cell' },
  { id: 'G-TG-009', name: 'Thread plug M8×1.25-6H', type: 'Thread gauge', range: 'M8×1.25', lastCal: daysFromToday(-60), dueCal: daysFromToday(305), location: 'VMC cell' },
  { id: 'G-TG-010', name: 'Thread plug M6-6H', type: 'Thread gauge', range: 'M6×1', lastCal: daysFromToday(-352), dueCal: daysFromToday(13), location: 'VMC cell' },
  { id: 'G-PG-011', name: 'Plug gauge Ø32 H8', type: 'Plug gauge', range: 'Ø32 H8', lastCal: daysFromToday(-40), dueCal: daysFromToday(325), location: 'VMC cell' },
  { id: 'G-PG-012', name: 'Plug gauge Ø60 H7', type: 'Plug gauge', range: 'Ø60 H7', lastCal: daysFromToday(-220), dueCal: daysFromToday(145), location: 'Turning cell' },
  { id: 'G-SR-013', name: 'Surface roughness tester', type: 'Surface roughness tester', range: 'Ra 0.05–40 µm', lastCal: daysFromToday(-330), dueCal: daysFromToday(35), location: 'QC lab' },
  { id: 'G-DI-014', name: 'Dial indicator 0.001', type: 'Dial indicator', range: '0–1 mm', lastCal: daysFromToday(-395), dueCal: daysFromToday(-30), location: 'Grinding' },
  { id: 'G-CMM-015', name: 'CMM Spectra 7.5.5', type: 'CMM', range: '700 × 500 × 500', lastCal: daysFromToday(-120), dueCal: daysFromToday(245), location: 'QC lab' },
]

export const controlledDocs: ControlledDoc[] = [
  { id: 'QM-01', title: 'Quality manual', type: 'Manual', rev: '07', owner: 'u-lakshmi', effective: daysFromToday(-200), status: 'Effective' },
  { id: 'QP-04', title: 'Control of nonconforming output', type: 'Procedure', rev: '05', owner: 'u-lakshmi', effective: daysFromToday(-150), status: 'Effective' },
  { id: 'QP-06', title: 'Corrective action (8D / 5-Why)', type: 'Procedure', rev: '03', owner: 'u-lakshmi', effective: daysFromToday(-150), status: 'Effective' },
  { id: 'QP-09', title: 'First article inspection (AS9102)', type: 'Procedure', rev: '02', owner: 'u-lakshmi', effective: daysFromToday(-90), status: 'Effective' },
  { id: 'WI-TC-12', title: 'Set-up sheet: CNC turning', type: 'Work instruction', rev: '04', owner: 'u-farhan', effective: daysFromToday(-30), status: 'In review' },
  { id: 'WI-VMC-08', title: 'Fixture clamping and torque', type: 'Work instruction', rev: '01', owner: 'u-farhan', effective: daysFromToday(-5), status: 'In review' },
  { id: 'F-QC-02', title: 'Inspection report template', type: 'Form', rev: '06', owner: 'u-lakshmi', effective: daysFromToday(-60), status: 'Effective' },
  { id: 'PI-07', title: 'Packing instruction', type: 'Work instruction', rev: '03', owner: 'u-farhan', effective: daysFromToday(-18), status: 'Effective' },
]

export const certifications: Certification[] = [
  { name: 'ISO 9001:2015', body: 'Demo Certification Services', certNo: 'QMS-IN-22817', issued: daysFromToday(-700), expires: daysFromToday(395) },
  { name: 'AS9100D', body: 'Demo Aerospace Registrar', certNo: 'AS-IN-4412', issued: daysFromToday(-1010), expires: daysFromToday(85) },
  { name: 'ISO 14001:2015', body: 'Demo Certification Services', certNo: 'EMS-IN-11903', issued: daysFromToday(-400), expires: daysFromToday(695) },
]
