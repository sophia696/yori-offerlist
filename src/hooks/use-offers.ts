import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ApiResponse, Offer } from "@/lib/validations"

interface UseOffersParams {
  status?: string
  geo?: string
}

export function useOffers(params?: UseOffersParams) {
  const queryClient = useQueryClient()

  const offersQuery = useQuery<ApiResponse, Error>({
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
    refetchInterval: 10 * 1000, // Refresh every 10s
    staleTime: 5 * 1000,
  })

  // Add offer mutation
  const addOfferMutation = useMutation({
    mutationFn: async (newOffer: Omit<Offer, "id">) => {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOffer),
      })
      if (!res.ok) throw new Error("Failed to add offer")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] })
    },
  })

  // Update offer mutation
  const updateOfferMutation = useMutation({
    mutationFn: async (updates: Partial<Offer> & { id: string }) => {
      const res = await fetch("/api/offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to update offer")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] })
    },
  })

  // Delete offer mutation
  const deleteOfferMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/offers?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete offer")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] })
    },
  })

  return {
    ...offersQuery,
    addOffer: addOfferMutation.mutateAsync,
    isAdding: addOfferMutation.isPending,
    updateOffer: updateOfferMutation.mutateAsync,
    isUpdating: updateOfferMutation.isPending,
    deleteOffer: deleteOfferMutation.mutateAsync,
    isDeleting: deleteOfferMutation.isPending,
  }
}

