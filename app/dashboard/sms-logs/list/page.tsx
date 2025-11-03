"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, ChevronLeft, ChevronRight } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ArrowUpDown } from "lucide-react"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

interface PaginationInfo {
  count: number
  next: string | null
  previous: string | null
  results: any[]
}

export default function SmsLogsListPage() {
  const [paginationData, setPaginationData] = useState<PaginationInfo>({
    count: 0,
    next: null,
    previous: null,
    results: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortField, setSortField] = useState<"received_at" | "sender" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  // Calculate pagination info
  const totalPages = Math.ceil(paginationData.count / pageSize)
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, paginationData.count)

  useEffect(() => {
    const fetchSmsLogs = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          page_size: pageSize.toString(),
        })
        
        if (searchTerm.trim() !== "") {
          params.append("search", searchTerm)
        }
        if (typeFilter !== "all") {
          params.append("sms_type", typeFilter)
        }
        if (startDate) {
          params.append("received_at__gte", startDate)
        }
        if (endDate) {
          // Add one day to end date to include the entire end date
          const endDateObj = new Date(endDate)
          endDateObj.setDate(endDateObj.getDate() + 1)
          params.append("received_at__lt", endDateObj.toISOString().split('T')[0])
        }
        if (sortField) {
          params.append("ordering", `${sortDirection}${sortField}`)
        }
        
        const query = params.toString().replace(/ordering=%2B/g, "ordering=+")
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/sms-logs/?${query}`
        
        const data = await apiFetch(endpoint)
        
        // Handle both paginated and non-paginated responses
        if (data.results) {
          setPaginationData(data)
        } else {
          // Fallback for non-paginated response
          setPaginationData({
            count: Array.isArray(data) ? data.length : 0,
            next: null,
            previous: null,
            results: Array.isArray(data) ? data : []
          })
        }
        
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("smsLogs.failedToLoad")
        setError(errorMessage)
        setPaginationData({
          count: 0,
          next: null,
          previous: null,
          results: []
        })
        toast({
          title: t("smsLogs.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('SMS logs fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSmsLogs()
  }, [searchTerm, typeFilter, startDate, endDate, sortField, sortDirection, currentPage, pageSize])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, typeFilter, startDate, endDate, sortField, sortDirection])

  const handleSort = (field: "received_at" | "sender") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "+" ? "-" : "+")
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  const handleCopy = (content: string, uid: string) => {
    navigator.clipboard.writeText(content)
    setCopied(uid)
    setTimeout(() => setCopied(null), 1500)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("smsLogs.list")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("smsLogs.type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="balance">Balance</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("smsLogs.startDate") || "Start Date"}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full lg:w-48"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("smsLogs.endDate") || "End Date"}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full lg:w-48"
              />
            </div>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStartDate("")
                setEndDate("")
                setCurrentPage(1)
              }}
              className="h-10"
            >
              {t("smsLogs.clearDates") || "Clear Dates"}
            </Button>
          </div>
        </div>

        {/* Results Info */}
        {/* {!loading && !error && paginationData.count > 0 && (
          <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
            <div>
              Total: {paginationData.count} items
            </div>
          </div>
        )} */}

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : error ? (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              setError("")
              // This will trigger the useEffect to refetch
            }}
            variant="inline"
            className="mb-6"
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button type="button" variant="ghost" onClick={() => handleSort("sender")} className="h-auto p-0 font-semibold">
                      {t("smsLogs.sender")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>{t("smsLogs.content")}</TableHead>
                  <TableHead>
                    <Button type="button" variant="ghost" onClick={() => handleSort("received_at")} className="h-auto p-0 font-semibold">
                      {t("smsLogs.receivedAt")}
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>{t("smsLogs.type")}</TableHead>
                  <TableHead>{t("smsLogs.copy")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginationData.results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucun journal SMS trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  paginationData.results.map((log: any) => (
                    <TableRow key={log.uid || log.id || log.content}>
                      <TableCell>{log.sender}</TableCell>
                      <TableCell className="whitespace-pre-wrap break-words">{log.content}</TableCell>
                      <TableCell>{log.received_at ? log.received_at.split("T")[0] : '-'}</TableCell>
                      <TableCell>{log.sms_type}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(log.content, log.uid || log.id || log.content)}>
                          <Copy className="h-4 w-4" />
                          {copied === (log.uid || log.id || log.content) && <span className="ml-2 text-xs">{t("smsLogs.copied")}</span>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  {`${t("smsLogs.showingResults") || "Showing results"}: ${startItem}-${endItem} / ${paginationData.count}`}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    {t("common.previous") || "Previous"}
                  </Button>
                  <div className="text-sm">
                    {`${t("smsLogs.pageOf") || "Page"}: ${currentPage}/${totalPages}`}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    {t("common.next") || "Next"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}