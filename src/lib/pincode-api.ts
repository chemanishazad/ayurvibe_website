/** Fetch location from Indian pincode via api.postalpincode.in */
export interface PincodeResult {
  location: string;
  district: string;
  state: string;
  postOffices: string[];
}

export async function fetchLocationByPincode(pincode: string): Promise<PincodeResult | null> {
  const digits = pincode.replace(/\D/g, '');
  if (digits.length !== 6) return null;
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${digits}`, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || data[0]?.Status !== 'Success') return null;
    const offices = data[0]?.PostOffice;
    if (!Array.isArray(offices) || offices.length === 0) return null;
    const first = offices[0];
    const district = first.District || '';
    const state = first.State || '';
    const postOffices = offices.map((o: { Name?: string }) => (o.Name || '').trim()).filter(Boolean);
    const location = [postOffices.join(', '), district, state].filter(Boolean).join(', ');
    return { location, district, state, postOffices };
  } catch {
    return null;
  }
}
