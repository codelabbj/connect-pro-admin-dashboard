"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { DollarSign, TrendingUp, TrendingDown, Users, AlertCircle, CheckCircle, RefreshCw, Wallet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"

// Matches the unpaid_by_partner API response shape
interface UnpaidPartner {
  partner_id: string
  partner_name: string
  partner_email: string
  partner_phone: string | null
  total_unpaid_commission: number
  total_unpaid_transaction_count: number
  payable_commission: number
  payable_transaction_count: number
  current_month_commission: number
  current_month_transaction_count: number
}

// Matches the /api/auth/admin/users/partners/ response shape
interface PartnerUser {
  uid: string
  email: string | null
  phone: string | null
  first_name: string
  last_name: string
  display_name: string
  is_active: boolean
  account_balance: number
  account_currency: string
  can_process_momo: boolean
  can_process_mobcash: boolean
  is_aggregator: boolean
}

export default function CommissionPaymentsPage() {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [partnerUsers, setPartnerUsers] = useState<PartnerUser[]>([])
  const [unpaidCommissions, setUnpaidCommissions] = useState<UnpaidPartner[]>([])
  const [totalPartners, setTotalPartners] = useState(0)
  const [selectedPartner, setSelectedPartner] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")
  const [paying, setPaying] = useState(false)
  const [loadingCommissions, setLoadingCommissions] = useState(false)
  const [globalStats, setGlobalStats] = useState<any | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState("")
  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi()

  const refreshUnpaidCommissions = async () => {
    setLoadingCommissions(true)
    setError("")
    try {
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/unpaid_by_partner/`
      const data = await apiFetch(endpoint)
      setUnpaidCommissions(data.partners || [])
      setTotalPartners(data.total_partners || 0)
    } catch (err: any) {
      console.error("Failed to load unpaid commissions:", err)
      setUnpaidCommissions([])
      setError(extractErrorMessages(err))
      toast({
        title: t("common.warning"),
        description: t("commissionPayments.couldNotLoadUnpaidCommissions") || "Could not load unpaid commissions",
        variant: "destructive",
      })
    } finally {
      setLoadingCommissions(false)
    }
  }

  // Fetch unpaid commissions by partner
  useEffect(() => {
    refreshUnpaidCommissions()
  }, [])

  // Fetch global statistics
  useEffect(() => {
    const fetchGlobalStats = async () => {
      setStatsLoading(true)
      try {
        const params = new URLSearchParams()
        if (startDate) params.append("date_from", startDate)
        if (endDate) params.append("date_to", endDate)
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

  // Fetch partners list for the payment form select
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/?is_active=true&page_size=100`
        const data = await apiFetch(endpoint)
        setPartnerUsers(data.partners || [])
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
        title: t("commissionPayments.validationError") || "Validation Error",
        description: t("commissionPayments.pleaseSelectPartner") || "Please select a partner",
        variant: "destructive",
      })
      return
    }

    setPaying(true)
    try {
      const payload = {
        partner_uid: selectedPartner,
        transaction_ids: null,
        admin_notes: paymentNotes || "Commission payment",
      }

      const response = await apiFetch(
        `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/pay_commissions/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      toast({
        title: t("commissionPayments.paymentSuccessful") || "Payment Successful",
        description: response.message || t("commissionPayments.paymentCompletedSuccessfully") || "Commission payment completed successfully",
      })

      setSelectedPartner("")
      setPaymentNotes("")
      await refreshUnpaidCommissions()
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: t("commissionPayments.paymentFailed") || "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setPaying(false)
    }
  }

  // Cross-reference selected partner from partners list
  const selectedPartnerUser = partnerUsers.find((p) => p.uid === selectedPartner)

  // Cross-reference selected partner's unpaid commission info
  const selectedPartnerCommission = unpaidCommissions.find((u) => u.partner_id === selectedPartner)

  // For each unpaid commission row, enrich with partner account balance from the partners list
  const enrichedRows = unpaidCommissions.map((item) => {
    const user = partnerUsers.find((p) => p.uid === item.partner_id)
    return { ...item, account_balance: user?.account_balance ?? null, account_currency: user?.account_currency ?? "XOF" }
  })

  // Summary totals
  const totalPayable = unpaidCommissions.reduce((acc, p) => acc + p.payable_commission, 0)
  const totalUnpaid = unpaidCommissions.reduce((acc, p) => acc + p.total_unpaid_commission, 0)
  const totalCurrentMonth = unpaidCommissions.reduce((acc, p) => acc + p.current_month_commission, 0)

  const fmt = (n: number, currency = "XOF") =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          {t("commissionPayments.paymentTitle") || "Commission Payments"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t("commissionPayments.partnersWithUnpaid") || "Partners w/ Unpaid"}
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalPartners}</div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                {t("commissionPayments.totalUnpaid") || "Total Unpaid"}
              </span>
            </div>
            <div className="text-xl font-bold text-red-600">{fmt(totalUnpaid)}</div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                {t("commissionPayments.totalPayable") || "Total Payable"}
              </span>
            </div>
            <div className="text-xl font-bold text-green-600">{fmt(totalPayable)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("commissionPayments.excludesCurrentMonth") || "Excludes current month"}
            </p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                {t("commissionPayments.currentMonth") || "Current Month"}
              </span>
            </div>
            <div className="text-xl font-bold text-orange-600">{fmt(totalCurrentMonth)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("commissionPayments.notYetPayable") || "Not yet payable"}
            </p>
          </div>
        </div>

        {/* Global Statistics (date-filtered) */}
        {(globalStats || statsLoading) && (
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium">{t("commissionPayments.commissionStatistics") || "Commission Statistics"}</h4>
            {statsLoading ? (
              <div className="text-center py-2 text-sm text-muted-foreground">
                {t("commissionPayments.loadingStatistics") || "Loading statistics..."}
              </div>
            ) : globalStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><span className="text-muted-foreground">{t("commissionPayments.totalTransactions") || "Total Tx"}:</span> <strong>{globalStats.total_transactions}</strong></div>
                <div><span className="text-muted-foreground">{t("commissionPayments.totalCommission") || "Total Commission"}:</span> <strong>{globalStats.total_commission}</strong></div>
                <div><span className="text-muted-foreground">{t("commissionPayments.paidCommissionLabel") || "Paid"}:</span> <strong>{globalStats.paid_commission}</strong></div>
                <div><span className="text-muted-foreground">{t("commissionPayments.unpaidCommissionLabel") || "Unpaid"}:</span> <strong>{globalStats.unpaid_commission}</strong></div>
              </div>
            )}
            {/* Date Filter */}
            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              <div className="flex flex-col gap-1">
                <Label htmlFor="start_date">{t("common.startDate") || "Start Date"}</Label>
                <Input id="start_date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-48" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="end_date">{t("common.endDate") || "End Date"}</Label>
                <Input id="end_date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-48" />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => { setStartDate(""); setEndDate("") }} className="h-10">
                  {t("common.clearDates") || "Clear Dates"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pay Commission Form */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">
            {t("commissionPayments.payCommissionToPartner") || "Pay Commission to Partner"}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partner_select">{t("commissionPayments.selectPartner") || "Select Partner"}</Label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                <SelectTrigger id="partner_select">
                  <SelectValue placeholder={t("commissionPayments.choosePartnerToPay") || "Choose a partner to pay"} />
                </SelectTrigger>
                <SelectContent>
                  {unpaidCommissions.length > 0
                    ? unpaidCommissions.map((item) => {
                        const user = partnerUsers.find((p) => p.uid === item.partner_id)
                        return (
                          <SelectItem key={item.partner_id} value={item.partner_id} disabled={item.payable_commission === 0}>
                            <div className="flex flex-col">
                              <span>{item.partner_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.partner_email} · Payable: {fmt(item.payable_commission)}
                                {item.payable_commission === 0 && " · (current month only)"}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })
                    : partnerUsers.map((p) => (
                        <SelectItem key={p.uid} value={p.uid}>
                          <div className="flex flex-col">
                            <span>{p.display_name}</span>
                            <span className="text-xs text-muted-foreground">{p.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_notes">{t("commissionPayments.paymentNotes") || "Payment Notes"}</Label>
              <Input
                id="payment_notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder={t("commissionPayments.paymentNotesPlaceholder") || "Optional notes..."}
              />
            </div>
          </div>

          {/* Selected partner details */}
          {selectedPartnerUser && (
            <div className="p-3 bg-white dark:bg-gray-800 rounded border space-y-2">
              <h5 className="font-medium text-sm">{t("commissionPayments.selectedPartnerInformation") || "Partner Information"}</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>{" "}
                  <strong>{selectedPartnerUser.display_name}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {selectedPartnerUser.email || selectedPartnerUser.phone || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Balance:</span>{" "}
                  <strong className="text-blue-600">{fmt(selectedPartnerUser.account_balance, selectedPartnerUser.account_currency)}</strong>
                </div>
                {selectedPartnerCommission && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Payable Now:</span>{" "}
                      <strong className="text-green-600">{fmt(selectedPartnerCommission.payable_commission)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Unpaid:</span>{" "}
                      <strong className="text-red-600">{fmt(selectedPartnerCommission.total_unpaid_commission)}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payable Tx:</span>{" "}
                      <strong>{selectedPartnerCommission.payable_transaction_count}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Month:</span>{" "}
                      <strong className="text-orange-600">{fmt(selectedPartnerCommission.current_month_commission)}</strong>
                    </div>
                  </>
                )}
              </div>
              {selectedPartnerCommission?.payable_commission === 0 && (
                <div className="flex items-center gap-2 text-orange-600 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {t("commissionPayments.noPayableAmount") || "All commissions are from the current month and are not yet payable."}
                </div>
              )}
            </div>
          )}

          <Button
            onClick={handlePayCommission}
            disabled={!selectedPartner || paying || selectedPartnerCommission?.payable_commission === 0}
            className="flex items-center gap-2"
          >
            {paying ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>{t("commissionPayments.processingPayment") || "Processing Payment..."}</span>
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4" />
                {t("commissionPayments.payCommission") || "Pay Commission"}
              </>
            )}
          </Button>
        </div>

        {/* Unpaid Commissions Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">
              {t("commissionPayments.unpaidCommissionsByPartner") || "Unpaid Commissions by Partner"}
            </h4>
            <Button variant="outline" size="sm" onClick={refreshUnpaidCommissions} disabled={loadingCommissions} className="flex items-center gap-2">
              <RefreshCw className={`h-4 w-4 ${loadingCommissions ? "animate-spin" : ""}`} />
              {t("common.refresh") || "Refresh"}
            </Button>
          </div>

          {error && (
            <ErrorDisplay error={error} variant="inline" showRetry={false} className="mb-3" />
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("commissionPayments.partner") || "Partner"}</TableHead>
                  <TableHead>{t("commissionPayments.email") || "Email"}</TableHead>
                  <TableHead className="text-right">{t("commissionPayments.totalUnpaid") || "Total Unpaid"}</TableHead>
                  <TableHead className="text-right">{t("commissionPayments.currentMonth") || "Current Month"}</TableHead>
                  <TableHead className="text-right">{t("commissionPayments.totalPayable") || "Payable Now"}</TableHead>
                  <TableHead className="text-right">{t("commissionPayments.payableTransactions") || "Payable Tx"}</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center gap-1 justify-end">
                      <Wallet className="h-3 w-3" />
                      {t("commissionPayments.accountBalance") || "Balance"}
                    </span>
                  </TableHead>
                  <TableHead>{t("common.status") || "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCommissions ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {t("common.loading") || "Loading..."}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : enrichedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {t("commissionPayments.noUnpaidCommissionsFound") || "No unpaid commissions found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  enrichedRows.map((item) => {
                    const isPayable = item.payable_commission > 0
                    const isCurrentMonthOnly = item.total_unpaid_commission > 0 && item.payable_commission === 0
                    return (
                      <TableRow key={item.partner_id}>
                        <TableCell className="font-medium">{item.partner_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.partner_email || item.partner_phone || "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {fmt(item.total_unpaid_commission)}
                          <div className="text-xs text-muted-foreground">
                            {item.total_unpaid_transaction_count} tx
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-orange-600">
                          {item.current_month_commission > 0 ? fmt(item.current_month_commission) : "—"}
                          {item.current_month_transaction_count > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {item.current_month_transaction_count} tx
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          <span className={isPayable ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                            {fmt(item.payable_commission)}
                          </span>
                          {item.payable_transaction_count > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {item.payable_transaction_count} tx
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {item.payable_transaction_count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {item.account_balance !== null
                            ? fmt(item.account_balance, item.account_currency)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {isPayable ? (
                            <Badge variant="destructive" className="text-xs">
                              {t("commissionPayments.payableNow") || "Payable"}
                            </Badge>
                          ) : isCurrentMonthOnly ? (
                            <Badge variant="secondary" className="text-xs">
                              {t("commissionPayments.currentMonthOnly") || "Current Month"}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {t("commissionPayments.upToDate") || "Up to date"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {unpaidCommissions.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {t("commissionPayments.payableNote") || "Payable amounts exclude current month commissions as per API policy."}
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
