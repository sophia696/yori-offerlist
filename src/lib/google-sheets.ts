import { google } from "googleapis"
import { Offer } from "./validations"

export async function fetchOffersFromSheet(): Promise<{ data: Offer[], isMock: boolean }> {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
    let privateKey = process.env.GOOGLE_PRIVATE_KEY
    const sheetId = process.env.GOOGLE_SHEET_ID

    if (!clientEmail || !privateKey || !sheetId) {
      console.warn("⚠️ Missing Google Sheets environment variables in Vercel.")
      throw new Error("Google Sheets credentials (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID) are missing in Vercel Environment Variables.")
    }

    // Clean private key formatting for Vercel deployment
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1)
    }
    privateKey = privateKey.replace(/\\n/g, "\n")



    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // Get spreadsheet metadata to read the exact first sheet tab name
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId })
    const firstSheetTitle = meta.data.sheets?.[0]?.properties?.title || "Sheet1"

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `'${firstSheetTitle}'!A1:Z1000`,
    })

    let rows = response.data.values || []

    // If first row looks like headers (e.g. contains 'campaign' or 'model'), skip header row
    if (rows.length > 0 && (rows[0][0]?.toLowerCase().includes("campaign") || rows[0][0]?.toLowerCase().includes("offer"))) {
      rows = rows.slice(1)
    }

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
    return { data: [], isMock: false }
  }
}

