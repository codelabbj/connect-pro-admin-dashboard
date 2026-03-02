"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard, DollarSign, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft, Zap, Loader } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AggregatorDashboard } from "@/lib/aggregator-api"

export default function AggregatorDashboardPage() {
    const [dashboard, setDashboard] = useState<AggregatorDashboard | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const apiFetch = useApi()
    const { t } = useLanguage()
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

    const fetchDashboard = async () => {
        setLoading(true)
        setError("")
        try {
            const data = await apiFetch(`${baseUrl}api/aggregator/admin/dashboard/`)
            setDashboard(data)
        } catch (err: any) {
            setError(extractErrorMessages(err) || t("aggregators.noAggregatorData"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboard()
    }, [apiFetch, baseUrl])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="animate-spin mr-2 h-8 w-8 text-blue-600" />
                <span className="text-lg font-semibold">{t("common.loading")}</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8">
                <ErrorDisplay error={error} onRetry={fetchDashboard} variant="full" />
            </div>
        )
    }

    if (!dashboard) return null

    return (
        <div className="space-y-8 px-4 py-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">{t("aggregators.dashboard")}</h1>
                    <p className="text-muted-foreground text-lg text-slate-500">{t("aggregators.dashboardSub")}</p>
                </div>
                <div className="text-sm text-slate-400">
                    {t("aggregators.lastUpdated")}: {new Date(dashboard.meta.generated_at).toLocaleString()}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <Users size={16} /> {t("aggregators.totalAggregators")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard.users.total_aggregators}</div>
                        <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">{dashboard.users.active_aggregators} {t("common.active")}</Badge>
                            <Badge variant="outline" className="text-slate-400 border-slate-200">{dashboard.users.inactive_aggregators} {t("common.inactive")}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <CreditCard size={16} /> {t("dashboard.totalTransactions")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard.transactions.total_count}</div>
                        <div className="flex gap-2 mt-1 text-xs">
                            <span className="text-green-600 font-medium">{dashboard.transactions.success_count} {t("dashboard.success")}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-blue-600 font-medium">{dashboard.transactions.success_rate}% {t("dashboard.approvalRate") || "Rate"}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <DollarSign size={16} /> {t("aggregators.totalPayin")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard.payin.total_amount.toLocaleString()} <span className="text-sm font-normal text-slate-400">XOF</span></div>
                        <div className="text-xs text-slate-500 mt-1">{t("aggregators.platformProfit")}: {dashboard.payin.total_platform_profit.toLocaleString()} XOF</div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <Zap size={16} /> {t("aggregators.totalPayout")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboard.payout.total_amount.toLocaleString()} <span className="text-sm font-normal text-slate-400">XOF</span></div>
                        <div className="text-xs text-slate-500 mt-1">{t("aggregators.platformProfit")}: {dashboard.payout.total_platform_profit.toLocaleString()} XOF</div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Over Time */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><Clock size={18} /> {t("aggregators.performanceToday")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">{t("aggregators.totalProcessed")}</span>
                            <span className="font-bold">{dashboard.today.total_count}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">{t("dashboard.successTransactions") || "Success Count"}</span>
                            <span className="font-bold text-green-600">{dashboard.today.success_count}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">{t("common.totalAmount")}</span>
                            <span className="font-bold">{dashboard.today.total_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                            <span className="text-sm text-blue-700">{t("aggregators.platformProfit")}</span>
                            <span className="font-bold text-blue-700">{dashboard.today.total_platform_profit.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} /> {t("aggregators.performance7D")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">Total Count</span>
                            <span className="font-bold">{dashboard.last_7_days.total_count}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">Success Count</span>
                            <span className="font-bold text-green-600">{dashboard.last_7_days.success_count}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">Total Amount</span>
                            <span className="font-bold">{dashboard.last_7_days.total_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                            <span className="text-sm text-blue-700">Platform Profit</span>
                            <span className="font-bold text-blue-700">{dashboard.last_7_days.total_platform_profit.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18} /> {t("aggregators.performance30D")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">Total Count</span>
                            <span className="font-bold">{dashboard.last_30_days.total_count}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">Success Count</span>
                            <span className="font-bold text-green-600">{dashboard.last_30_days.success_count}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                            <span className="text-sm text-slate-600">Total Amount</span>
                            <span className="font-bold">{dashboard.last_30_days.total_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                            <span className="text-sm text-blue-700">Platform Profit</span>
                            <span className="font-bold text-blue-700">{dashboard.last_30_days.total_platform_profit.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Network Stats Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">{t("aggregators.networkPerformance")}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>{t("common.network")}</TableHead>
                                    <TableHead className="text-right">{t("aggregators.totalProcessed")}</TableHead>
                                    <TableHead className="text-right">{t("dashboard.successTransactions") || "Success Count"}</TableHead>
                                    <TableHead className="text-right">{t("common.totalAmount")}</TableHead>
                                    <TableHead className="text-right">{t("aggregators.platformProfit")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboard.network_stats.length > 0 ? (
                                    dashboard.network_stats.map((stat, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{stat.network_name}</TableCell>
                                            <TableCell className="text-right">{stat.total_count}</TableCell>
                                            <TableCell className="text-right text-green-600">{stat.success_count}</TableCell>
                                            <TableCell className="text-right">{stat.total_amount.toLocaleString()}</TableCell>
                                            <TableCell className="text-right font-semibold text-blue-600">{stat.total_profit.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-slate-400">{t("dashboard.noData")}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Top Aggregators Placeholder */}
            {dashboard.top_aggregators.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">{t("aggregators.topAggregators")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="text-slate-400 italic">{t("aggregators.comingSoon")}</div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
