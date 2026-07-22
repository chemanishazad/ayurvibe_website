import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText } from 'lucide-react';
import logo from '@/assets/logo.png';
import { getBmiCategory } from '@/lib/bmi-utils';
import { formatHhmmToAmPm, formatIsoDateToApp } from '@/lib/datetime';

const PRINT_STORAGE_KEY = 'print_consult_';
/** The saving tab writes the payload just before opening this one — retry briefly before giving up. */
const PAYLOAD_RETRY_MS = 300;
const PAYLOAD_RETRY_MAX = 10;

type PrescriptionRow = {
  medicineName: string;
  dosage?: string;
  durationDays?: number;
  timeMorning?: boolean;
  timeAfternoon?: boolean;
  timeNight?: boolean;
  foodRelation?: 'before_food' | 'after_food' | 'along_with_food';
  quantity?: string;
  withHotWater?: boolean;
  withMilk?: boolean;
  withHoney?: boolean;
  withGhee?: boolean;
  withGingerJuice?: boolean;
  withLemonJuice?: boolean;
};

const FOOD_LABEL: Record<string, string> = {
  before_food: 'Before food',
  after_food: 'After food',
  along_with_food: 'Along with food',
};

const EMERALD_DARK = '#15803d';
const EMERALD_MID = '#166534';
const EMERALD = '#16a34a';
const EMERALD_BG = '#f0fdf4';
const RULE = '#a7f3d0';
const AMBER = '#d97706';
const AMBER_DARK = '#92400e';
const AMBER_BG = '#fffbeb';
const AMBER_RULE = '#fde68a';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-[0.08em] mb-1.5" style={{ color: EMERALD_MID }}>
    {children}
  </p>
);

const InfoBox = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div
    className="rounded-md border border-gray-200 px-3 py-2 mb-3 break-inside-avoid"
    style={{ borderLeftWidth: 3, borderLeftColor: EMERALD }}
  >
    <SectionLabel>{label}</SectionLabel>
    {children}
  </div>
);

const ConsultationPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [cons, setCons] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Prescription-${id || 'consultation'}`,
    pageStyle: `
      /* Horizontal inset lives INSIDE the sheet (.print-body padding), not in the
         @page margin — so the dialog's "None"/"Default" margin choice can no longer
         clip the left/right edges. Small vertical @page margin keeps page 2+ safe. */
      @page { size: A4 portrait; margin: 6mm 0; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        /* Fill the full printable width AND height of the sheet. */
        #print-consultation {
          width: 100% !important;
          max-width: none !important;
          box-shadow: none !important;
          min-height: 0 !important;
          display: flex !important;
          flex-direction: column !important;
        }
        #print-consultation .print-body {
          flex: 1 1 auto !important;
          width: 100% !important;
          /* 8mm top padding keeps the clinic heading clear of the printer's
             non-printable strip even when dialog margins are set to "None". */
          padding: 8mm 12mm 0 !important;
          /* Printable height is 285mm (297 - 12mm vertical margins). Leave slack
             below it, or rounding overflows and pushes the signature to page 2. */
          min-height: 278mm;
          box-sizing: border-box;
        }
        #print-consultation .print-signature { padding-top: 6mm !important; }
        table { page-break-inside: auto; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        .break-inside-avoid { page-break-inside: avoid; }
      }
    `,
  });

  useEffect(() => {
    if (!id) {
      setLoaded(true);
      return;
    }
    let attempts = 0;
    let timer: number | undefined;
    const tryLoad = () => {
      attempts += 1;
      try {
        const raw = localStorage.getItem(PRINT_STORAGE_KEY + id);
        if (raw) {
          setCons(JSON.parse(raw) as Record<string, unknown>);
          setLoaded(true);
          return;
        }
      } catch {
        /* ignore parse errors; retry below */
      }
      if (attempts >= PAYLOAD_RETRY_MAX) {
        setLoaded(true);
        return;
      }
      timer = window.setTimeout(tryLoad, PAYLOAD_RETRY_MS);
    };
    tryLoad();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [id]);

  if (!loaded) return <div className="min-h-screen flex items-center justify-center bg-white"><p>Loading...</p></div>;
  if (!cons) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <p className="text-lg text-muted-foreground text-center">No print data found.</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">Please print from the Consultations page.</p>
      </div>
    );
  }

  const prescription = (cons.prescription as PrescriptionRow[]) || (cons.medicines as PrescriptionRow[]) || [];
  const patientName = (cons.patientName as string) || '';
  const patientAge = cons.patientAge != null ? String(cons.patientAge) : '';
  const patientAgeUnitRaw = String((cons.patientAgeUnit as string) || '').toLowerCase();
  const patientAgeUnit =
    patientAgeUnitRaw === 'month' || patientAgeUnitRaw === 'months'
      ? 'months'
      : patientAgeUnitRaw === 'year' || patientAgeUnitRaw === 'years'
        ? 'years'
        : '';
  const patientGender = (cons.patientGender as string) || '';
  const patientMobileRaw = String((cons.patientMobile as string) || '').trim();
  // Print shows the plain 10-digit mobile — drop a leading +91 / 91 / 0 country prefix.
  const patientMobile = patientMobileRaw.replace(/^(?:\+?91|0)[\s-]*(?=\d{10}$)/, '');
  const consultationDate = (cons.consultationDate as string) || '';
  const consultationTime = (cons.consultationTime as string) || '';
  const datePart = consultationDate ? formatIsoDateToApp(consultationDate.slice(0, 10)) : '';
  const timePart = consultationTime ? formatHhmmToAmPm(consultationTime) : '';
  const dateTimeStr = timePart ? `${datePart} ${timePart}` : datePart;
  const DEFAULT_ORG = 'Sri Vinayaga Ayurvibe';
  const rawClinicName = String(cons.clinicName as string || '').trim();
  const dashParts = rawClinicName.split(/\s*[—–]\s*/);
  const mainClinicHeading = dashParts[0]?.trim() || rawClinicName || DEFAULT_ORG;
  const branchFromTitle = dashParts.length > 1 ? dashParts.slice(1).join(' · ').trim() : '';
  const locationLine =
    String((cons.clinicAddress as string) || (cons.clinicSubtitle as string) || '').trim() ||
    branchFromTitle;
  const doctorLine = String(cons.doctorName as string || '').trim();
  const phoneRaw = String((cons.clinicPhone as string) || (cons.clinicContact as string) || '').trim();
  const emailRaw = String((cons.clinicEmail as string) || '').trim();
  const contactLine =
    [phoneRaw, emailRaw].filter(Boolean).join(' · ') || '8122339197 · svayurvibe@gmail.com';
  const symptoms = (cons.symptoms as string) || '';
  const diagnosis = (() => {
    const d = cons.diagnosis;
    if (d == null || d === '') return '';
    try {
      const parsed = typeof d === 'string' ? JSON.parse(d) : d;
      if (Array.isArray(parsed)) return parsed.map((x: { name?: string }) => x?.name).filter(Boolean).join('\n');
      return String(d);
    } catch { return String(d); }
  })();
  const patientMedicalHistory = (cons.patientMedicalHistory as string) || '';
  const dietLifestyleAdvice = (cons.dietLifestyleAdvice as string) || '';
  const followUpDateRaw = (cons.followUpDate as string) || '';
  const followUpDate = followUpDateRaw ? formatIsoDateToApp(followUpDateRaw.slice(0, 10)) : '';
  const weight =
    cons.weight != null && String(cons.weight).trim() !== ''
      ? String(Math.round(Number(cons.weight)))
      : '';
  const height =
    cons.height != null && String(cons.height).trim() !== ''
      ? String(Math.round(Number(cons.height)))
      : '';
  const bpSystolic = cons.bpSystolic != null ? String(cons.bpSystolic) : '';
  const bpDiastolic = cons.bpDiastolic != null ? String(cons.bpDiastolic) : '';
  const pulse = cons.pulse != null ? String(cons.pulse) : '';
  const temperature = cons.temperature != null ? String(cons.temperature) : '';
  const spo2 = cons.spo2 != null ? String(cons.spo2) : '';
  const cbg = cons.cbg != null ? String(cons.cbg) : '';
  const bpStr = [bpSystolic, bpDiastolic].filter(Boolean).join(' / ') || '—';
  const w = parseFloat(weight);
  const h = parseFloat(height);
  const bmiVal = w > 0 && h > 0 ? w / Math.pow(h / 100, 2) : 0;
  const bmi = bmiVal > 0 ? bmiVal.toFixed(1) : '';
  const bmiCategory = bmiVal > 0 ? getBmiCategory(bmiVal).label : '';

  const vitals: Array<[string, string]> = [
    ['BP', bpStr !== '—' ? `${bpStr} mmHg` : '—'],
    ['Pulse', pulse ? `${pulse} bpm` : '—'],
    ['Temperature', temperature ? `${temperature} °F` : '—'],
    ['SpO2', spo2 ? `${spo2} %` : '—'],
    ['Weight', weight ? `${weight} kgs` : '—'],
    ['Height', height ? `${height} cms` : '—'],
    ['BMI', bmi ? `${bmi} kgs/m² (${bmiCategory})` : '—'],
    ['CBG', cbg ? `${cbg} mg/dL` : '—'],
  ];

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/*
        Real page stylesheet so the browser's own Ctrl+P (not just the in-app button)
        lays the sheet out correctly: full printable width + height, signature at the foot.
      */}
      <style>{`
        @media print {
          /* Keep horizontal inset inside .print-body (padding), not in @page margins,
             so the print dialog's margin setting can't clip the left/right edges. */
          @page { size: A4 portrait; margin: 6mm 0; }
          html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body * { visibility: hidden; }
          #print-consultation, #print-consultation * { visibility: visible; }
          #print-consultation {
            position: absolute; left: 0; top: 0;
            width: 100% !important; max-width: none !important;
            min-height: 0 !important; margin: 0 !important;
            box-shadow: none !important;
            display: flex !important; flex-direction: column !important;
          }
          #print-consultation .print-body {
            flex: 1 1 auto !important;
            width: 100% !important;
            /* 8mm top padding keeps the clinic heading clear of the printer's
               non-printable strip even when dialog margins are set to "None". */
            padding: 8mm 12mm 0 !important;
            /* Printable height is 285mm (297 - 12mm vertical margins); slack below
               that stops rounding from pushing the signature onto page 2. */
            min-height: 278mm;
            box-sizing: border-box;
          }
          #print-consultation .print-signature { margin-top: auto !important; padding-top: 6mm !important; }
          table { page-break-inside: auto; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
      {/* Screen-only toolbar */}
      <div className="print:hidden sticky top-0 z-10 border-b bg-white/95 backdrop-blur px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-white font-medium hover:opacity-90"
            style={{ backgroundColor: '#16a34a' }}
          >
            <Printer className="h-4 w-4" /> Print Prescription (A4)
          </button>
          <Link
            to={`/print/pharmacy/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-green-600 px-5 py-2 font-medium text-green-700 hover:bg-green-50"
          >
            <FileText className="h-4 w-4" /> Print Invoice
          </Link>
          <p className="w-full text-xs text-gray-500 sm:ml-auto sm:w-auto">
            A4 portrait · long prescriptions continue on the next page.
          </p>
        </div>
      </div>

      {/* A4 sheet */}
      <div className="py-6 print:py-0">
        <div
          ref={printRef}
          id="print-consultation"
          className="mx-auto flex flex-col bg-white text-black shadow-lg print:shadow-none print:max-w-none"
          style={{ width: '210mm', maxWidth: '100%', minHeight: '297mm' }}
        >
          <div className="print-body flex flex-1 flex-col px-[13mm] py-[10mm] print:px-0 print:py-0">
            {/* Header */}
            <div
              className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md px-4 py-3 mb-3 break-inside-avoid"
              style={{ backgroundColor: EMERALD_BG, border: `1px solid ${RULE}`, borderBottom: `3px solid ${EMERALD_DARK}` }}
            >
              <div className="min-w-0">
                <h1 className="text-[19px] font-bold tracking-wide uppercase leading-tight" style={{ color: EMERALD_DARK }}>
                  {mainClinicHeading}
                </h1>
                {locationLine ? (
                  <p className="mt-1 text-[11px] font-medium leading-snug text-gray-700 whitespace-pre-wrap">
                    {locationLine}
                  </p>
                ) : null}
                <p className="mt-0.5 text-[10.5px] text-gray-600">{contactLine}</p>
                {doctorLine ? (
                  <p className="mt-1.5 text-[12px] font-semibold" style={{ color: EMERALD_MID }}>
                    {doctorLine}
                  </p>
                ) : null}
              </div>
              <img src={logo} alt="" className="h-20 w-auto max-w-[120px] shrink-0 object-contain" />
            </div>

            {/* Title ribbon */}
            <div
              className="mb-3 flex items-center justify-between rounded-md px-3 py-1.5"
              style={{ backgroundColor: EMERALD_DARK }}
            >
              <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-white">
                Prescription
              </p>
              <p className="text-[11px] font-medium text-white tabular-nums">{dateTimeStr || '—'}</p>
            </div>

            {/* Beneficiary details */}
            <div className="mb-3 overflow-hidden rounded-md border break-inside-avoid" style={{ borderColor: RULE }}>
              <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr] divide-x divide-[#d1fae5]" style={{ backgroundColor: EMERALD_BG }}>
                {([
                  ['Name', patientName || '—'],
                  ['Age', patientAge ? `${patientAge}${patientAgeUnit ? ` ${patientAgeUnit}` : ''}` : '—'],
                  ['Sex', patientGender || '—'],
                  ['Mobile', patientMobile || '—'],
                ] as Array<[string, string]>).map(([label, value]) => (
                  <div key={label} className="min-w-0 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: EMERALD_MID }}>{label}</p>
                    <p className="mt-0.5 text-[11.5px] font-semibold break-words text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vital signs */}
            <div
              className="mb-3 rounded-md border border-gray-200 px-3 py-2 break-inside-avoid"
              style={{ borderLeftWidth: 3, borderLeftColor: EMERALD }}
            >
              <SectionLabel>Vital Signs</SectionLabel>
              <div className="grid grid-cols-4 gap-1.5">
                {vitals.map(([label, value]) => (
                  <div key={label} className="rounded border border-gray-200 bg-slate-50 px-2 py-1">
                    <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: EMERALD_MID }}>{label}</p>
                    <p className="text-[11px] font-medium leading-snug tabular-nums text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {symptoms && (
              <InfoBox label="Present Complaint with Duration">
                <p className="text-[11.5px] leading-relaxed whitespace-pre-wrap">{symptoms}</p>
              </InfoBox>
            )}

            {patientMedicalHistory && (
              <InfoBox label="Medical History">
                <p className="text-[11.5px] leading-relaxed whitespace-pre-wrap">{patientMedicalHistory}</p>
              </InfoBox>
            )}

            {diagnosis && (
              <InfoBox label="Diagnosis">
                <p className="text-[11.5px] font-medium leading-relaxed whitespace-pre-wrap">{diagnosis}</p>
              </InfoBox>
            )}

            {/* Prescription table */}
            <div className="mb-3 overflow-hidden rounded-md border" style={{ borderColor: RULE }}>
              <div className="flex items-baseline gap-2 px-3 pt-2">
                <span className="text-[16px] font-bold leading-none" style={{ color: EMERALD_DARK }}>℞</span>
                <SectionLabel>Prescription</SectionLabel>
              </div>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr style={{ backgroundColor: EMERALD_DARK }} className="text-left text-white">
                    <th className="w-7 px-2 py-1.5 text-center font-bold">#</th>
                    <th className="px-2 py-1.5 font-bold">Medicine</th>
                    <th className="px-2 py-1.5 font-bold">Dosage</th>
                    <th className="w-9 px-1 py-1.5 text-center font-bold" title="Morning">Mor</th>
                    <th className="w-9 px-1 py-1.5 text-center font-bold" title="Afternoon">Aft</th>
                    <th className="w-9 px-1 py-1.5 text-center font-bold" title="Night">Ngt</th>
                    <th className="px-2 py-1.5 font-bold">Food</th>
                    <th className="px-2 py-1.5 font-bold">With</th>
                    <th className="px-2 py-1.5 font-bold">Qty</th>
                    <th className="px-2 py-1.5 font-bold whitespace-nowrap">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {prescription.length > 0 ? prescription.map((m, i) => {
                    const food = m.foodRelation ? (FOOD_LABEL[m.foodRelation] ?? 'External') : 'External / Not specified';
                    const withItems: string[] = [];
                    if (m.withHotWater) withItems.push('Hot water');
                    if (m.withMilk) withItems.push('Milk');
                    if (m.withHoney) withItems.push('Honey');
                    if (m.withGhee) withItems.push('Ghee');
                    if (m.withGingerJuice) withItems.push('Ginger juice');
                    if (m.withLemonJuice) withItems.push('Lemon juice');

                    const tick = (on?: boolean) =>
                      on ? <span className="font-bold" style={{ color: EMERALD_DARK }}>✓</span> : null;
                    return (
                      <tr key={i} className="align-top" style={i % 2 === 1 ? { backgroundColor: EMERALD_BG } : undefined}>
                        <td className="px-2 py-1.5 text-center text-gray-500 border-b border-gray-200 tabular-nums">{i + 1}</td>
                        <td className="px-2 py-1.5 font-semibold border-b border-gray-200">{m.medicineName}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{m.dosage || '—'}</td>
                        <td className="px-1 py-1.5 text-center border-b border-gray-200">{tick(m.timeMorning)}</td>
                        <td className="px-1 py-1.5 text-center border-b border-gray-200">{tick(m.timeAfternoon)}</td>
                        <td className="px-1 py-1.5 text-center border-b border-gray-200">{tick(m.timeNight)}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{food}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{withItems.length ? withItems.join(', ') : '—'}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200">{m.quantity || '—'}</td>
                        <td className="px-2 py-1.5 border-b border-gray-200 whitespace-nowrap">
                          {m.durationDays ? `${m.durationDays} day${Number(m.durationDays) === 1 ? '' : 's'}` : '—'}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={10} className="px-2 py-3 text-gray-500">No medicines prescribed.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {dietLifestyleAdvice && (
              <InfoBox label="Diet / Lifestyle Advice">
                <p className="text-[11.5px] leading-relaxed whitespace-pre-wrap">{dietLifestyleAdvice}</p>
              </InfoBox>
            )}

            {followUpDate && (
              <div
                className="mb-3 break-inside-avoid rounded-md border px-3 py-2"
                style={{ borderColor: AMBER_RULE, backgroundColor: AMBER_BG, borderLeftWidth: 3, borderLeftColor: AMBER }}
              >
                <p className="text-[11.5px]">
                  <span className="mr-2 text-[10px] font-bold uppercase tracking-wide" style={{ color: AMBER_DARK }}>
                    Follow-up date
                  </span>
                  <span className="font-semibold tabular-nums text-gray-900">{followUpDate}</span>
                </p>
              </div>
            )}

            {/* Signature + footer */}
            <div className="print-signature mt-auto pt-10 break-inside-avoid">
              <div className="flex justify-end">
                <div className="text-center">
                  <div className="w-44 border-t-2 border-gray-800" />
                  {doctorLine ? <p className="mt-1 text-[11px] font-semibold">{doctorLine}</p> : null}
                  <p className="mt-0.5 text-[10px] text-gray-600">Doctor&apos;s Signature</p>
                </div>
              </div>
              <div className="mt-4 pb-2 pt-1.5 text-center" style={{ borderTop: `2px solid ${EMERALD_DARK}` }}>
                <p className="text-[9.5px] text-gray-600">
                  {mainClinicHeading} · {contactLine}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPrintPage;
