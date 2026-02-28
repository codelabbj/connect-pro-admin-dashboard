"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Filter, Loader, MoreHorizontal, Eye, BarChart2, Shield } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { AggregatorListResponse, AggregatorUser } from "@/lib/aggregator-api"
import Link from "next/link"

export default function AggregatorUsersPage() {
    const [data, setData] = useState<AggregatorListResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    
    const apiFetch = useApi()
    const { t } = useLanguage()
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

    const fetchAggregators = async () => {
        setLoading(true)
        setError("")
        try {
            const data = await apiFetch(`${baseUrl}api/auth/admin/users/aggregators/?page=${page}&ordering=-created_at`)
            setData(data)
        } catch (err: any) {
            setError(extractErrorMessages(err) || "Failed to load aggregators")
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
        const action = currentStatus ? "deactivate" : "activate"
        if (!confirm(`Are you sure you want to ${action} this aggregator?`)) return
        
        try {
            await apiFetch(`${baseUrl}api/auth/admin/users/aggregators/${uid}/`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: !currentStatus })
            })
            toast({
                title: "Success",
                description: `Aggregator ${action}d successfully`
            })
            fetchAggregators()
        } catch (err: any) {
            toast({
                title: "Error",
                description: extractErrorMessages(err) || `Failed to ${action} aggregator`,
                variant: "destructive"
            })
        }
    }

    useEffect(() => {

        fetchAggregators()
    }, [apiFetch, page])

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="animate-spin mr-2 h-8 w-8 text-blue-600" />
                <span className="text-lg font-semibold">{t("common.loading")}</span>
            </div>
        )
    }

    return (
        <div className="space-y-6 px-4 py-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">Aggregator Users</h1>
                    <p className="text-muted-foreground text-slate-500">Manage all registered aggregators and their accounts</p>
                </div>
            </div>

            {/* Stats Overview */}
            {data?.stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Total Aggregators</span>
                                <Users size={16} className="text-blue-600" />
                            </div>
                            <div className="text-2xl font-bold mt-2">{data.stats.total_aggregators}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Active Aggregators</span>
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-green-600">{data.stats.active_aggregators}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Inactive Aggregators</span>
                                <div className="h-2 w-2 rounded-full bg-slate-300" />
                            </div>
                            <div className="text-2xl font-bold mt-2 text-slate-400">{data.stats.active_aggregators}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Table */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <Input 
                                placeholder="Search by name or email..." 
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Filter size={18} /> Filters
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <ErrorDisplay error={error} onRetry={fetchAggregators} />
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.aggregators.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                                No aggregators found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data?.aggregators
                                            .filter(agg => 
                                                agg.display_name.toLowerCase().includes(search.toLowerCase()) || 
                                                agg.email.toLowerCase().includes(search.toLowerCase())
                                            )
                                            .map((agg) => (
                                            <TableRow key={agg.uid}>
                                                <TableCell>
                                                    <div className="font-medium">{agg.display_name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{agg.uid.substring(0, 8)}...</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{agg.email}</div>
                                                    <div className="text-xs text-slate-400">{agg.phone || "No phone"}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-semibold text-blue-600">
                                                        {agg.account_balance.toLocaleString()} {agg.account_currency}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={agg.is_active ? "success" : "secondary"}>
                                                        {agg.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {new Date(agg.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/dashboard/aggregators/users/${agg.uid}/stats`} className="flex items-center gap-2">
                                                                    <Eye size={14} className="mr-2" /> View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                className={agg.is_active ? "text-red-600" : "text-green-600"}
                                                                onClick={() => handleToggleStatus(agg.uid, agg.is_active)}
                                                            >
                                                                <Shield size={14} className="mr-2" /> {agg.is_active ? "Deactivate Aggregator" : "Activate Aggregator"}
                                                            </DropdownMenuItem>

                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {data?.pagination && data.pagination.total_pages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-slate-500">
                                Showing {data.pagination.start_index} to {data.pagination.end_index} of {data.pagination.total_count} aggregators
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={!data.pagination.has_previous}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Previous
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={!data.pagination.has_next}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
