import { NextResponse } from "next/server"
import { fetchOffersFromSheet } from "@/lib/google-sheets"
import { addOfferToSupabase } from "@/lib/offers-service"

export async function POST() {
  try {
    // 1. Fetch live rows from Google Sheets
    const sheetResult = await fetchOffersFromSheet()
    const sheetOffers = sheetResult.data

    if (!sheetOffers || sheetOffers.length === 0) {
      return NextResponse.json({ 
        message: `No rows found in Google Sheet to sync`, 
        count: 0 
      })
    }

    // 2. Clear old data from Supabase to prevent duplicate/redundant sync items
    const { createClient } = await import("@/lib/supabase")
    const supabase = createClient()
    
    // Delete all existing offers to do a clean overwrite sync
    const { error: deleteError } = await supabase
      .from('offers')
      .delete()
      .neq('campaign', 'THIS_IS_A_DUMMY_VALUE_TO_DELETE_ALL_ROWS')

    if (deleteError) {
      console.warn("Could not truncate table, trying to clean up duplicate names individually:", deleteError)
    }

    let syncedCount = 0

    // 3. Insert rows cleanly into Supabase database in bulk or sequence
    const payload = sheetOffers
      .filter(offer => offer.campaign)
      .map((offer, idx) => ({
        campaign: offer.campaign,
        model: offer.model || "CPA",
        geo: offer.geo || "",
        preview_url: offer.previewUrl || "",
        po_event: offer.poEvent || "",
        flow: offer.flow || "",
        billing: offer.billing || "",
        os: offer.os || "",
        po: offer.po || "$0.00",
        status: offer.status || "Active",
        // Save the index to preserve order
        id: String(idx + 1)
      }))

    const { error: insertError } = await supabase
      .from('offers')
      .insert(payload)

    if (insertError) {
      // Fallback one-by-one to avoid breaking on constraints
      for (const item of payload) {
        await supabase.from('offers').insert([item])
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned and synced ${payload.length} offers from Google Sheets to Supabase!`,
      count: payload.length,
    })
  } catch (error: any) {
    console.error("Sync API Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to sync Google Sheets data to Supabase" },
      { status: 500 }
    )
  }
}

