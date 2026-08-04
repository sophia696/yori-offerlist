"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Offer } from "@/lib/validations"
import { Plus, Edit2, Trash2, Save, Loader2 } from "lucide-react"

interface OfferFormModalProps {
  mode: "create" | "edit"
  initialData?: Offer
  onSubmit: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function OfferFormModal({ mode, initialData, onSubmit, onDelete }: OfferFormModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [formData, setFormData] = useState({
    campaign: initialData?.campaign || "",
    model: initialData?.model || "CPA",
    geo: initialData?.geo || "",
    status: initialData?.status || "Active",
    po: initialData?.po || "$0.00",
    billing: initialData?.billing || "",
    os: initialData?.os || "",
    flow: initialData?.flow || "",
    poEvent: initialData?.poEvent || "",
    previewUrl: initialData?.previewUrl || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.campaign.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        ...(initialData?.id ? { id: initialData.id } : {}),
        ...formData,
      })
      setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return
    if (!confirm(`Are you sure you want to delete "${initialData.campaign}"?`)) return
    setDeleting(true)
    try {
      await onDelete(initialData.id)
      setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          mode === "create" ? (
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm">
              <Plus className="h-3.5 w-3.5" />
              Add Offer
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 gap-1.5 border-border/50 bg-muted/20 hover:bg-muted/40 text-foreground">
              <Edit2 className="h-3 w-3 text-primary" />
              Edit
            </Button>
          )
        }
      />

      <SheetContent className="sm:max-w-lg bg-card border-border/40 overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="text-lg font-bold text-foreground">
            {mode === "create" ? "Create New Offer in Supabase" : `Edit Offer: ${initialData?.campaign}`}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Campaign Name *
            </label>
            <Input
              required
              value={formData.campaign}
              onChange={(e) => setFormData({ ...formData, campaign: e.target.value })}
              placeholder="e.g. 20bet App"
              className="bg-muted/20 border-border/50 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Model
              </label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="CPA, CPL"
                className="bg-muted/20 border-border/50 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val || "Active" })}
              >

                <SelectTrigger className="bg-muted/20 border-border/50 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Payout (PO)
              </label>
              <Input
                value={formData.po}
                onChange={(e) => setFormData({ ...formData, po: e.target.value })}
                placeholder="$12.50"
                className="bg-muted/20 border-border/50 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Billing
              </label>
              <Input
                value={formData.billing}
                onChange={(e) => setFormData({ ...formData, billing: e.target.value })}
                placeholder="CRM, Net 15"
                className="bg-muted/20 border-border/50 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Target GEOs
            </label>
            <Input
              value={formData.geo}
              onChange={(e) => setFormData({ ...formData, geo: e.target.value })}
              placeholder="DE, US, CA, BR, IN"
              className="bg-muted/20 border-border/50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              OS Compatibility
            </label>
            <Input
              value={formData.os}
              onChange={(e) => setFormData({ ...formData, os: e.target.value })}
              placeholder="AOS, iOS, Web"
              className="bg-muted/20 border-border/50 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Preview URL
            </label>
            <Input
              value={formData.previewUrl}
              onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
              placeholder="https://play.google.com/..."
              className="bg-muted/20 border-border/50 text-sm"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/30">
            {mode === "edit" && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting || loading}
                className="h-9 gap-1.5"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Offer
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {mode === "create" ? "Save to Supabase" : "Update Offer"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
