import { NextResponse } from "next/server"
import { fetchOffersFromSheet } from "@/lib/google-sheets"
import { addOfferToSupabase } from "@/lib/offers-service"

export async function POST() {
  try {
    // 1. Fetch live rows from Google Sheets
    const { data: sheetOffers } = await fetchOffersFromSheet()

    if (!sheetOffers || sheetOffers.length === 0) {
      return NextResponse.json({ message: "No rows found in Google Sheet to sync", count: 0 })
    }

    let syncedCount = 0

    // 2. Bulk insert rows into Supabase database
    for (const offer of sheetOffers) {
      if (offer.campaign) {
        await addOfferToSupabase({
          campaign: offer.campaign,
          model: offer.model || "CPA",
          geo: offer.geo || "",
          previewUrl: offer.previewUrl || "",
          poEvent: offer.poEvent || "",
          flow: offer.flow || "",
          billing: offer.billing || "",
          os: offer.os || "",
          po: offer.po || "$0.00",
          status: offer.status || "Active",
        })
        syncedCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} offers from Google Sheets to Supabase!`,
      count: syncedCount,
    })
  } catch (error: any) {
    console.error("Sync API Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync Google Sheets data to Supabase" },
      { status: 500 }
    )
  }
}
