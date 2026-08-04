import { z } from "zod"

// This schema defines the structure of an offer,
// matching the columns we expect from the Google Sheet.
export const offerSchema = z.object({
  id: z.string().optional(),
  campaign: z.string(),
  model: z.string(),
  geo: z.string(),
  previewUrl: z.string().optional(),
  poEvent: z.string().optional(),
  flow: z.string().optional(),
  billing: z.string().optional(),
  os: z.string().optional(),
  po: z.string().optional(),
  status: z.string().optional().default("Active"),
})

export type Offer = z.infer<typeof offerSchema>

// Response schema for our API
export const apiResponseSchema = z.object({
  data: z.array(offerSchema),
  updatedAt: z.string().datetime(),
  isMockData: z.boolean().default(false),
})

export type ApiResponse = z.infer<typeof apiResponseSchema>
