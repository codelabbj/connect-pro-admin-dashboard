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
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, Plus, Pencil } from "lucide-react"
import Link from "next/link"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function AutoRechargeMappings() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [networkFilter, setNetworkFilter] = useState("all")
  const [aggregatorFilter, setAggregatorFilter] = useState("all")
  const [mappings, setMappings] = useState<any[]>([])
  const [networks, setNetworks] = useState<any[]>([])
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

  // Fetch networks and aggregators for filters
  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error("Failed to fetch networks:", err)
      }
    }

    const fetchAggregators = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auto-recharge/admin/aggregators/`)
        setAggregators(Array.isArray(data) ? data : data.results || [])
      } catch (err) {
        console.error("Failed to fetch aggregators:", err)
      }
    }

    fetchNetworks()
    fetchAggregators()
  }, [])

  useEffect(() => {
    const fetchMappings = async () => {
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

        if (networkFilter !== "all") {
          params.append("network", networkFilter)
        }

        if (aggregatorFilter !== "all") {
          params.append("aggregator", aggregatorFilter)
        }

        if (sortField) {
          const prefix = sortDirection === "desc" ? "-" : ""
          params.append("ordering", `${prefix}${sortField}`)
        }

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auto-recharge/admin/mappings/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        setMappings(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setMappings([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: "Failed to load mappings",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMappings()
  }, [searchTerm, currentPage, statusFilter, networkFilter, aggregatorFilter, sortField, sortDirection])

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
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Mappings</h2>
        <Link href="/dashboard/auto-recharge/mappings/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Mapping
          </Button>
        </Link>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search mappings..."
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
        <Select value={networkFilter} onValueChange={setNetworkFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Networks</SelectItem>
            {networks.map((network: any) => (
              <SelectItem key={network.uid} value={network.uid}>
                {network.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={aggregatorFilter} onValueChange={setAggregatorFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by aggregator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Aggregators</SelectItem>
            {aggregators.map((aggregator: any) => (
              <SelectItem key={aggregator.uid} value={aggregator.uid}>
                {aggregator.name}
              </SelectItem>
            ))}
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
                <TableHead>Network</TableHead>
                <TableHead>Aggregator</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("priority")} className="h-auto p-0 font-semibold">
                    Priority
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Fixed Fee</TableHead>
                <TableHead>Percentage Fee</TableHead>
                <TableHead>Min Amount</TableHead>
                <TableHead>Max Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground">
                    No mappings found
                  </TableCell>
                </TableRow>
              ) : (
                mappings.map((mapping) => (
                  <TableRow key={mapping.uid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{mapping.uid?.substring(0, 8)}...</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            navigator.clipboard.writeText(mapping.uid)
                            toast({ title: "UID copied to clipboard" })
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{mapping.network_name || "-"}</TableCell>
                    <TableCell>{mapping.aggregator_name || "-"}</TableCell>
                    <TableCell>{mapping.country_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={mapping.is_active ? "default" : "secondary"}>
                        {mapping.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{mapping.priority || 0}</TableCell>
                    <TableCell>{mapping.fixed_fee || "0.00"}</TableCell>
                    <TableCell>{mapping.percentage_fee || "0.00"}%</TableCell>
                    <TableCell>{mapping.min_amount || "0.00"}</TableCell>
                    <TableCell>{mapping.max_amount || "0.00"}</TableCell>
                    <TableCell>
                      <Link href={`/dashboard/auto-recharge/mappings/edit/${mapping.uid}`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
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

