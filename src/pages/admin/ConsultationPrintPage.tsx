import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import logo from '@/assets/logo.png';

const PRINT_STORAGE_KEY = 'print_consult_';

const ConsultationPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const [cons, setCons] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);

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
        localStorage.removeItem(PRINT_STORAGE_KEY + id);
      }
    } catch {}
    setLoaded(true);
  }, [id]);

  const handlePrint = () => window.print();

  if (!loaded) return <div className="min-h-screen flex items-center justify-center bg-white"><p>Loading...</p></div>;
  if (!cons) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <p className="text-lg text-muted-foreground text-center">No print data found.</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">Please print from the Consultations page.</p>
      </div>
    );
  }

  const medicines = (cons.medicines as { medicineName: string; quantity: number; unitPrice: string; uom?: string }[]) || [];
  const patientName = (cons.patientName as string) || '';
  const patientAge = cons.patientAge ?? '';
  const patientGender = (cons.patientGender as string) || '';
  const consultationDate = (cons.consultationDate as string) || '';
  const doctorName = (cons.doctorName as string) || 'Dr. V.VAITHEESHWARI BAMS';
  const symptoms = (cons.symptoms as string) || '';
  const diagnosis = (cons.diagnosis as string) || '';
  const notes = (cons.notes as string) || '';

  const printTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div id="print-prescription" className="min-h-screen bg-white text-black relative print:min-h-[297mm] print:flex print:flex-col">
      {/* Green wave left edge - thin for print to maximize content */}
      <div className="absolute left-0 top-0 bottom-0 w-[12%] min-w-[40px] max-w-[60px] overflow-hidden pointer-events-none print:w-[8mm]">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 1200">
          <path d="M0,0 Q30,100 0,200 T0,400 Q30,500 0,600 T0,800 Q30,900 0,1000 T0,1200" fill="none" stroke="#4ade80" strokeWidth="35" opacity="0.25" />
          <path d="M0,50 Q35,150 0,250 T0,450 Q35,550 0,650 T0,850 Q35,950 0,1050" fill="none" stroke="#22c55e" strokeWidth="30" opacity="0.3" />
          <path d="M0,100 Q40,200 0,300 T0,500 Q40,600 0,700 T0,900 Q40,1000 0,1100" fill="none" stroke="#16a34a" strokeWidth="28" opacity="0.35" />
          <path d="M0,150 Q45,250 0,350 T0,550 Q45,650 0,750 T0,950 Q45,1050 0,1150" fill="none" stroke="#15803d" strokeWidth="25" opacity="0.3" />
          <path d="M0,200 Q50,300 0,400 T0,600 Q50,700 0,800 T0,1000 Q50,1100 0,1200" fill="none" stroke="#166534" strokeWidth="22" opacity="0.25" />
        </svg>
      </div>
      {/* Green wave right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-[12%] min-w-[40px] max-w-[60px] overflow-hidden pointer-events-none print:w-[8mm]">
        <svg className="absolute inset-0 w-full h-full scale-x-[-1]" preserveAspectRatio="none" viewBox="0 0 100 1200">
          <path d="M0,0 Q30,100 0,200 T0,400 Q30,500 0,600 T0,800 Q30,900 0,1000 T0,1200" fill="none" stroke="#4ade80" strokeWidth="35" opacity="0.25" />
          <path d="M0,50 Q35,150 0,250 T0,450 Q35,550 0,650 T0,850 Q35,950 0,1050" fill="none" stroke="#22c55e" strokeWidth="30" opacity="0.3" />
          <path d="M0,100 Q40,200 0,300 T0,500 Q40,600 0,700 T0,900 Q40,1000 0,1100" fill="none" stroke="#16a34a" strokeWidth="28" opacity="0.35" />
          <path d="M0,150 Q45,250 0,350 T0,550 Q45,650 0,750 T0,950 Q45,1050 0,1150" fill="none" stroke="#15803d" strokeWidth="25" opacity="0.3" />
          <path d="M0,200 Q50,300 0,400 T0,600 Q50,700 0,800 T0,1000 Q50,1100 0,1200" fill="none" stroke="#166534" strokeWidth="22" opacity="0.25" />
        </svg>
      </div>

      <div className="relative pl-[18%] print:pl-[8mm] pr-[18%] print:pr-[8mm] py-4 print:py-0 max-w-[210mm] mx-auto print:max-w-none print:w-full print:flex-1 print:flex print:flex-col print:min-h-0">
        {/* Top row: timestamp left, tagline right */}
        <div className="flex justify-between items-start mb-2 print:mb-1">
          <span className="text-[10px] print:text-[9px] text-gray-500">{printTimestamp}</span>
          <span className="text-[10px] print:text-[9px] text-right" style={{ color: '#22c55e', opacity: 0.9 }}>
            Sri Vinayaga Ayurvibe - Best Ayurveda Hospital Chennai | Perumbakkam, OMR
          </span>
        </div>

        {/* Header - clinic name + logo, doctor below */}
        <div className="flex items-start justify-between gap-4 mb-4 print:mb-3">
          <div className="flex-1">
            <h1 className="text-xl print:text-[18px] font-bold tracking-wide" style={{ color: '#22c55e' }}>
              SRI VINAYAGA AYURVIBE
            </h1>
            <p className="text-xs print:text-[11px] font-medium mt-1" style={{ color: '#15803d' }}>{doctorName}</p>
            <p className="text-[10px] print:text-[9px] text-gray-600">8122339197</p>
            <p className="text-[10px] print:text-[9px] text-gray-600">svayurvibe@gmail.com</p>
          </div>
          <img src={logo} alt="Logo" className="h-12 w-auto print:h-10 shrink-0" />
        </div>

        {/* Patient info - Name (long dotted), Age/Sex/Date (short dotted) on same line */}
        <div className="mb-3 print:mb-2 text-xs print:text-[11px] flex items-baseline gap-2 flex-wrap">
          <span className="font-medium shrink-0">Name:</span>
          <span className="border-b border-dotted border-gray-500 flex-1 min-w-[100px]">{patientName || ' '}</span>
          <span className="font-medium shrink-0">Age:</span>
          <span className="border-b border-dotted border-gray-500 w-8">{patientAge || ' '}</span>
          <span className="font-medium shrink-0">Sex:</span>
          <span className="border-b border-dotted border-gray-500 w-8">{patientGender || ' '}</span>
          <span className="font-medium shrink-0">Date:</span>
          <span className="border-b border-dotted border-gray-500 w-16">{consultationDate || ' '}</span>
        </div>

        {/* Rx - bold green */}
        <p className="text-2xl print:text-[24px] font-bold mb-3 print:mb-2" style={{ color: '#22c55e' }}>Rx</p>

        {/* Rx content: Symptoms, Diagnosis, medicines */}
        <div className="text-xs print:text-[11px] mb-3 print:mb-2 space-y-0.5">
          {symptoms && <p><span className="font-medium">Symptoms:</span> {symptoms}</p>}
          {diagnosis && <p><span className="font-medium">Diagnosis:</span> {diagnosis}</p>}
          {medicines.length > 0 && (
            medicines.map((m, i) => (
              <p key={i}>{m.medicineName} – {m.quantity} {m.uom || 'nos'} × ₹{m.unitPrice}</p>
            ))
          )}
        </div>

        {/* Consultation and Medicines - half consult, half medicine - expands to fill page */}
        <div className="grid grid-cols-2 gap-4 print:gap-3 border-t border-gray-200 pt-2 print:pt-1 print:flex-1 print:min-h-[120mm]">
          <div className="print:flex print:flex-col print:min-h-0">
            <p className="text-[10px] print:text-[9px] font-medium text-gray-600 mb-1 shrink-0">Consultation</p>
            <div className="text-xs print:text-[11px] whitespace-pre-wrap min-h-[40px] print:min-h-0 print:flex-1 print:border-b print:border-dotted print:border-gray-300">
              {notes || ' '}
            </div>
          </div>
          <div className="print:flex print:flex-col print:min-h-0">
            <p className="text-[10px] print:text-[9px] font-medium text-gray-600 mb-1 shrink-0">Medicines</p>
            <div className="text-xs print:text-[11px] whitespace-pre-wrap min-h-[40px] print:min-h-0 print:flex-1 print:border-b print:border-dotted print:border-gray-300">
              {medicines.length > 0 ? (
                medicines.map((m, i) => (
                  <p key={i}>{m.medicineName} – {m.quantity} {m.uom || 'nos'} × ₹{m.unitPrice}</p>
                ))
              ) : (
                ' '
              )}
            </div>
          </div>
        </div>

        {/* Total */}
        <p className="mt-3 print:mt-2 text-xs print:text-[11px] text-right font-semibold">Total: ₹{cons.totalAmount}</p>

        {/* Footer */}
        <div className="mt-4 print:mt-3 text-[10px] print:text-[9px] text-gray-500 text-right">
          <p>Reg No: 2055</p>
          <p className="mt-0.5">No : 17/587, Main Road, Nethaji Nagar, Perumbakkam (Nookampalayam), Chennai - 600141</p>
        </div>

        {/* Print button */}
        <div className="mt-6 print:hidden flex flex-col gap-2">
          <button
            onClick={handlePrint}
            className="px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 w-fit"
            style={{ backgroundColor: '#22c55e' }}
          >
            Print
          </button>
          <p className="text-xs text-gray-500">For full A4 paper: set Margins to &quot;None&quot; or &quot;Minimum&quot; in the print dialog.</p>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPrintPage;
