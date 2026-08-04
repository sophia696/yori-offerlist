import { NextResponse } from "next/server"

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
You help affiliate marketers and media buyers analyze ad offers, payout models, GEO targets, and conversion flows.

Here is the current live list of active campaigns:
${offersContext}

Guidelines:
1. Provide concise, direct, actionable insights tailored for performance marketing.
2. If asked for recommendations, highlight high payouts, low friction flows, or top converting GEOs.
3. Be professional, clear, and structured (use bullet points or key stats).
4. If GROQ_API_KEY is active, answer with real-time analysis of the offers provided.`

    if (!apiKey) {
      // Intelligent mock fallback response if GROQ_API_KEY is not set yet
      const lastUserMsg = messages[messages.length - 1]?.content || ""
      let reply = "I am ready to analyze your campaigns!"
      
      const lower = lastUserMsg.toLowerCase()
      if (lower.includes("payout") || lower.includes("high") || lower.includes("10") || lower.includes("top")) {
        const highPayouts = offers?.filter((o: any) => {
          const po = parseFloat((o.po || "").replace(/[^0-9.]/g, ""))
          return po >= 10
        }) || []
        reply = `Found ${highPayouts.length} high-payout offers ($10+):\n\n` + 
          highPayouts.slice(0, 5).map((o: any) => `• **${o.campaign}** — ${o.po} (${o.geo}) [${o.model}]`).join("\n") +
          `\n\n*(Tip: Add your \`GROQ_API_KEY\` to \`.env.local\` for live deep-reasoning AI answers!)*`
      } else if (lower.includes("geo") || lower.includes("latam") || lower.includes("us") || lower.includes("country")) {
        reply = `Analyzing geographic distribution...\n\nTop active targets in your dataset include US, CA, DE, UK, and BR. Offers in Tier 1 GEOs (US/UK/DE) average higher payouts ($15+ CPA), while Tier 2/3 GEOs offer higher volume potential on Mobile CPL flows.`
      } else {
        reply = `I evaluated your ${offers?.length || 0} active offers. Key recommendations:\n\n1. **Focus on Mobile CPL/SOI**: Highest conversion velocity.\n2. **Targeting**: Ensure OS filters match campaign specs (e.g. Android 10+ for app install offers).\n3. **Scaling**: Consider scaling top performing GEOs using Push or Native ads.\n\n*(Connect your \`GROQ_API_KEY\` in \`.env.local\` to unlock full Groq Llama-3 70B AI responses)*`
      }

      return NextResponse.json({ reply })
    }

    // Call Groq API via standard OpenAI compatibility endpoint
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
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Groq API error:", errorText)
      throw new Error(`Groq API returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response."

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error("Error in AI Copilot route:", error)
    return NextResponse.json(
      { error: "AI service error", details: error.message },
      { status: 500 }
    )
  }
}
