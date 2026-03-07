"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, Loader, Eye, ArrowUpRight, ArrowDownLeft, ExternalLink, CheckCircle2, XCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AggregatorTransaction } from "@/lib/aggregator-api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

export default function AggregatorTransactionsPage() {
    const [transactions, setTransactions] = useState<AggregatorTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
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
    const router = useRouter()
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

    // Determine which ref is active (only one can be non-null)
    const getActiveRef = (tx: AggregatorTransaction) => {
        if (tx.payment_transaction_ref && tx.payment_transaction_ref.uid) {
            return { type: "payment", ref: tx.payment_transaction_ref }
        }
        if (tx.momo_transaction_ref && (tx.momo_transaction_ref as any).uid) {
            return { type: "momo", ref: tx.momo_transaction_ref as any }
        }
        if (tx.wave_transaction_ref && (tx.wave_transaction_ref as any).uid) {
            return { type: "wave", ref: tx.wave_transaction_ref as any }
        }
        return null
    }

    const handleMoreInfo = (tx: AggregatorTransaction) => {
        const activeRef = getActiveRef(tx)
        if (!activeRef) return
        setShowDetail(false)
        if (activeRef.type === "payment") {
            // Normal transaction - use UID for direct detail view
            router.push(`/dashboard/transactions?uid=${activeRef.ref.uid}`)
        } else if (activeRef.type === "momo") {
            router.push(`/dashboard/momo-pay-transactions?uid=${activeRef.ref.uid}`)
        } else if (activeRef.type === "wave") {
            router.push(`/dashboard/wave-business-transaction?uid=${activeRef.ref.uid}`)
        }
    }

    const renderRefTypeBadge = (type: string) => {
        const labels: Record<string, string> = {
            payment: "Transaction",
            momo: "MoMo Pay",
            wave: "Wave Business",
        }
        const colors: Record<string, string> = {
            payment: "bg-blue-100 text-blue-800 border-blue-200",
            momo: "bg-yellow-100 text-yellow-800 border-yellow-200",
            wave: "bg-teal-100 text-teal-800 border-teal-200",
        }
        return (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[type] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                {labels[type] || type}
            </span>
        )
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
                            <Select onValueChange={(v) => setFilters({ ...filters, status: v === "all" ? "" : v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("common.allStatuses")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
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
                            <Select onValueChange={(v) => setFilters({ ...filters, type: v === "all" ? "" : v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t("common.allTypes")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t("common.allTypes")}</SelectItem>
                                    <SelectItem value="payin">{t("common.payin") || "Payin"}</SelectItem>
                                    <SelectItem value="payout">{t("common.payout") || "Payout"}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">{t("common.fromDate")}</label>
                            <Input type="date" onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">{t("common.toDate")}</label>
                            <Input type="date" onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
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
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="text-xs">UID</TableHead>
                                        <TableHead>{t("common.reference")}</TableHead>
                                        <TableHead>{t("common.user") + " / " + t("common.network")}</TableHead>
                                        <TableHead>Processor</TableHead>
                                        <TableHead>{t("common.type")}</TableHead>
                                        <TableHead>{t("common.amount")}</TableHead>
                                        <TableHead>{t("common.status")}</TableHead>
                                        <TableHead>Webhook</TableHead>
                                        <TableHead>W. Code</TableHead>
                                        <TableHead>{t("common.createdAt")}</TableHead>
                                        <TableHead className="w-[80px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-12 text-slate-400">
                                                {t("aggregators.noTransactionsMatch")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((tx) => (
                                            <TableRow key={tx.uid}>
                                                <TableCell className="font-mono text-[10px] text-slate-400 max-w-[90px] truncate">
                                                    <span title={tx.uid}>{tx.uid.slice(0, 8)}…</span>
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {tx.reference}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-sm">{tx.user_display_name}</div>
                                                    <div className="text-xs text-slate-400">{tx.user_email}</div>
                                                    <div className="text-[10px] text-slate-300">{tx.network_name}</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600">
                                                    {tx.processor_type || "—"}
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
                                                    {tx.webhook_sent ? (
                                                        <CheckCircle2 size={16} className="text-green-500" />
                                                    ) : (
                                                        <XCircle size={16} className="text-slate-300" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600">
                                                    {tx.webhook_response_code ?? "—"}
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t("common.transactionDetails")}</DialogTitle>
                        <DialogDescription>{t("aggregators.fullRecordFor", { reference: selectedTx?.reference || "" })}</DialogDescription>
                    </DialogHeader>
                    {selectedTx && (
                        <div className="space-y-5 mt-2">

                            {/* Identifiers */}
                            <section>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Identifiants</h4>
                                <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">UID :</span>
                                        <span className="font-mono text-xs text-slate-700">{selectedTx.uid}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">{t("common.reference")} :</span>
                                        <span className="font-mono text-xs text-slate-700">{selectedTx.reference}</span>
                                    </div>
                                    {selectedTx.external_id && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">External ID :</span>
                                            <span className="font-mono text-xs text-slate-700">{selectedTx.external_id}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* Participant */}
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.participant")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                                        <div><span className="text-slate-500">Nom : </span><span className="font-medium">{selectedTx.user_display_name}</span></div>
                                        <div><span className="text-slate-500">Email : </span><span>{selectedTx.user_email}</span></div>
                                        {selectedTx.user_phone && (
                                            <div><span className="text-slate-500">Tél (user) : </span><span>{selectedTx.user_phone}</span></div>
                                        )}
                                        <div><span className="text-slate-500">{t("common.recipient")} : </span><span>{selectedTx.recipient_phone}</span></div>
                                    </div>
                                </section>

                                {/* Network & Processor */}
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.networkLayer")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                                        <div><span className="text-slate-500">Réseau : </span><span className="font-medium">{selectedTx.network_name}</span></div>
                                        <div><span className="text-slate-500">Processor : </span><span>{selectedTx.processor_type}</span></div>
                                    </div>
                                </section>

                                {/* Transaction Details */}
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Détails transaction</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Type :</span><span className="capitalize">{selectedTx.transaction_type}</span></div>
                                        {selectedTx.objet && <div className="flex justify-between"><span className="text-slate-500">Objet :</span><span>{selectedTx.objet}</span></div>}
                                        {selectedTx.commentaire && <div className="flex justify-between"><span className="text-slate-500">Commentaire :</span><span>{selectedTx.commentaire}</span></div>}
                                        {selectedTx.payment_url && <div className="flex justify-between"><span className="text-slate-500">Payment URL :</span><span className="text-xs break-all">{selectedTx.payment_url}</span></div>}
                                        {selectedTx.payment_ussd && <div className="flex justify-between"><span className="text-slate-500">USSD :</span><span>{selectedTx.payment_ussd}</span></div>}
                                        {selectedTx.payment_comment && <div className="flex justify-between"><span className="text-slate-500">Payment comment :</span><span>{selectedTx.payment_comment}</span></div>}
                                    </div>
                                </section>

                                {/* Financials */}
                                <section>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.financials")}</h4>
                                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>{t("common.baseAmount")} :</span>
                                            <span className="font-semibold">{selectedTx.amount}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-500 text-xs">
                                            <span>Montant brut :</span>
                                            <span>{selectedTx.underlying_amount}</span>
                                        </div>
                                        <div className="flex justify-between text-orange-600">
                                            <span>{t("common.networkFee")} :</span>
                                            <span>-{selectedTx.network_fee_amount} ({selectedTx.network_fee_percent}%)</span>
                                        </div>
                                        <div className="flex justify-between text-blue-600">
                                            <span>{t("common.userFee")} :</span>
                                            <span>{selectedTx.user_fee_amount} ({selectedTx.user_fee_percent}%)</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
                                            <span>{t("common.netAmount")} :</span>
                                            <span>{selectedTx.net_amount}</span>
                                        </div>
                                        <div className="flex justify-between text-pink-600 font-medium italic">
                                            <span>{t("aggregators.platformProfit")} :</span>
                                            <span>{selectedTx.platform_profit}</span>
                                        </div>
                                    </div>
                                </section>

                            </div>

                            {/* Webhook */}
                            <section>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Webhook</h4>
                                <div className="bg-slate-50 p-3 rounded-lg grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Envoyé</div>
                                        {selectedTx.webhook_sent ? (
                                            <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Oui</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-400">Non</Badge>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Envoyé le</div>
                                        <div className="text-xs">{selectedTx.webhook_sent_at ? new Date(selectedTx.webhook_sent_at).toLocaleString() : "—"}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs mb-1">Code réponse</div>
                                        <div className="font-mono font-semibold">{selectedTx.webhook_response_code ?? "—"}</div>
                                    </div>
                                </div>
                            </section>

                            {/* Status & Dates */}
                            <section>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("common.statusAndMeta")}</h4>
                                <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">{t("common.currentStatus")} :</span>
                                        <Badge variant={getStatusVariant(selectedTx.status)}>{selectedTx.status}</Badge>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>{t("common.createdAt")} :</span>
                                        <span>{new Date(selectedTx.created_at).toLocaleString()}</span>
                                    </div>
                                    {selectedTx.completed_at && (
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>{t("common.completed")} :</span>
                                            <span>{new Date(selectedTx.completed_at).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Error Message */}
                            {selectedTx.error_message && (
                                <section className="bg-red-50 border border-red-100 p-3 rounded-lg">
                                    <h4 className="text-xs font-semibold text-red-600 uppercase mb-1">{t("common.errorMessage")}</h4>
                                    <p className="text-sm text-red-700">{selectedTx.error_message}</p>
                                </section>
                            )}

                            {/* Linked Transaction Ref */}
                            {(() => {
                                const activeRef = getActiveRef(selectedTx)
                                if (!activeRef) return null
                                return (
                                    <section>
                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            Transaction liée {renderRefTypeBadge(activeRef.type)}
                                        </h4>
                                        <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">{t("common.uid")} :</span>
                                                <span className="font-mono text-xs">{activeRef.ref.uid}</span>
                                            </div>
                                            {activeRef.ref.reference && (
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">{t("transactions.reference")} :</span>
                                                    <span className="font-mono text-xs">{activeRef.ref.reference}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-500">{t("transactions.status")} :</span>
                                                <Badge variant={getStatusVariant(activeRef.ref.status || "")}>{activeRef.ref.status}</Badge>
                                            </div>
                                        </div>
                                    </section>
                                )
                            })()}

                            {/* Footer: More Info Button */}
                            {(() => {
                                const activeRef = getActiveRef(selectedTx)
                                if (!activeRef) return null
                                return (
                                    <div className="flex justify-end pt-2 border-t">
                                        <Button
                                            variant="default"
                                            className="flex items-center gap-2"
                                            onClick={() => handleMoreInfo(selectedTx)}
                                        >
                                            <ExternalLink size={16} />
                                            {t("aggregators.moreInfo")}
                                        </Button>
                                    </div>
                                )
                            })()}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
