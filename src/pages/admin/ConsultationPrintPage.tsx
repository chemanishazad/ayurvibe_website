import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import logo from '@/assets/logo.png';

const PRINT_STORAGE_KEY = 'print_consult_';

type PrescriptionRow = { medicineName: string; dosage?: string; durationDays?: number };

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
  const patientId = (cons.patientId as string) || '';
  const clinicName = (cons.clinicName as string) || 'SRI VINAYAGA AYURVIBE';
  const doctorName = (cons.doctorName as string) || 'Dr. V.VAITHEESHWARI BAMS';
  const symptoms = (cons.symptoms as string) || '';
  const diagnosis = (cons.diagnosis as string) || '';
  const dietLifestyleAdvice = (cons.dietLifestyleAdvice as string) || '';
  const followUpDate = (cons.followUpDate as string) || '';
  const weight = cons.weight != null ? String(cons.weight) : '';
  const bpSystolic = cons.bpSystolic != null ? String(cons.bpSystolic) : '';
  const bpDiastolic = cons.bpDiastolic != null ? String(cons.bpDiastolic) : '';
  const pulse = cons.pulse != null ? String(cons.pulse) : '';
  const temperature = cons.temperature != null ? String(cons.temperature) : '';
  const bpStr = [bpSystolic, bpDiastolic].filter(Boolean).join(' / ') || '—';

  return (
    <div className="min-h-screen bg-white p-4 print:p-0">
      <div
        ref={printRef}
        id="print-consultation"
        className="bg-white text-black relative mx-auto"
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

      <div className="relative pl-[12%] pr-[12%] py-3 print:py-2" style={{ paddingLeft: '12%', paddingRight: '12%' }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h1 className="text-base font-bold tracking-wide uppercase" style={{ color: '#15803d' }}>
              {clinicName}
            </h1>
            <p className="text-[10px] font-medium mt-0.5" style={{ color: '#166534' }}>{doctorName}</p>
            <p className="text-[9px] text-gray-600">8122339197 | svayurvibe@gmail.com</p>
          </div>
          <img src={logo} alt="Logo" className="h-9 w-auto shrink-0" />
        </div>

        {/* Patient Details */}
        <div className="border border-gray-300 rounded p-1.5 mb-2">
          <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Patient Details</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-3 gap-y-0.5 text-[10px]">
            <span><strong>Name:</strong> {patientName || '—'}</span>
            <span><strong>Age:</strong> {patientAge || '—'}</span>
            <span><strong>Sex:</strong> {patientGender || '—'}</span>
            <span><strong>Date:</strong> {consultationDate || '—'}</span>
            <span><strong>Patient ID:</strong> {patientId ? patientId.slice(0, 8) + '…' : '—'}</span>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="border border-gray-300 rounded p-1.5 mb-2">
          <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Vital Signs</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-0.5 text-[10px]">
            <span><strong>BP:</strong> {bpStr}</span>
            <span><strong>Weight:</strong> {weight ? `${weight} kg` : '—'}</span>
            <span><strong>Pulse:</strong> {pulse ? `${pulse} bpm` : '—'}</span>
            <span><strong>Temperature:</strong> {temperature ? `${temperature} °C` : '—'}</span>
          </div>
        </div>

        {/* Symptoms */}
        {symptoms && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Symptoms</p>
            <p className="text-[10px] whitespace-pre-wrap border-b border-dotted border-gray-400">{symptoms}</p>
          </div>
        )}

        {/* Diagnosis */}
        {diagnosis && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Diagnosis</p>
            <p className="text-[10px] whitespace-pre-wrap border-b border-dotted border-gray-400">{diagnosis}</p>
          </div>
        )}

        {/* Prescription */}
        <div className="mb-2">
          <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Prescription</p>
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-1 pr-2 font-semibold">Medicine</th>
                <th className="text-left py-1 pr-2 font-semibold">Dosage</th>
                <th className="text-left py-1 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody>
              {prescription.length > 0 ? prescription.map((m, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1 pr-2">{m.medicineName}</td>
                  <td className="py-1 pr-2">{m.dosage || '—'}</td>
                  <td className="py-1">{m.durationDays ? `${m.durationDays} days` : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="py-2 text-gray-500">—</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Diet / Lifestyle Advice */}
        {dietLifestyleAdvice && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Diet / Lifestyle Advice</p>
            <p className="text-[10px] whitespace-pre-wrap border-b border-dotted border-gray-400">{dietLifestyleAdvice}</p>
          </div>
        )}

        {/* Follow-up Date */}
        {followUpDate && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5">Follow-up Date:</p>
            <p className="text-[10px]">{followUpDate}</p>
          </div>
        )}

        {/* Signature */}
        <div className="mt-4 flex justify-end">
          <div className="text-right">
            <div className="border-t-2 border-gray-800 w-20 mt-6" />
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
          Print Pharmacy Bill
        </Link>
        <p className="text-xs text-gray-500 w-full mt-2">Uses A5 paper. Set Margins to &quot;None&quot; for full page.</p>
      </div>
    </div>
  );
};

export default ConsultationPrintPage;
