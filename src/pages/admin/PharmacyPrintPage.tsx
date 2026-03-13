import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import logo from '@/assets/logo.png';

const PRINT_STORAGE_KEY = 'print_pharmacy_';

type MedicineRow = { medicineName: string; quantity: number; unitPrice: string; total?: string; uom?: string };

const PharmacyPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [cons, setCons] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Pharmacy-${id || 'bill'}`,
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
      let raw = localStorage.getItem(PRINT_STORAGE_KEY + id);
      if (!raw) raw = localStorage.getItem('print_consult_' + id);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>;
        setCons(data);
      }
    } catch {}
    setLoaded(true);
  }, [id]);


  if (!loaded) return <div className="min-h-screen flex items-center justify-center bg-white"><p>Loading...</p></div>;
  if (!cons) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
        <p className="text-lg text-muted-foreground text-center">No print data found.</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">Open the Consultation Bill first, then click &quot;Print Pharmacy Bill&quot;.</p>
      </div>
    );
  }

  const medicines = ((cons.medicines as MedicineRow[]) || []).map((m) => ({
    ...m,
    total: m.total ?? String(Number(m.quantity) * parseFloat(m.unitPrice || '0')),
  }));
  const treatments = (cons.treatments as { name: string; price: string }[]) || [];
  const patientName = (cons.patientName as string) || '';
  const consultationDate = (cons.consultationDate as string) || '';
  const clinicName = (cons.clinicName as string) || 'SRI VINAYAGA AYURVIBE';
  const doctorName = (cons.doctorName as string) || 'Dr. V.VAITHEESHWARI BAMS';
  const consultationFee = parseFloat((cons.consultationFee as string) || '0');
  const medicineTotal = parseFloat((cons.medicineTotal as string) || '0') || medicines.reduce((s, m) => s + parseFloat(m.total || '0'), 0);
  const treatmentTotal = parseFloat((cons.treatmentTotal as string) || '0') || treatments.reduce((s, t) => s + parseFloat(t.price || '0'), 0);
  const grandTotal = consultationFee + medicineTotal + treatmentTotal;

  return (
    <div className="min-h-screen bg-white p-4 print:p-0">
      <div
        ref={printRef}
        id="print-pharmacy"
        className="bg-white text-black relative mx-auto"
        style={{ width: '148mm', minHeight: '210mm', maxWidth: '100%' }}
      >
      <div className="absolute left-0 top-0 bottom-0 w-[6%] overflow-hidden pointer-events-none print:w-[4mm]">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 1200">
          <path d="M0,0 Q30,100 0,200 T0,400 Q30,500 0,600" fill="none" stroke="#16a34a" strokeWidth="20" opacity="0.2" />
        </svg>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-[6%] overflow-hidden pointer-events-none print:w-[4mm]">
        <svg className="absolute inset-0 w-full h-full scale-x-[-1]" preserveAspectRatio="none" viewBox="0 0 100 1200">
          <path d="M0,0 Q30,100 0,200 T0,400 Q30,500 0,600" fill="none" stroke="#16a34a" strokeWidth="20" opacity="0.2" />
        </svg>
      </div>

      <div className="relative pl-[10%] pr-[10%] py-3">
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

        {/* Patient */}
        <div className="mb-2 text-[10px]">
          <p><strong>Patient:</strong> {patientName || '—'}</p>
          <p><strong>Date:</strong> {consultationDate || '—'}</p>
        </div>

        {/* Bill: Consultation + Treatments + Medicines */}
        <div>
          <p className="text-xs font-bold mb-1.5 uppercase" style={{ color: '#15803d' }}>Bill</p>
          <table className="w-full text-[10px] border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-2 px-2 font-semibold border-b border-r border-gray-300">Item</th>
                <th className="text-right py-2 px-2 font-semibold border-b border-r border-gray-300 w-16">Qty</th>
                <th className="text-right py-2 px-2 font-semibold border-b border-r border-gray-300 w-20">Price (₹)</th>
                <th className="text-right py-2 px-2 font-semibold border-b border-gray-300 w-24">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {consultationFee > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 px-2 border-r border-gray-200">Consultation</td>
                  <td className="py-1.5 px-2 text-right border-r border-gray-200">1</td>
                  <td className="py-1.5 px-2 text-right border-r border-gray-200">{consultationFee.toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right font-medium">{consultationFee.toFixed(2)}</td>
                </tr>
              )}
              {treatments.map((t, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1.5 px-2 border-r border-gray-200">{t.name}</td>
                  <td className="py-1.5 px-2 text-right border-r border-gray-200">1</td>
                  <td className="py-1.5 px-2 text-right border-r border-gray-200">{parseFloat(t.price || '0').toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right font-medium">{parseFloat(t.price || '0').toFixed(2)}</td>
                </tr>
              ))}
              {medicines.map((m, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1.5 px-2 border-r border-gray-200">{m.medicineName}</td>
                  <td className="py-1.5 px-2 text-right border-r border-gray-200">{m.quantity} {m.uom || ''}</td>
                  <td className="py-1.5 px-2 text-right border-r border-gray-200">{parseFloat(m.unitPrice).toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right font-medium">{parseFloat(m.total || '0').toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 print:mt-2 flex justify-end">
            <div className="text-right space-y-0.5">
              {consultationFee > 0 && <p className="text-xs">Consultation: ₹{consultationFee.toFixed(2)}</p>}
              {treatmentTotal > 0 && <p className="text-xs">Treatments: ₹{treatmentTotal.toFixed(2)}</p>}
              {medicineTotal > 0 && <p className="text-xs">Medicines: ₹{medicineTotal.toFixed(2)}</p>}
              <p className="text-sm font-bold pt-1">Grand Total: ₹{grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-[9px] text-gray-500 text-center">
          <p>Reg No: 2055 | No : 17/587, Main Road, Nethaji Nagar, Perumbakkam (Nookampalayam), Chennai - 600141</p>
        </div>
      </div>
      </div>

      {/* Print button */}
      <div className="mt-6 print:hidden">
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 text-white font-medium rounded-lg hover:opacity-90"
          style={{ backgroundColor: '#22c55e' }}
        >
            Print Pharmacy Bill
        </button>
          <p className="text-xs text-gray-500 mt-2">Uses A5 paper. Set Margins to &quot;None&quot; for full page.</p>
      </div>
    </div>
  );
};

export default PharmacyPrintPage;
