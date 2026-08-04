import { google } from "googleapis"
import { Offer } from "./validations"

// Mock data fallback if no credentials are provided yet
const mockData: Offer[] = [
  { campaign: "20bet", model: "CPA", geo: "APK: DE, CL, MX, IE, ES, IT, GR IOS: CL, PE, NZ, CA", status: "Active" },
  { campaign: "22BIT", model: "CPA", geo: "SI, BA, RS, SK, BG, CH, FI, IE, AT, IT, HU, HR, GR, ES, PL, DK, NO, IN, BR, BD, NZ, CZ, CA, CL, PE, PH, RO, PY", status: "Paused" },
  { campaign: "22bet", model: "CPA", geo: "IOS: NG SN UG KE GH CA Android: NG, SI, SK, BG, CH, DE, FI, IE, AT, CL, IT, HU, GR, ES, PL, PT, DK, NO, IN", status: "Active" },
  { campaign: "ABC Cleaner VPN", model: "CPA", geo: "ww", status: "Active" },
  { campaign: "AICleanupper (Clenzo)", model: "CPA", geo: "ww", status: "Active" },
  { campaign: "AMarkets", model: "CPA, CPL", geo: "Mexico, India, Iran, Iraq, Uzbekistan, Malaysia, Indonesia, Uzbekistan, TR, KZ, KG, AE, RU", status: "Active" },
  { campaign: "Adslocker - Spam & AD Blocker", model: "CPA", geo: "US, CA, UK, AU", status: "Active" },
  { campaign: "AfroPari", model: "CPA", geo: "BF, KE, CI, BJ, NG, GH, TZ, ZM, UG, CD, CG, NF, TG, CM, UG", status: "Active" },
  { campaign: "Centrofinans", model: "CPA", geo: "RU (кроме регионов повышенного риска)", poEvent: "pdl_new_client_receiving", flow: "Install → Login/Register → Phone Verification → Choose Product (PDL) → Apply for Free → Complete Steps 1-4 → Success Page (Event Fired)", billing: "CRM", os: "AOS, iOS", po: "12.5$", previewUrl: "https://play.google.com/store/apps/details?id=ru.centrofinans.app&hl=ru", status: "Active" },
]

export async function fetchOffersFromSheet(): Promise<{ data: Offer[], isMock: boolean }> {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    // Parse private key correctly handling escaped newlines
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    const sheetId = process.env.GOOGLE_SHEET_ID

    // If missing any env variable, return mock data to prevent breaking the app
    if (!clientEmail || !privateKey || !sheetId) {
      console.warn("⚠️ Google Sheets credentials not fully provided. Falling back to mock data.")
      return { data: mockData, isMock: true }
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })
    
    // Use generic range A2:J1000 to query the first visible sheet regardless of its tab name
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "A2:J1000", // Skip header row
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      return { data: [], isMock: false }
    }

    // Map raw array rows to structured objects
    const data: Offer[] = rows.map((row) => ({
      campaign: row[0] || "",
      model: row[1] || "",
      geo: row[2] || "",
      status: row[3] || "Active",
      previewUrl: row[4] || "",
      poEvent: row[5] || "",
      flow: row[6] || "",
      billing: row[7] || "",
      os: row[8] || "",
      po: row[9] || "",
    }))

    return { data, isMock: false }
  } catch (error) {
    console.error("❌ Error fetching from Google Sheets:", error)
    // Return mock data on failure to ensure UI stays up
    return { data: mockData, isMock: true }
  }
}
