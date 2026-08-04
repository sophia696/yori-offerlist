import { addOfferToSupabase } from "@/lib/offers-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages, offers } = body

    const apiKey = process.env.GROQ_API_KEY

    // Build context summary of offers to pass to Groq
    const offersContext = offers && Array.isArray(offers)
      ? offers.slice(0, 50).map((o: any, idx: number) => 
          `[${idx+1}] ${o.campaign} | Model: ${o.model || 'N/A'} | GEO: ${o.geo || 'N/A'} | Payout: ${o.po || 'N/A'} | OS: ${o.os || 'N/A'} | Flow: ${o.flow || 'N/A'} | Status: ${o.status || 'Active'}`
        ).join("\n")
      : "No live offer list provided."

    const systemPrompt = `You are Yori Offers AI — an elite Affiliate Media Buyer & Campaign Intelligence Assistant.
You help affiliate marketers analyze offer emails, campaign descriptions, payout models, GEO targets, and conversion flows.

Here is the current live list of active campaigns:
${offersContext}

CRITICAL FEATURE - AUTOMATIC OFFER CREATION:
If the user pastes an offer email, offer details, or asks you to add an offer (e.g. "Add this offer: ...", "Parse this email: ..."), you MUST analyze the text and return a special JSON block AT THE VERY END of your response in this EXACT format:

<<<ADD_OFFER_JSON
{
  "campaign": "Extracted Campaign Name",
  "model": "CPA / CPL / RevShare",
  "geo": "Extracted GEO codes e.g. US, DE, IN",
  "po": "$15.00",
  "status": "Active",
  "billing": "CRM / Net15",
  "os": "Android / iOS",
  "flow": "Brief description of conversion flow",
  "previewUrl": "URL if available or empty"
}
ADD_OFFER_JSON>>>

Before the JSON block, explain your analysis clearly to the user, summarizing the key details found in their email. If the text is NOT an offer email or request to add an offer, answer normally without the JSON block.`

    if (!apiKey) {
      const lastUserMsg = messages[messages.length - 1]?.content || ""
      return NextResponse.json({ 
        reply: "Please add your GROQ_API_KEY to .env.local to enable automatic offer email analysis and database insertion!" 
      })
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 1200,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Groq API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    let reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process your request."

    let addedOffer = null

    // Check if AI generated an offer creation block
    const jsonMatch = reply.match(/<<<ADD_OFFER_JSON\s*([\s\S]*?)\s*ADD_OFFER_JSON>>>/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsedOffer = JSON.parse(jsonMatch[1])
        if (parsedOffer.campaign) {
          addedOffer = await addOfferToSupabase(parsedOffer)
          // Clean the hidden JSON block from user display and append confirmation
          reply = reply.replace(/<<<ADD_OFFER_JSON[\s\S]*?ADD_OFFER_JSON>>>/, "").trim()
          reply += `\n\n✅ **Successfully added "${parsedOffer.campaign}" to Supabase Database!**`
        }
      } catch (err) {
        console.error("Failed to parse or insert AI offer:", err)
      }
    }

    return NextResponse.json({ reply, addedOffer })
  } catch (error: any) {
    console.error("Error in AI Copilot route:", error)
    return NextResponse.json(
      { error: "AI service error", details: error.message },
      { status: 500 }
    )
  }
}

