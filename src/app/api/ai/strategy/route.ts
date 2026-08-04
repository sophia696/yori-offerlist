import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { offer } = await request.json()
    if (!offer) {
      return NextResponse.json({ error: "Offer data is required" }, { status: 400 })
    }

    const apiKey = process.env.GROQ_API_KEY

    // Heuristics fallback if no Groq API Key set
    if (!apiKey) {
      const payoutVal = parseFloat((offer.po || "").replace(/[^0-9.]/g, "")) || 5
      const flowText = (offer.flow || "").toLowerCase()
      
      let friction: "Low" | "Medium" | "High" = "Low"
      let frictionReason = "Simple single-step user flow"

      if (flowText.includes("cc") || flowText.includes("deposit") || flowText.includes("card") || flowText.includes("loan")) {
        friction = "High"
        frictionReason = "Requires credit card details or financial deposit"
      } else if (flowText.includes("sms") || flowText.includes("pin") || flowText.includes("survey") || flowText.includes("2-step")) {
        friction = "Medium"
        frictionReason = "Multi-step verification or phone SMS check required"
      }

      const trafficChannels = [
        { channel: "Push Notifications", score: 92, reason: "High CTR for fast consumer offers & app installs" },
        { channel: "Native Ads", score: 85, reason: "Great for editorial content and lead generation" },
        { channel: "Meta Ads (FB/IG)", score: 78, reason: "Strong audience targeting capabilities" },
        { channel: "Google PPC / Search", score: 88, reason: "High intent search traffic" },
      ]

      const hooks = [
        `🔥 "Attention ${offer.geo || 'User'}: Exclusive Offer end today!"`,
        `💡 "How to get started with ${offer.campaign} in 3 simple steps."`,
        `⚡ "Claim your special bonus — Available now on ${offer.os || 'Mobile'}!"`
      ]

      const suggestedBid = `$${(payoutVal * 0.25).toFixed(2)} - $${(payoutVal * 0.45).toFixed(2)} / click (CPC)`
      const executiveSummary = `${offer.campaign} is a ${offer.model || 'CPA'} offer targeting ${offer.geo || 'Global'} on ${offer.os || 'All OS'} with a payout of ${offer.po || 'N/A'}.`

      return NextResponse.json({
        friction,
        frictionReason,
        trafficChannels,
        hooks,
        suggestedBid,
        executiveSummary,
        isMock: true
      })
    }

    // Call Groq API for campaign analysis
    const systemPrompt = `You are Yori AI Strategy Generator. Given an offer, generate structured JSON analysis with:
1. "executiveSummary": 1 concise sentence summarizing the offer.
2. "friction": "Low", "Medium", or "High"
3. "frictionReason": brief explanation
4. "suggestedBid": recommended bidding range
5. "hooks": array of 3 catchy ad copy hooks
6. "trafficChannels": array of 4 objects { "channel": string, "score": number (0-100), "reason": string }

Respond strictly with valid JSON.`

    const prompt = `Analyze offer:
Campaign: ${offer.campaign}
Model: ${offer.model}
Geo: ${offer.geo}
Payout: ${offer.po}
OS: ${offer.os}
Flow: ${offer.flow}
Billing: ${offer.billing}`

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
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq returned ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    const parsed = JSON.parse(content)

    return NextResponse.json({ ...parsed, isMock: false })
  } catch (error: any) {
    console.error("Strategy API error:", error)
    return NextResponse.json({ error: "Failed to generate strategy" }, { status: 500 })
  }
}
