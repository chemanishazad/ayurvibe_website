/** Plain-text bill body for WhatsApp (wa.me) — mirrors backend PDF/text bill for consistency. */
export type WhatsAppBillLine = {
  customerName: string;
  medicines: Array<{
    medicineName: string;
    quantity: number;
    unitPrice: string;
    total: string;
    batchNumber?: string;
    expiryDate?: string;
    uom?: string;
  }>;
  consultationFee?: number;
  treatments?: Array<{ name: string; price: string }>;
  medicineTotal: string;
  treatmentTotal: string;
  grandTotal: string;
  paymentMode?: string;
  date?: string;
  clinicName?: string;
  /** Shown on PDF header */
  patientMobile?: string;
  billTitle?: string;
  saleType?: string;
};

export function formatWhatsAppBillText(data: WhatsAppBillLine): string {
  const lines: string[] = [
    '🏥 *Sri Vinayaga Ayurvibe*',
    '📋 Pharmacy Bill',
    '',
    `*Beneficiary:* ${data.customerName}`,
    data.date ? `*Date:* ${data.date}` : '',
    data.clinicName ? `*Clinic:* ${data.clinicName}` : '',
    '',
    '*Invoice:*',
  ].filter(Boolean);

  if (data.consultationFee && data.consultationFee > 0) {
    lines.push(`Consultation: ₹${Number(data.consultationFee).toFixed(2)}`);
  }
  (data.treatments || []).forEach((t) => {
    const price = parseFloat(t.price || '0');
    if (t.name !== 'Consultation') lines.push(`${t.name}: ₹${price.toFixed(2)}`);
  });
  data.medicines.forEach((m) => {
    lines.push(
      `${m.medicineName} x${m.quantity} @ ₹${m.unitPrice} = ₹${m.total || (m.quantity * parseFloat(m.unitPrice)).toFixed(2)}`,
    );
  });
  lines.push('');
  lines.push(`*Grand Total: ₹${data.grandTotal}*`);
  if (data.paymentMode) lines.push(`Payment: ${data.paymentMode}`);
  lines.push('');
  lines.push('Thank you for visiting Sri Vinayaga Ayurvibe 🙏');

  return lines.join('\n');
}

/** Digits only, with country code (default India 91). */
export function whatsAppWaMePath(mobileDigits: string, countryCode = '91'): string {
  const digits = String(mobileDigits || '').replace(/\D/g, '');
  if (digits.length === 0) return '';
  const to = digits.length > 10 && digits.startsWith(countryCode) ? digits : countryCode + digits.slice(-10);
  return to;
}

export function openWhatsAppWithText(mobileDigits: string, text: string, countryCode = '91'): void {
  const to = whatsAppWaMePath(mobileDigits, countryCode);
  if (!to) return;
  const url = `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
