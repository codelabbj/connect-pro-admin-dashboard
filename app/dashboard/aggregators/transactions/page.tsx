"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Loader, MoreHorizontal, Eye, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AggregatorTransaction } from "@/lib/aggregator-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export default function AggregatorTransactionsPage() {
    const [transactions, setTransactions] = useState<AggregatorTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState({
        status: "",
        type: "",
        user: "",
        date_from: "",
        date_to: ""
    })
    const [selectedTx, setSelectedTx] = useState<AggregatorTransaction | null>(null)
    const [showDetail, setShowDetail] = useState(false)
    
    const apiFetch = useApi()
    const { t } = useLanguage()
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

    const fetchTransactions = async () => {
        setLoading(true)
        setError("")
        const queryParams = new URLSearchParams()
        if (filters.status) queryParams.append("status", filters.status)
        if (filters.type) queryParams.append("type", filters.type)
        if (filters.user) queryParams.append("user", filters.user)
        if (filters.date_from) queryParams.append("date_from", filters.date_from)
        if (filters.date_to) queryParams.append("date_to", filters.date_to)
        
        try {
            const data = await apiFetch(`${baseUrl}api/aggregator/admin/transactions/?${queryParams.toString()}`)
            setTransactions(data.results || [])
        } catch (err: any) {
            setError(extractErrorMessages(err) || t("aggregators.noTransactionsFound"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTransactions()
    }, [apiFetch, filters])

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success': return 'success'
            case 'failed': return 'destructive'
            case 'pending': return 'warning'
            case 'processing': return 'info'
            case 'cancelled': return 'secondary'
            default: return 'outline'
        }
    }

    return (
        <div className="space-y-6 px-4 py-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">{t("aggregators.transactionsTitle")}</h1>
                <p className="text-muted-foreground text-slate-500">{t("aggregators.transactionsSub")}</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">{t("common.status")}</label>
                            <Select onValueChange={(v) => setFilters({...filters, status: v === "all" ? "" : v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("common.allStatuses") || "All Statuses"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.allStatuses") || "All Statuses"}</SelectItem>
                                    <SelectItem value="pending">{t("common.pending")}</SelectItem>
                                    <SelectItem value="processing">{t("common.processing")}</SelectItem>
                                    <SelectItem value="success">{t("common.success")}</SelectItem>
                                    <SelectItem value="failed">{t("common.failed")}</SelectItem>
                                    <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">{t("common.type")}</label>
                            <Select onValueChange={(v) => setFilters({...filters, type: v === "all" ? "" : v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("common.allTypes") || "All Types"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.allTypes") || "All Types"}</SelectItem>
                                    <SelectItem value="payin">{t("common.payin") || "Payin"}</SelectItem>
                                    <SelectItem value="payout">{t("common.payout") || "Payout"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">{t("common.fromDate") || "From Date"}</label>
                            <Input type="date" onChange={(e) => setFilters({...filters, date_from: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">{t("common.toDate") || "To Date"}</label>
                            <Input type="date" onChange={(e) => setFilters({...filters, date_to: e.target.value})} />
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" className="w-full flex gap-2" onClick={fetchTransactions}>
                                <Filter size={18} /> {t("common.applyFilters")}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader className="animate-spin mr-2 h-8 w-8 text-blue-600" />
                            <span className="text-lg font-semibold">{t("common.loading")}</span>
                        </div>
                    ) : error ? (
                        <ErrorDisplay error={error} onRetry={fetchTransactions} />
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>{t("common.reference")}</TableHead>
                                        <TableHead>{t("common.user") + " / " + t("common.network")}</TableHead>
                                        <TableHead>{t("common.type")}</TableHead>
                                        <TableHead>{t("common.amount")}</TableHead>
                                        <TableHead>{t("common.status")}</TableHead>
                                        <TableHead>{t("common.createdAt")}</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                                {t("aggregators.noTransactionsMatch")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((tx) => (
                                            <TableRow key={tx.uid}>
                                                <TableCell className="font-mono text-xs">
                                                    {tx.reference}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{tx.user_display_name}</div>
                                                    <div className="text-xs text-slate-400">{tx.network_name}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        {tx.transaction_type === 'payout' ? (
                                                            <ArrowDownLeft size={14} className="text-orange-500" />
                                                        ) : (
                                                            <ArrowUpRight size={14} className="text-green-500" />
                                                        )}
                                                        <span className="capitalize text-sm">{tx.transaction_type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{parseFloat(tx.amount).toLocaleString()}</div>
                                                    <div className="text-[10px] text-slate-400">{t("common.netAmount")}: {parseFloat(tx.net_amount).toLocaleString()}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(tx.status)}>
                                                        {tx.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs text-slate-600">
                                                        {new Date(tx.created_at).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => { setSelectedTx(tx); setShowDetail(true); }}>
                                                        <Eye size={16} />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Modal */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t("common.transactionDetails")}</DialogTitle>
                        <DialogDescription>{t("aggregators.fullRecordFor", { reference: selectedTx?.reference || "" })}</DialogDescription>
                    </DialogHeader>
                    {selectedTx && (
                        <div className="grid grid-cols-2 gap-6 mt-4">
                            <div className="space-y-4">
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.participant")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <div className="font-medium">{selectedTx.user_display_name}</div>
                                        <div className="text-xs text-slate-500">{selectedTx.user_email}</div>
                                        <div className="text-xs text-slate-400 mt-1">{t("common.recipient")}: {selectedTx.recipient_phone}</div>
                                    </div>
                                </section>
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.networkLayer")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg">
                                        <div className="font-medium">{selectedTx.network_name}</div>
                                        <div className="text-xs text-slate-500">{t("aggregators.processor")}: {selectedTx.processor_type}</div>
                                    </div>
                                </section>
                            </div>
                            <div className="space-y-4">
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.financials")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>{t("common.baseAmount")}:</span>
                                            <span className="font-semibold">{selectedTx.amount}</span>
                                        </div>
                                        <div className="flex justify-between text-orange-600">
                                            <span>{t("common.networkFee")}:</span>
                                            <span>-{selectedTx.network_fee_amount} ({selectedTx.network_fee_percent}%)</span>
                                        </div>
                                        <div className="flex justify-between text-blue-600">
                                            <span>{t("common.userFee")}:</span>
                                            <span>{selectedTx.user_fee_amount} ({selectedTx.user_fee_percent}%)</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                                            <span>{t("common.netAmount")}:</span>
                                            <span>{selectedTx.net_amount}</span>
                                        </div>
                                        <div className="flex justify-between text-pink-600 font-medium italic">
                                            <span>{t("aggregators.platformProfit")}:</span>
                                            <span>{selectedTx.platform_profit}</span>
                                        </div>
                                    </div>
                                </section>
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.statusAndMeta")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs">{t("common.currentStatus")}:</span>
                                            <Badge variant={getStatusVariant(selectedTx.status)}>{selectedTx.status}</Badge>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-2">
                                            {t("common.createdAt")}: {new Date(selectedTx.created_at).toLocaleString()}
                                        </div>
                                        {selectedTx.completed_at && (
                                            <div className="text-[10px] text-slate-400">
                                                {t("common.completed")}: {new Date(selectedTx.completed_at).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                            {selectedTx.error_message && (
                                <div className="col-span-2 bg-red-50 border border-red-100 p-3 rounded-lg">
                                    <h4 className="text-xs font-semibold text-red-600 uppercase mb-1">{t("common.errorMessage")}</h4>
                                    <p className="text-sm text-red-700">{selectedTx.error_message}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
