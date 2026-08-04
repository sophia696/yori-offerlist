import { google } from "googleapis"
import { Offer } from "./validations"

export async function fetchOffersFromSheet(): Promise<{ data: Offer[], isMock: boolean }> {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    // Parse private key correctly handling escaped newlines
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
    const sheetId = process.env.GOOGLE_SHEET_ID

    if (!clientEmail || !privateKey || !sheetId) {
      console.warn("⚠️ Google Sheets credentials not fully provided.")
      return { data: [], isMock: false }
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
