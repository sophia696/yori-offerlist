import { useQuery } from "@tanstack/react-query"
import { ApiResponse } from "@/lib/validations"

interface UseOffersParams {
  status?: string
  geo?: string
}

export function useOffers(params?: UseOffersParams) {
  return useQuery<ApiResponse, Error>({
    queryKey: ["offers", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      if (params?.status) searchParams.set("status", params.status)
      if (params?.geo) searchParams.set("geo", params.geo)

      const response = await fetch(`/api/offers?${searchParams.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch offers")
      }
      return response.json()
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    staleTime: 60 * 1000,           // Consider data fresh for 1 minute
  })
}
