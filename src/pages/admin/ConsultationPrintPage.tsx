import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import logo from '@/assets/logo.png';
import { getBmiCategory } from '@/lib/bmi-utils';

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
  const dateTimeStr = consultationTime ? `${consultationDate} ${consultationTime}` : consultationDate;
  const patientId = (cons.patientId as string) || '';
  const clinicName = (cons.clinicName as string) || 'SRI VINAYAGA AYURVIBE';
  const doctorName = (cons.doctorName as string) || 'Dr. V.VAITHEESHWARI BAMS';
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
  const personalHistory = (() => {
    try {
      const raw = cons.personalHistory as string;
      return raw ? JSON.parse(raw) as Record<string, string[]> : null;
    } catch { return null; }
  })();
  const menstrualHistory = (() => {
    try {
      const raw = cons.menstrualHistory as string;
      return raw ? JSON.parse(raw) as Record<string, string | number | boolean> : null;
    } catch { return null; }
  })();
  const ayurvedaExamination = (() => {
    try {
      const raw = cons.ayurvedaExamination as string;
      return raw ? JSON.parse(raw) as Record<string, string> : null;
    } catch { return null; }
  })();
  const patientMedicalHistory = (cons.patientMedicalHistory as string) || '';
  const dietLifestyleAdvice = (cons.dietLifestyleAdvice as string) || '';
  const followUpDate = (cons.followUpDate as string) || '';
  const weight = cons.weight != null ? String(cons.weight) : '';
  const height = cons.height != null ? String(cons.height) : '';
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

        {/* Beneficiary Details */}
        <div className="border border-gray-300 rounded p-1.5 mb-2">
          <p className="text-[9px] font-semibold text-gray-600 mb-1 uppercase">Beneficiary Details</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-3 gap-y-0.5 text-[10px]">
            <span><strong>Name:</strong> {patientName || '—'}</span>
            <span><strong>Age:</strong> {patientAge || '—'}</span>
            <span><strong>Sex:</strong> {patientGender || '—'}</span>
            <span><strong>Date:</strong> {dateTimeStr || '—'}</span>
            <span><strong>ID:</strong> {patientId ? patientId.slice(0, 8) + '…' : '—'}</span>
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
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Present Complaint with duration</p>
            <p className="text-[10px] whitespace-pre-wrap border-b border-dotted border-gray-400">{symptoms}</p>
          </div>
        )}

        {/* Personal History */}
        {personalHistory && Object.values(personalHistory).some((arr) => arr?.length > 0) && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Personal History</p>
            <div className="text-[10px] space-y-0.5">
              {personalHistory.diet?.length > 0 && <p><strong>Diet:</strong> {personalHistory.diet.join(', ')}</p>}
              {personalHistory.exercise?.length > 0 && <p><strong>Exercise:</strong> {personalHistory.exercise.join(', ')}</p>}
              {personalHistory.habits?.length > 0 && <p><strong>Habits/Addictions:</strong> {personalHistory.habits.join(', ')}</p>}
              {personalHistory.bowelMovement?.length > 0 && <p><strong>Bowel Movement:</strong> {personalHistory.bowelMovement.join(', ')}</p>}
              {personalHistory.appetite?.length > 0 && <p><strong>Appetite:</strong> {personalHistory.appetite.join(', ')}</p>}
              {personalHistory.micturition?.length > 0 && <p><strong>Micturition:</strong> {personalHistory.micturition.join(', ')}</p>}
              {personalHistory.sleepPattern?.length > 0 && <p><strong>Sleep Pattern:</strong> {personalHistory.sleepPattern.join(', ')}</p>}
            </div>
          </div>
        )}

        {/* Menstrual History (For Female Patients) */}
        {patientGender?.toLowerCase() === 'female' && menstrualHistory && Object.values(menstrualHistory).some((v) => v != null && v !== '' && v !== false) && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Menstrual History (For Female Patients)</p>
            <div className="text-[10px] space-y-0.5">
              {menstrualHistory.menstrualCycle && <p><strong>Menstrual Cycle:</strong> {menstrualHistory.menstrualCycle}</p>}
              {menstrualHistory.lmp && <p><strong>LMP:</strong> {menstrualHistory.lmp}</p>}
              {menstrualHistory.padsPerDay != null && menstrualHistory.padsPerDay !== '' && <p><strong>Pads per day:</strong> {String(menstrualHistory.padsPerDay)}</p>}
              {menstrualHistory.cycleLengthDays != null && menstrualHistory.cycleLengthDays !== '' && <p><strong>Cycle Length:</strong> {String(menstrualHistory.cycleLengthDays)} days</p>}
              {menstrualHistory.cycleCountOnVisit != null && menstrualHistory.cycleCountOnVisit !== '' && <p><strong>Cycle Count on visit:</strong> {String(menstrualHistory.cycleCountOnVisit)}</p>}
              {menstrualHistory.clots && <p><strong>Clots:</strong> {menstrualHistory.clots}</p>}
              {menstrualHistory.menstrualFlow && <p><strong>Menstrual Flow:</strong> {menstrualHistory.menstrualFlow}</p>}
              {menstrualHistory.dysmenorrhea && <p><strong>Dysmenorrhea:</strong> Yes</p>}
              {menstrualHistory.leucorrhea && <p><strong>Leucorrhea:</strong> Yes</p>}
              {menstrualHistory.menopause && (
                <p>
                  <strong>Menopause:</strong> Yes
                  {menstrualHistory.menopauseAge != null && menstrualHistory.menopauseAge !== ''
                    ? ` (Age: ${String(menstrualHistory.menopauseAge)})`
                    : ''}
                </p>
              )}
              {(menstrualHistory.gravida != null && menstrualHistory.gravida !== '') || (menstrualHistory.para != null && menstrualHistory.para !== '') || (menstrualHistory.abortions != null && menstrualHistory.abortions !== '') ? (
                <p><strong>Pregnancy History:</strong> G: {menstrualHistory.gravida != null && menstrualHistory.gravida !== '' ? String(menstrualHistory.gravida) : '—'} P: {menstrualHistory.para != null && menstrualHistory.para !== '' ? String(menstrualHistory.para) : '—'} A: {menstrualHistory.abortions != null && menstrualHistory.abortions !== '' ? String(menstrualHistory.abortions) : '—'}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* Ayurveda Examination */}
        {ayurvedaExamination && Object.values(ayurvedaExamination).some((v) => v != null && v !== '') && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Ayurveda Examination</p>
            <table className="w-full text-[10px] border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-1.5 px-2 font-semibold border-b border-r border-gray-300">Parameter</th>
                  <th className="text-left py-1.5 px-2 font-semibold border-b border-gray-300">Observation</th>
                </tr>
              </thead>
              <tbody>
                {ayurvedaExamination.naadi && <tr className="border-b border-gray-200"><td className="py-1 px-2 border-r border-gray-200 font-medium">Naadi</td><td className="py-1 px-2">{ayurvedaExamination.naadi}</td></tr>}
                {ayurvedaExamination.malam && <tr className="border-b border-gray-200"><td className="py-1 px-2 border-r border-gray-200 font-medium">Malam</td><td className="py-1 px-2">{ayurvedaExamination.malam}</td></tr>}
                {(ayurvedaExamination.mootram || ayurvedaExamination.mootramColour) && (
                  <tr className="border-b border-gray-200">
                    <td className="py-1 px-2 border-r border-gray-200 font-medium">Mootram (Urine)</td>
                    <td className="py-1 px-2">
                      {[ayurvedaExamination.mootram, ayurvedaExamination.mootramColour].filter(Boolean).join(' · ')}
                    </td>
                  </tr>
                )}
                {ayurvedaExamination.jihwa && <tr className="border-b border-gray-200"><td className="py-1 px-2 border-r border-gray-200 font-medium">Jihwa</td><td className="py-1 px-2">{ayurvedaExamination.jihwa}</td></tr>}
                {ayurvedaExamination.shabda && <tr className="border-b border-gray-200"><td className="py-1 px-2 border-r border-gray-200 font-medium">Shabda</td><td className="py-1 px-2">{ayurvedaExamination.shabda}</td></tr>}
                {ayurvedaExamination.sparsha && (Array.isArray(ayurvedaExamination.sparsha) ? ayurvedaExamination.sparsha.length > 0 : ayurvedaExamination.sparsha) && (
                  <tr className="border-b border-gray-200">
                    <td className="py-1 px-2 border-r border-gray-200 font-medium">Sparsha</td>
                    <td className="py-1 px-2">{Array.isArray(ayurvedaExamination.sparsha) ? ayurvedaExamination.sparsha.join(', ') : ayurvedaExamination.sparsha}</td>
                  </tr>
                )}
                {(ayurvedaExamination.drik || ayurvedaExamination.drikColour) && (
                  <tr className="border-b border-gray-200">
                    <td className="py-1 px-2 border-r border-gray-200 font-medium">Drik (Eye) / Colour</td>
                    <td className="py-1 px-2">
                      {[ayurvedaExamination.drik, ayurvedaExamination.drikColour].filter(Boolean).join(' · ')}
                    </td>
                  </tr>
                )}
                {ayurvedaExamination.aakriti && <tr className="border-b border-gray-200"><td className="py-1 px-2 border-r border-gray-200 font-medium">Aakriti</td><td className="py-1 px-2">{ayurvedaExamination.aakriti}</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Medical History */}
        {patientMedicalHistory && (
          <div className="mb-2">
            <p className="text-[9px] font-semibold text-gray-600 mb-0.5 uppercase">Medical History</p>
            <p className="text-[10px] whitespace-pre-wrap border-b border-dotted border-gray-400">{patientMedicalHistory}</p>
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
          Print Invoice
        </Link>
        <p className="text-xs text-gray-500 w-full mt-2">Uses A5 paper. Set Margins to &quot;None&quot; for full page.</p>
      </div>
    </div>
  );
};

export default ConsultationPrintPage;
