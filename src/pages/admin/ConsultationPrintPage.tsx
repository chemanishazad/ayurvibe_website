import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import logo from '@/assets/logo.png';
import { getBmiCategory } from '@/lib/bmi-utils';
import { formatHhmmToAmPm, formatIsoDateToApp } from '@/lib/datetime';

const PRINT_STORAGE_KEY = 'print_consult_';

type PrescriptionRow = {
  medicineName: string;
  dosage?: string;
  durationDays?: number;
  timeMorning?: boolean;
  timeAfternoon?: boolean;
  timeNight?: boolean;
  foodRelation?: 'before_food' | 'after_food';
  quantity?: string;
  withHotWater?: boolean;
  withMilk?: boolean;
  withHoney?: boolean;
  withGhee?: boolean;
  withGingerJuice?: boolean;
  withLemonJuice?: boolean;
};

const ConsultationPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [cons, setCons] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Consultation-${id || 'bill'}`,
    pageStyle: `
      @page { size: A5; margin: 0; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; }
      }
    `,
  });

  useEffect(() => {
    if (!id) {
      setLoaded(true);
      return;
    }
    try {
      const raw = localStorage.getItem(PRINT_STORAGE_KEY + id);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>;
        setCons(data);
        // Don't remove - Pharmacy print page needs it too
      }
    } catch {}
    setLoaded(true);
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
  const patientGender = (cons.patientGender as string) || '';
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

  return (
    <div className="min-h-screen bg-white p-4 print:p-0">
      <div
        ref={printRef}
        id="print-consultation"
        className="bg-white text-black relative mx-auto flex flex-col"
        style={{
          width: '148mm',
          minHeight: '210mm',
          maxWidth: '100%',
        }}
      >
      <div className="absolute left-0 top-0 bottom-0 w-[8%] overflow-hidden pointer-events-none print:w-[4mm]">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 1200">
          <path d="M0,0 Q30,100 0,200 T0,400 Q30,500 0,600 T0,800 Q30,900 0,1000 T0,1200" fill="none" stroke="#22c55e" strokeWidth="28" opacity="0.2" />
          <path d="M0,100 Q40,200 0,300 T0,500 Q40,600 0,700 T0,900 Q40,1000 0,1100" fill="none" stroke="#16a34a" strokeWidth="24" opacity="0.25" />
        </svg>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-[8%] overflow-hidden pointer-events-none print:w-[4mm]">
        <svg className="absolute inset-0 w-full h-full scale-x-[-1]" preserveAspectRatio="none" viewBox="0 0 100 1200">
          <path d="M0,0 Q30,100 0,200 T0,400 Q30,500 0,600 T0,800 Q30,900 0,1000 T0,1200" fill="none" stroke="#22c55e" strokeWidth="28" opacity="0.2" />
          <path d="M0,100 Q40,200 0,300 T0,500 Q40,600 0,700 T0,900 Q40,1000 0,1100" fill="none" stroke="#16a34a" strokeWidth="24" opacity="0.25" />
        </svg>
      </div>

      <div
        className="relative pl-[12%] pr-[12%] py-3 print:py-2 flex flex-col min-h-[210mm] flex-1"
        style={{ paddingLeft: '12%', paddingRight: '12%' }}
      >
        {/* Header: left = name + location + doctor + contact; right = logo */}
        <div className="grid grid-cols-[1fr_auto] items-start gap-3 mb-3 border-b border-emerald-100/80 pb-2.5">
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold tracking-wide uppercase leading-tight" style={{ color: '#15803d' }}>
              {mainClinicHeading}
            </h1>
            {locationLine ? (
              <p className="text-[10px] font-semibold text-gray-700 mt-1 leading-snug whitespace-pre-wrap">
                {locationLine}
              </p>
            ) : null}
            {doctorLine ? (
              <p className="text-[10px] font-medium mt-1.5" style={{ color: '#166534' }}>
                {doctorLine}
              </p>
            ) : null}
            <p className="text-[9px] text-gray-600 mt-0.5">{contactLine}</p>
          </div>
          <img
            src={logo}
            alt=""
            className="h-16 w-auto max-w-[100px] shrink-0 object-contain print:h-[72px]"
          />
        </div>

        {/* Beneficiary Details */}
        <div className="border border-gray-300 rounded p-2 mb-2">
          <p className="text-[9px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">Beneficiary Details</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px] leading-snug">
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase text-gray-500 mb-0.5">Name</p>
              <p className="font-medium break-words">{patientName || '—'}</p>
            </div>
            <div>
              <p className="text-[8px] font-semibold uppercase text-gray-500 mb-0.5">Age</p>
              <p className="font-medium">{patientAge || '—'}</p>
            </div>
            <div>
              <p className="text-[8px] font-semibold uppercase text-gray-500 mb-0.5">Sex</p>
              <p className="font-medium">{patientGender || '—'}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase text-gray-500 mb-0.5">Date</p>
              <p className="font-medium">{dateTimeStr || '—'}</p>
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="border border-gray-300 rounded p-1.5 mb-2">
          <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Vital Signs</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5 text-[10px]">
            <span><strong>BP:</strong> {bpStr}</span>
            <span><strong>Weight:</strong> {weight ? `${weight} kgs` : '—'}</span>
            <span><strong>Height:</strong> {height ? `${height} cm` : '—'}</span>
            <span><strong>BMI:</strong> {bmi ? `${bmi} kg/m² (${bmiCategory})` : '—'}</span>
            <span><strong>Pulse:</strong> {pulse ? `${pulse} bpm` : '—'}</span>
            <span><strong>Temperature:</strong> {temperature || '—'}</span>
            <span><strong>SpO2:</strong> {spo2 ? `${spo2}%` : '—'}</span>
            <span><strong>CBG:</strong> {cbg ? `${cbg} mg/dL` : '—'}</span>
          </div>
        </div>

        {/* Present Complaint with duration */}
        {symptoms && (
          <div className="border border-gray-300 rounded p-1.5 mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Present Complaint with duration</p>
            <p className="text-[10px] whitespace-pre-wrap leading-relaxed">{symptoms}</p>
          </div>
        )}

        {/* Medical History */}
        {patientMedicalHistory && (
          <div className="border border-gray-300 rounded p-1.5 mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Medical History</p>
            <p className="text-[10px] whitespace-pre-wrap leading-relaxed">{patientMedicalHistory}</p>
          </div>
        )}

        {/* Diagnosis */}
        {diagnosis && (
          <div className="border border-gray-300 rounded p-1.5 mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Diagnosis</p>
            <p className="text-[10px] whitespace-pre-wrap leading-relaxed">{diagnosis}</p>
          </div>
        )}

        {/* Prescription */}
        <div className="border border-gray-300 rounded p-1.5 mb-2">
          <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Prescription</p>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-1 pr-2 font-semibold">Medicine</th>
                <th className="text-left py-1 pr-2 font-semibold">Dosage</th>
                <th className="text-center py-1 px-1 font-semibold">Morning</th>
                <th className="text-center py-1 px-1 font-semibold">Afternoon</th>
                <th className="text-center py-1 px-1 font-semibold">Night</th>
                <th className="text-left py-1 px-1 font-semibold">Food</th>
                <th className="text-left py-1 px-1 font-semibold">With</th>
                <th className="text-left py-1 px-1 font-semibold">Qty</th>
                <th className="text-left py-1 px-1 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescription.length > 0 ? prescription.map((m, i) => {
                const food =
                  m.foodRelation === 'before_food'
                    ? 'Before food'
                    : m.foodRelation === 'after_food'
                    ? 'After food'
                    : 'External / Not specified';
                const withItems: string[] = [];
                if (m.withHotWater) withItems.push('Hot water');
                if (m.withMilk) withItems.push('Milk');
                if (m.withHoney) withItems.push('Honey');
                if (m.withGhee) withItems.push('Ghee');
                if (m.withGingerJuice) withItems.push('Ginger juice');
                if (m.withLemonJuice) withItems.push('Lemon juice');

                return (
                  <tr key={i} className="border-b border-gray-200 align-top">
                    <td className="py-1 pr-2">{m.medicineName}</td>
                    <td className="py-1 pr-2">{m.dosage || '—'}</td>
                    <td className="py-1 px-1 text-center">{m.timeMorning ? '✓' : ''}</td>
                    <td className="py-1 px-1 text-center">{m.timeAfternoon ? '✓' : ''}</td>
                    <td className="py-1 px-1 text-center">{m.timeNight ? '✓' : ''}</td>
                    <td className="py-1 px-1">{food}</td>
                    <td className="py-1 px-1">{withItems.length ? withItems.join(', ') : '—'}</td>
                    <td className="py-1 px-1">{m.quantity || '—'}</td>
                    <td className="py-1 px-1">{m.durationDays ? `${m.durationDays} days` : '—'}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={9} className="py-2 text-gray-500">—</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Diet / Lifestyle Advice */}
        {dietLifestyleAdvice && (
          <div className="border border-gray-300 rounded p-1.5 mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Diet / Lifestyle Advice</p>
            <p className="text-[10px] whitespace-pre-wrap leading-relaxed">{dietLifestyleAdvice}</p>
          </div>
        )}

        {/* Follow-up Date */}
        {followUpDate && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5">Follow-up Date:</p>
            <p className="text-[10px]">{followUpDate}</p>
          </div>
        )}

        {/* Signature — pinned to bottom of page (A5) when content is short */}
        <div className="mt-auto pt-6 flex justify-end print:pt-8">
          <div className="text-right">
            <div className="border-t-2 border-gray-800 w-20" />
            <p className="text-[9px] text-gray-600 mt-0.5">Doctor&apos;s Signature</p>
          </div>
        </div>
      </div>
      </div>

      {/* Print buttons */}
      <div className="mt-6 print:hidden flex flex-wrap gap-2">
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 text-white font-medium rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#22c55e' }}
        >
            Print Consultation Bill
        </button>
        <Link
          to={`/print/pharmacy/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 font-medium rounded-lg border-2 border-green-600 text-green-700 hover:bg-green-50"
        >
          Print Invoice
        </Link>
        <p className="text-xs text-gray-500 w-full mt-2">Uses A5 paper. Set Margins to &quot;None&quot; for full page.</p>
      </div>
    </div>
  );
};

export default ConsultationPrintPage;
