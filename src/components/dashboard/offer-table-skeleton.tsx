"use client"

import { TableRow, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

export function OfferTableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} className="border-border/20">
          <TableCell className="py-3.5">
            <Skeleton
              className="h-4 rounded"
              style={{ width: `${110 + (i % 3) * 30}px`, animationDelay: `${i * 0.06}s` }}
            />
          </TableCell>
          <TableCell>
            <Skeleton
              className="h-5 w-12 rounded-full"
              style={{ animationDelay: `${i * 0.06 + 0.04}s` }}
            />
          </TableCell>
          <TableCell>
            <Skeleton
              className="h-4 rounded"
              style={{ width: `${140 + (i % 4) * 20}px`, animationDelay: `${i * 0.06 + 0.08}s` }}
            />
          </TableCell>
          <TableCell>
            <Skeleton
              className="h-5 w-14 rounded-full"
              style={{ animationDelay: `${i * 0.06 + 0.12}s` }}
            />
          </TableCell>
          <TableCell>
            <Skeleton
              className="h-4 w-10 rounded"
              style={{ animationDelay: `${i * 0.06 + 0.16}s` }}
            />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}
