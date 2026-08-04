import { createClient } from './supabase'
import { Offer } from './validations'

const supabase = createClient()

export async function getOffersFromSupabase(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Supabase fetch error:', error)
    throw new Error(error.message)
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    campaign: item.campaign,
    model: item.model,
    geo: item.geo,
    previewUrl: item.preview_url,
    poEvent: item.po_event,
    flow: item.flow,
    billing: item.billing,
    os: item.os,
    po: item.po,
    status: item.status,
  }))
}

export async function addOfferToSupabase(offer: Omit<Offer, 'id'>) {
  const { data, error } = await supabase
    .from('offers')
    .insert([
      {
        campaign: offer.campaign,
        model: offer.model,
        geo: offer.geo,
        preview_url: offer.previewUrl || '',
        po_event: offer.poEvent || '',
        flow: offer.flow || '',
        billing: offer.billing || '',
        os: offer.os || '',
        po: offer.po || '$0.00',
        status: offer.status || 'Active',
      },
    ])
    .select()

  if (error) {
    console.error('Supabase insert error:', error)
    throw new Error(error.message)
  }
  return data?.[0]
}

export async function updateOfferInSupabase(id: string, updates: Partial<Offer>) {
  const payload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.campaign !== undefined) payload.campaign = updates.campaign
  if (updates.model !== undefined) payload.model = updates.model
  if (updates.geo !== undefined) payload.geo = updates.geo
  if (updates.previewUrl !== undefined) payload.preview_url = updates.previewUrl
  if (updates.poEvent !== undefined) payload.po_event = updates.poEvent
  if (updates.flow !== undefined) payload.flow = updates.flow
  if (updates.billing !== undefined) payload.billing = updates.billing
  if (updates.os !== undefined) payload.os = updates.os
  if (updates.po !== undefined) payload.po = updates.po
  if (updates.status !== undefined) payload.status = updates.status

  const { data, error } = await supabase
    .from('offers')
    .update(payload)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Supabase update error:', error)
    throw new Error(error.message)
  }
  return data?.[0]
}

export async function deleteOfferFromSupabase(id: string) {
  const { error } = await supabase
    .from('offers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Supabase delete error:', error)
    throw new Error(error.message)
  }
  return true
}
