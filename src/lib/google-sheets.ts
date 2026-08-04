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

    // Find header row index (e.g. row containing "App Name" or "S no." or "Campaign")
    let headerRowIdx = rows.findIndex((row: string[]) => 
      row.some((cell: any) => String(cell).toLowerCase().includes("app name") || String(cell).toLowerCase().includes("s no") || String(cell).toLowerCase().includes("campaign"))
    )

    if (headerRowIdx !== -1) {
      rows = rows.slice(headerRowIdx + 1)
    }

    if (!rows || rows.length === 0) {
      throw new Error(`Google Sheets API connected to sheet tab '${firstSheetTitle}', but found 0 data rows in A:Z range.`)
    }

    // Map raw array rows to structured objects matching your new sheet columns:
    // Row layout: [0]=S no, [1]=App Name (Campaign), [2]=Preview URL, [3]=OS, [4]=Geo, [5]=Payout, etc.
    const data: Offer[] = rows
      .filter((row: any[]) => row[1] || row[0])
      .map((row: any[]) => {
        const campaign = row[1] || row[0] || ""
        return {
          campaign: String(campaign).trim(),
          previewUrl: row[2] ? String(row[2]).trim() : "",
          os: row[3] ? String(row[3]).trim() : "",
          geo: row[4] ? String(row[4]).trim() : "",
          po: row[5] ? String(row[5]).trim() : "$0.00",
          model: row[6] ? String(row[6]).trim() : "CPA",
          status: row[7] ? String(row[7]).trim() : "Active",
          flow: row[8] ? String(row[8]).trim() : "",
          billing: row[9] ? String(row[9]).trim() : "",
        }
      })

    return { data, isMock: false }
  } catch (error) {
    console.error("❌ Error fetching from Google Sheets:", error)
    return { data: [], isMock: false }
  }
}


