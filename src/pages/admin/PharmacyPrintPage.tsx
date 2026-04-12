import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Leaf } from 'lucide-react';
import logo from '@/assets/logo.png';
import { formatExpiryOrDateLabel, formatPharmacyPrintBillDateTime } from '@/lib/datetime';

const PRINT_STORAGE_KEY = 'print_pharmacy_';

type MedicineRow = {
  medicineName: string;
  quantity: number;
  unitPrice: string;
  total?: string;
  uom?: string;
  batchNumber?: string;
  expiryDate?: string;
};

const PharmacyPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const printRef = useRef<HTMLDivElement>(null);
  const [cons, setCons] = useState<Record<string, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Pharmacy-${id || 'invoice'}`,
    pageStyle: `
      @page { size: A5 portrait; margin: 5mm; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        table { page-break-inside: auto; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; page-break-after: auto; }
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
        <p className="text-sm text-muted-foreground mt-2 text-center">Open the Pharmacy page first, then save to print the invoice.</p>
      </div>
    );
  }

  const medicines = ((cons.medicines as MedicineRow[]) || []).map((m) => ({
    ...m,
    total: m.total ?? String(Number(m.quantity) * parseFloat(m.unitPrice || '0')),
  }));
  const treatments = (cons.treatments as { name: string; price: string }[]) || [];
  const feeFromTreatment = parseFloat(treatments.find((t) => t.name === 'Consultation')?.price || '0');
  const feeFromField = parseFloat(String(cons.consultationFee ?? '0'));
  const consultationFee = Number.isFinite(feeFromTreatment) && feeFromTreatment > 0 ? feeFromTreatment : feeFromField;
  const medicineDiscount = treatments.find((t) => t.name === 'Medicine Discount');
  const medicineDiscountAmount = medicineDiscount ? parseFloat(medicineDiscount.price || '0') : 0;
  const treatmentsExcludingFee = treatments.filter((t) => t.name !== 'Consultation');
  const patientName = (cons.patientName as string) || '';
  const rawMobile = (cons.patientMobile as string) || '';
  const digitsOnly = rawMobile.replace(/\D/g, '');
  const patientMobile = digitsOnly.length === 10 && !rawMobile.includes('+')
    ? `+91 ${digitsOnly}`
    : rawMobile;
  /** Bill / pharmacy issue date (bill fields, else consultation date for direct-sale / legacy payloads). */
  const dateTimeStr = formatPharmacyPrintBillDateTime(cons);
  const DEFAULT_ORG = 'Sri Vinayaga Ayurvibe';
  const clinicTitle = String(cons.clinicName as string || '').trim() || DEFAULT_ORG;
  const subtitle =
    String((cons.clinicSubtitle as string) || (cons.clinicBranch as string) || '').trim() || '';
  const doctorLine = String(cons.doctorName as string || '').trim();
  const contactLine =
    String((cons.clinicPhone as string) || (cons.clinicContact as string) || '').trim() ||
    '+91 8122339197 | svayurvibe@gmail.com';
  const footerAddress =
    String(cons.clinicAddress as string || '').trim() ||
    'No : 12/597, Mainroad, Nethaji nagar, Perumbakkam, Chennai - 600131.';
  const medicineTotal = parseFloat((cons.medicineTotal as string) || '0') || medicines.reduce((s, m) => s + parseFloat(m.total || '0'), 0);
  const treatmentTotal = parseFloat((cons.treatmentTotal as string) || '0') || treatments.reduce((s, t) => s + parseFloat(t.price || '0'), 0);
  const grandTotal = medicineTotal + treatmentTotal;
  const paymentMode = (cons.paymentMode as string) || 'Cash';

  return (
    <div className="min-h-screen bg-white p-2 print:p-0">
      <div
        ref={printRef}
        id="print-pharmacy"
        className="bg-white text-black relative mx-auto print:max-w-none"
        style={{ width: '148mm', maxWidth: '100%' }}
      >
      <div className="relative px-3 py-2 print:px-2 print:py-1.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2 print:mb-1.5">
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-wide leading-tight" style={{ color: '#15803d' }}>
              {clinicTitle}
            </h1>
            {subtitle ? (
              <p className="text-[11px] font-semibold mt-0.5 uppercase" style={{ color: '#166534' }}>
                {subtitle}
              </p>
            ) : null}
            {doctorLine ? (
              <p className="text-[10px] font-medium mt-1" style={{ color: '#166534' }}>
                {doctorLine}
              </p>
            ) : null}
            <p className="text-[9px] text-gray-600 mt-0.5">{contactLine}</p>
          </div>
          <img src={logo} alt="" className="h-14 w-auto shrink-0 object-contain print:h-16" />
        </div>

        {/* Beneficiary + bill date (right) */}
        <div className="mb-3 flex flex-row justify-between items-start gap-3 text-[10px]">
          <table className="w-full max-w-[58%]">
            <tbody>
              <tr>
                <td className="py-0.5 pr-4 font-semibold align-top w-20">Beneficiary</td>
                <td className="py-0.5 align-top">{patientName || '—'}</td>
              </tr>
              {patientMobile && (
                <tr>
                  <td className="py-0.5 pr-4 font-semibold align-top">Mobile</td>
                  <td className="py-0.5 align-top">{patientMobile}</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="text-right shrink-0 min-w-[132px] border border-gray-200 rounded px-2 py-1.5 bg-gray-50/80">
            <p className="text-[9px] font-bold uppercase tracking-wide text-gray-600">Bill date</p>
            <p className="text-[10px] font-semibold tabular-nums text-gray-900 mt-0.5 leading-tight">{dateTimeStr || '—'}</p>
          </div>
        </div>

        {/* Invoice: Consultation + Treatments + Medicines */}
        <div>
          <p className="text-[11px] font-bold mb-1 uppercase" style={{ color: '#15803d' }}>Invoice</p>
          <table className="w-full text-[9px] border border-gray-300 table-fixed leading-tight">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-1.5 px-2 font-semibold border-b border-r border-gray-300 w-[28%]">Description</th>
                <th className="text-left py-1.5 px-1 font-semibold border-b border-r border-gray-300 w-[14%] text-[9px]">Batch</th>
                <th className="text-left py-1.5 px-1 font-semibold border-b border-r border-gray-300 w-[14%] text-[9px]">Expiry</th>
                <th className="text-right py-1.5 px-1 font-semibold border-b border-r border-gray-300 w-[10%]">Qty</th>
                <th className="text-right py-1.5 px-1 font-semibold border-b border-r border-gray-300 w-[16%]">Price (₹)</th>
                <th className="text-right py-1.5 px-2 font-semibold border-b border-gray-300 w-[18%]">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {consultationFee > 0 && (
                <tr className="border-b border-gray-200">
                  <td className="py-1.5 px-2 border-r border-gray-200 align-top">Consultation</td>
                  <td className="py-1.5 px-1 border-r border-gray-200 text-gray-500 align-top">—</td>
                  <td className="py-1.5 px-1 border-r border-gray-200 text-gray-500 align-top">—</td>
                  <td className="py-1.5 px-1 text-right border-r border-gray-200 align-top">1</td>
                  <td className="py-1.5 px-1 text-right border-r border-gray-200 align-top">{consultationFee.toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right font-medium align-top">{consultationFee.toFixed(2)}</td>
                </tr>
              )}
              {treatmentsExcludingFee.map((t, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1.5 px-2 border-r border-gray-200 align-top">{t.name}</td>
                  <td className="py-1.5 px-1 border-r border-gray-200 text-gray-500 align-top">—</td>
                  <td className="py-1.5 px-1 border-r border-gray-200 text-gray-500 align-top">—</td>
                  <td className="py-1.5 px-1 text-right border-r border-gray-200 align-top">1</td>
                  <td className="py-1.5 px-1 text-right border-r border-gray-200 align-top">{parseFloat(t.price || '0').toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right font-medium align-top">{parseFloat(t.price || '0').toFixed(2)}</td>
                </tr>
              ))}
              {medicines.map((m, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1.5 px-2 border-r border-gray-200 align-top font-medium">{m.medicineName}</td>
                  <td className="py-1.5 px-1 border-r border-gray-200 text-[9px] text-gray-600 align-top break-words">{m.batchNumber || '—'}</td>
                  <td className="py-1.5 px-1 border-r border-gray-200 text-[9px] text-gray-600 align-top tabular-nums">
                    {formatExpiryOrDateLabel(m.expiryDate)}
                  </td>
                  <td className="py-1.5 px-1 text-right border-r border-gray-200 align-top tabular-nums">
                    {m.quantity}
                    {m.uom ? ` ${m.uom}` : ''}
                  </td>
                  <td className="py-1.5 px-1 text-right border-r border-gray-200 align-top tabular-nums">{parseFloat(m.unitPrice).toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right font-medium align-top tabular-nums">{parseFloat(m.total || '0').toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 print:mt-2 flex justify-end">
            <div className="text-right space-y-0.5">
              {consultationFee > 0 && <p className="text-xs">Consultation: ₹{consultationFee.toFixed(2)}</p>}
              {treatmentsExcludingFee.filter((t) => t.name !== 'Medicine Discount').length > 0 && (
                <p className="text-xs">Treatments: ₹{treatmentsExcludingFee.filter((t) => t.name !== 'Medicine Discount').reduce((s, t) => s + parseFloat(t.price || '0'), 0).toFixed(2)}</p>
              )}
              {medicineTotal > 0 && <p className="text-xs">Medicines: ₹{medicineTotal.toFixed(2)}</p>}
              {medicineDiscountAmount < 0 && <p className="text-xs text-green-600">Discount: ₹{medicineDiscountAmount.toFixed(2)}</p>}
              <p className="text-sm font-bold pt-1">Grand Total: ₹{grandTotal.toFixed(2)}</p>
              <p className="text-xs pt-1.5 text-gray-600">Payment Info: {paymentMode}</p>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium" style={{ color: '#15803d' }}>
          <Leaf className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          <p className="italic">In the path of Ayurveda, towards Perfect Health</p>
        </div>

        {/* Footer */}
        <div className="mt-4 text-[9px] text-gray-500 text-center">
          <p>{footerAddress}</p>
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
            Print Invoice
        </button>
          <p className="text-xs text-gray-500 mt-2">A5 portrait. Use default or minimum margins; long invoices continue on extra pages.</p>
      </div>
    </div>
  );
};

export default PharmacyPrintPage;
