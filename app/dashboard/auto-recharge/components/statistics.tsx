"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function AutoRechargeStatistics() {
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams()
        if (startDate) {
          params.append("date_from", startDate)
        }
        if (endDate) {
          params.append("date_to", endDate)
        }
        
        const queryString = params.size > 0 ? `?${params.toString()}` : ""
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auto-recharge/admin/statistics/${queryString}`
        const data = await apiFetch(endpoint)
        setStatistics(data)
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: t("autoRecharge.statistics.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [startDate, endDate])

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">{t("autoRecharge.statistics.loading")}</div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => setError("")}
        variant="full"
        showDismiss={false}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col lg:flex-row gap-4 flex-1">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("autoRecharge.transactions.startDate")}
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full lg:w-48"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("autoRecharge.transactions.endDate")}
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
            }}
            className="h-10"
          >
            {t("autoRecharge.transactions.clearDates")}
          </Button>
        </div>
      </div>

      {statistics && (
        <>
          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("autoRecharge.statistics.totalTransactions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_transactions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("autoRecharge.statistics.totalAmount")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_amount || "0.00"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("autoRecharge.statistics.totalFees")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total_fees || "0.00"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("autoRecharge.statistics.successRate")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.success_rate || "0.00"}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("autoRecharge.statistics.completed")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xl font-bold">{statistics.completed_transactions || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    {t("autoRecharge.statistics.totalAmount")}: {statistics.completed_amount || "0.00"}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("autoRecharge.statistics.pending")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{statistics.pending_transactions || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{t("autoRecharge.statistics.failed")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{statistics.failed_transactions || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics by Aggregator */}
          {statistics.by_aggregator && statistics.by_aggregator.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("autoRecharge.statistics.byAggregator")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("autoRecharge.statistics.aggregator")}</TableHead>
                      <TableHead>{t("autoRecharge.statistics.totalTransactions")}</TableHead>
                      <TableHead>{t("autoRecharge.statistics.totalAmount")}</TableHead>
                      <TableHead>{t("autoRecharge.statistics.totalFees")}</TableHead>
                      <TableHead>{t("autoRecharge.statistics.completed")}</TableHead>
                      <TableHead>{t("autoRecharge.statistics.pending")}</TableHead>
                      <TableHead>{t("autoRecharge.statistics.failed")}</TableHead>
                      <TableHead>{t("autoRecharge.statistics.successRate")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statistics.by_aggregator.map((agg: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{agg.aggregator_name || "-"}</TableCell>
                        <TableCell>{agg.total_transactions || 0}</TableCell>
                        <TableCell>{agg.total_amount || "0.00"}</TableCell>
                        <TableCell>{agg.total_fees || "0.00"}</TableCell>
                        <TableCell>{agg.completed_transactions || 0}</TableCell>
                        <TableCell>{agg.pending_transactions || 0}</TableCell>
                        <TableCell>{agg.failed_transactions || 0}</TableCell>
                        <TableCell>{agg.success_rate || "0.00"}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
