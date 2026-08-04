"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Send, Bot, User, RefreshCw, Zap, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Offer } from "@/lib/validations"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface AiCopilotDrawerProps {
  isOpen: boolean
  onClose: () => void
  offers: Offer[]
}

const QUICK_QUERIES = [
  "Which offers pay over $10?",
  "What are the top active CPA campaigns?",
  "Show me high-volume GEO targets",
  "Summarize financial and app offers"
]

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n")
  return (
    <div className="space-y-1">
      {lines.map((line, lIdx) => {
        if (!line.trim()) return <div key={lIdx} className="h-1.5" />
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g)
        return (
          <p key={lIdx} className="leading-relaxed">
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
                return (
                  <strong key={pIdx} className="font-bold text-foreground">
                    {part.slice(2, -2)}
                  </strong>
                )
              }
              if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
                return (
                  <em key={pIdx} className="italic opacity-90">
                    {part.slice(1, -1)}
                  </em>
                )
              }
              if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
                return (
                  <code key={pIdx} className="px-1 py-0.5 rounded bg-muted/80 font-mono text-[11px] text-primary">
                    {part.slice(1, -1)}
                  </code>
                )
              }
              return part
            })}
          </p>
        )
      })}
    </div>
  )
}

export function AiCopilotDrawer({ isOpen, onClose, offers }: AiCopilotDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `👋 **Hi! I am Yori AI Copilot**, powered by Groq. I can analyze your **${offers.length} active campaigns**, suggest bidding strategies, or filter offers in real-time. Ask me anything!`
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  if (!isOpen) return null

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input
    if (!textToSend.trim() || isLoading) return

    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }]
    setMessages(newMessages)
    if (!queryText) setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          offers,
        }),
      })

      if (!res.ok) throw new Error("Failed to reach AI assistant")

      const data = await res.json()
      setMessages([...newMessages, { role: "assistant", content: data.reply }])

      // If AI automatically added an offer to Supabase, trigger React Query refresh
      if (data.addedOffer) {
        window.dispatchEvent(new CustomEvent("offer-added-by-ai"))
      }
    } catch (err: any) {

      setMessages([
        ...newMessages,
        { role: "assistant", content: "❌ Sorry, I encountered an error communicating with the AI service." }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm transition-all duration-300">
      <div 
        className="w-full max-w-md bg-card/95 border-l border-border/50 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 relative"
      >
        {/* Header */}
        <div className="p-4 border-b border-border/40 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-inner">
              <Sparkles className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
                Yori AI Copilot
                <Badge variant="outline" className="text-[10px] uppercase border-primary/40 text-primary py-0 px-1.5 font-mono">
                  Groq LLM
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">Natural Language Offer Assistant</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Query Chips */}
        <div className="p-3 border-b border-border/30 bg-muted/10">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
            Quick Prompts
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-[11px] bg-secondary/60 hover:bg-primary/20 hover:text-primary text-secondary-foreground px-2.5 py-1 rounded-md transition-colors border border-border/40 text-left disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div
                className={`p-3 rounded-xl max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-tr-none shadow-sm"
                    : "bg-muted/50 border border-border/40 text-foreground rounded-tl-none font-sans"
                }`}
              >
                <FormattedText text={msg.content} />
              </div>
              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center text-secondary-foreground shrink-0">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 text-xs justify-start items-center text-muted-foreground">
              <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 animate-spin">
                <RefreshCw className="h-3.5 w-3.5" />
              </div>
              <div className="bg-muted/30 border border-border/40 px-3 py-2 rounded-xl rounded-tl-none animate-pulse flex items-center gap-2 font-mono">
                <Zap className="h-3.5 w-3.5 text-primary" /> Groq AI thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border/40 bg-card">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI anything about your offers... (Ctrl+K)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-muted/40 border border-border/50 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            Press <kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[9px] font-mono">Ctrl + K</kbd> to toggle drawer
          </p>
        </div>
      </div>
    </div>
  )
}
