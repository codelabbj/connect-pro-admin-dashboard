"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function AutoRechargeAggregators() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [aggregators, setAggregators] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  const { t } = useLanguage()
  const itemsPerPage = 20
  const apiFetch = useApi()
  const { toast } = useToast()

  useEffect(() => {
    const fetchAggregators = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: itemsPerPage.toString(),
        })

        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm)
        }

        if (statusFilter !== "all") {
          params.append("is_active", statusFilter === "active" ? "true" : "false")
        }

        if (sortField) {
          const prefix = sortDirection === "desc" ? "-" : ""
          params.append("ordering", `${prefix}${sortField}`)
        }

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auto-recharge/admin/aggregators/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        setAggregators(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setAggregators([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: "Failed to load aggregators",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAggregators()
  }, [searchTerm, currentPage, statusFilter, sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const startIndex = (currentPage - 1) * itemsPerPage

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search aggregators..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : error ? (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              setCurrentPage(1)
              setError("")
            }}
            variant="full"
            showDismiss={false}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UID</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Transactions</TableHead>
                <TableHead>Total Amount Processed</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
                    Created At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aggregators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No aggregators found
                  </TableCell>
                </TableRow>
              ) : (
                aggregators.map((aggregator) => (
                  <TableRow key={aggregator.uid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{aggregator.uid?.substring(0, 8)}...</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            navigator.clipboard.writeText(aggregator.uid)
                            toast({ title: "UID copied to clipboard" })
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{aggregator.name}</TableCell>
                    <TableCell>{aggregator.code}</TableCell>
                    <TableCell className="max-w-xs truncate">{aggregator.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={aggregator.is_active ? "default" : "secondary"}>
                        {aggregator.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{aggregator.total_transactions || 0}</TableCell>
                    <TableCell>{aggregator.total_amount_processed || "0.00"}</TableCell>
                    <TableCell>{aggregator.success_rate || "0.00"}%</TableCell>
                    <TableCell>
                      {aggregator.created_at ? new Date(aggregator.created_at).toLocaleString() : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm">
            Page {currentPage} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}

