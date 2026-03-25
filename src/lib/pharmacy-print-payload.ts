/**
 * Pharmacy print / localStorage payload: only billing + beneficiary name & mobile
 * (avoid storing full consultation / clinical details in localStorage).
 */
type MedicineLine = {
  medicineName: string;
  quantity: number;
  unitPrice: string;
  total?: string;
  uom?: string;
  batchNumber?: string;
  expiryDate?: string;
};

type TreatmentLine = { name: string; price: string };

export function buildPharmacyPrintPayload(
  data: Record<string, unknown>,
  extras: {
    paymentMode: string;
    billDate: string;
    billTime: string;
    billDateLabel: string;
  },
): Record<string, unknown> {
  const medicines = ((data.medicines as MedicineLine[]) || []).map((m) => ({
    medicineName: m.medicineName,
    quantity: m.quantity,
    unitPrice: String(m.unitPrice ?? 0),
    total: m.total != null ? String(m.total) : String(Number(m.quantity) * parseFloat(String(m.unitPrice ?? 0))),
    uom: m.uom,
    batchNumber: m.batchNumber,
    expiryDate: m.expiryDate,
  }));
  const treatments = ((data.treatments as TreatmentLine[]) || []).map((t) => ({
    name: t.name,
    price: String(t.price ?? 0),
  }));
  const patientName = String(data.patientName ?? '').trim();
  const rawMobile = String(data.patientMobile ?? '').trim();

  const pick = (k: string) => {
    const v = data[k];
    return v != null && v !== '' ? v : undefined;
  };

  return {
    patientName,
    patientMobile: rawMobile || undefined,
    clinicName: data.clinicName,
    clinicSubtitle: pick('clinicSubtitle'),
    clinicAddress: pick('clinicAddress'),
    clinicPhone: pick('clinicPhone'),
    doctorName: data.doctorName,
    consultationDate: data.consultationDate,
    consultationTime: data.consultationTime,
    consultationFee: data.consultationFee,
    medicines,
    treatments,
    medicineTotal: data.medicineTotal,
    treatmentTotal: data.treatmentTotal,
    billDate: extras.billDate,
    billTime: extras.billTime,
    billDateLabel: extras.billDateLabel,
    paymentMode: extras.paymentMode,
  };
}
