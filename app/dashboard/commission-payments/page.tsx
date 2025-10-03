"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, MoreHorizontal, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"

export default function CommissionPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [partners, setPartners] = useState<any[]>([])
  const [unpaidCommissions, setUnpaidCommissions] = useState<any[]>([])
  const [globalStats, setGlobalStats] = useState<any | null>(null)
  const [selectedPartner, setSelectedPartner] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [paying, setPaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()
  const itemsPerPage = 20
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi()

  // Fetch unpaid commissions by partner
  useEffect(() => {
    const fetchUnpaidCommissions = async () => {
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/unpaid_by_partner/`
        const data = await apiFetch(endpoint)
        setUnpaidCommissions(data || [])
        
        toast({
          title: "Unpaid commissions loaded",
          description: "Unpaid commission data loaded successfully",
        })
      } catch (err: any) {
        console.error("Failed to load unpaid commissions:", err)
        toast({
          title: "Warning",
          description: "Could not load unpaid commission data",
          variant: "destructive",
        })
      }
    }
    fetchUnpaidCommissions()
  }, [])

  // Fetch global statistics
  useEffect(() => {
    const fetchGlobalStats = async () => {
      setStatsLoading(true)
      try {
        const params = new URLSearchParams()
        if (startDate) {
          params.append("date_from", startDate)
        }
        if (endDate) {
          params.append("date_to", endDate)
        }
        
        const queryString = params.size > 0 ? `?${params.toString()}` : ""
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/global_stats/${queryString}`
        const data = await apiFetch(endpoint)
        setGlobalStats(data)
      } catch (err: any) {
        console.error("Failed to load global stats:", err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchGlobalStats()
  }, [startDate, endDate])

  // Fetch partners for selection
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const params = new URLSearchParams({
          page_size: "100",
          is_active: "true"
        })
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/?${params.toString()}`
        const data = await apiFetch(endpoint)
        setPartners(data.partners || [])
      } catch (err) {
        console.warn("Could not fetch partners:", err)
      }
    }
    fetchPartners()
  }, [])

  // Pay commission to partner
  const handlePayCommission = async () => {
    if (!selectedPartner) {
      toast({
        title: "Validation Error",
        description: "Please select a partner",
        variant: "destructive",
      })
      return
    }

    setPaying(true)
    try {
      const payload = {
        partner_uid: selectedPartner,
        transaction_ids: null, // Pay all unpaid commissions
        admin_notes: paymentNotes || "Commission payment",
      }

      const response = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/pay_commissions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      toast({
        title: "Payment Successful",
        description: response.message || "Commission payment completed successfully",
      })
      
      // Refresh unpaid commissions
      const unpaidEndpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/unpaid_by_partner/`
      const unpaidData = await apiFetch(unpaidEndpoint)
      setUnpaidCommissions(unpaidData || [])
      
      // Reset form
      setSelectedPartner("")
      setPaymentNotes("")
      
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setPaying(false)
    }
  }

  // Get selected partner details
  const selectedPartnerData = partners.find(p => p.uid === selectedPartner)
  
  // Get unpaid amount for selected partner
  const selectedPartnerUnpaid = unpaidCommissions.find(u => u.partner_uid === selectedPartner)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t("commissionPayments.paymentTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Global Statistics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">{t("commissionPayments.commissionStatistics")}</h3>
          {statsLoading ? (
            <div className="text-center py-4">Loading statistics...</div>
          ) : globalStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{t("commissionPayments.totalTransactions")}</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{globalStats.total_transactions}</div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{t("commissionPayments.totalCommission")}</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{globalStats.total_commission}</div>
              </div>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Paid Commission</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{globalStats.paid_commission}</div>
              </div>
              
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Unpaid Commission</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{globalStats.unpaid_commission}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No statistics available</div>
          )}
        </div>

        {/* Date Filter for Statistics */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Filter Statistics by Date</h4>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-48"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("")
                  setEndDate("")
                }}
                className="h-10"
              >
                Clear Dates
              </Button>
            </div>
          </div>
        </div>

        {/* Commission Payment Form */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium mb-3 text-blue-900 dark:text-blue-100">Pay Commission to Partner</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label htmlFor="partner_select">Select Partner</Label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a partner to pay commission" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.uid} value={partner.uid}>
                      <div className="flex flex-col">
                        <span>{partner.display_name || `${partner.first_name || ""} ${partner.last_name || ""}`}</span>
                        <span className="text-sm text-muted-foreground">{partner.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_notes">Payment Notes</Label>
              <Input
                id="payment_notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="e.g., Monthly commission payment December 2024"
              />
            </div>
          </div>

          {/* Selected Partner Info */}
          {selectedPartnerData && (
            <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded border">
              <h5 className="font-medium mb-2">Selected Partner Information:</h5>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {selectedPartnerData.display_name || `${selectedPartnerData.first_name || ""} ${selectedPartnerData.last_name || ""}`}</div>
                <div><strong>Email:</strong> {selectedPartnerData.email}</div>
                <div><strong>UID:</strong> {selectedPartnerData.uid}</div>
                {selectedPartnerUnpaid && (
                  <div><strong>Unpaid Amount:</strong> <span className="text-green-600 font-medium">{selectedPartnerUnpaid.total_unpaid_amount}</span></div>
                )}
              </div>
            </div>
          )}

          <Button 
            onClick={handlePayCommission}
            disabled={!selectedPartner || paying}
            className="flex items-center gap-2"
          >
            {paying ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                Pay Commission
              </>
            )}
          </Button>
        </div>

        {/* Unpaid Commissions Table */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Unpaid Commissions by Partner</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Partner UID</TableHead>
                  <TableHead>Unsuccessful Transactions</TableHead>
                  <TableHead>Successful Transactions</TableHead>
                  <TableHead>Unpaid Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidCommissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No unpaid commissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  unpaidCommissions.map((item) => (
                    <TableRow key={item.partner_uid}>
                      <TableCell className="font-medium">{item.partner_name}</TableCell>
                      <TableCell>
                        <code className="px-1 py-0.5 bg-muted rounded text-xs">
                          {item.partner_uid?.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>{item.unsuccessful_transactions_count}</TableCell>
                      <TableCell>{item.successful_transactions_count}</TableCell>
                      <TableCell>
                        <Badge variant={item.total_unpaid_amount === 0 ? "secondary" : "destructive"}>
                          {item.total_unpaid_amount}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {error && (
          <ErrorDisplay
            error={error}
            variant="inline"
            showRetry={false}
            className="mb-4"
          />
        )}
      </CardContent>
    </Card>
  )
}
