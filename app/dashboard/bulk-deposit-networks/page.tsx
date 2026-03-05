"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus } from "lucide-react"
import {
    useBulkDepositNetworkApi,
    BulkDepositNetwork
} from "@/lib/bulk-deposit-network-api"
import { CreateBulkDepositNetworkModal } from "./CreateBulkDepositNetworkModal"

export default function BulkDepositNetworksPage() {
    const { t } = useLanguage()
    const { getBulkDepositNetworks, toggleBulkDepositNetworkStatus } = useBulkDepositNetworkApi()
    const [networks, setNetworks] = useState<BulkDepositNetwork[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [filterUserUid, setFilterUserUid] = useState("")
    const [filterNetworkUid, setFilterNetworkUid] = useState("")

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const fetchNetworks = async (currentPage = page) => {
        try {
            setLoading(true)
            const data = await getBulkDepositNetworks({
                page: currentPage,
                page_size: 20,
                user: filterUserUid || undefined,
                network: filterNetworkUid || undefined,
            })

            setNetworks(data.results || [])
            setTotalPages(Math.ceil((data.count || 0) / 20))
            setPage(currentPage)
        } catch (error) {
            console.error("Failed to fetch bulk deposit networks:", error)
            toast({
                title: t("bulkDepositNetworks.error"),
                description: t("bulkDepositNetworks.errors.failedToLoad"),
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNetworks(1)
    }, [filterUserUid, filterNetworkUid])

    const handleToggleStatus = async (uid: string, currentStatus: boolean) => {
        try {
            const newStatus = !currentStatus
            await toggleBulkDepositNetworkStatus(uid, newStatus)

            setNetworks((prev) =>
                prev.map((net) =>
                    net.uid === uid ? { ...net, is_active: newStatus } : net
                )
            )

            toast({
                title: t("bulkDepositNetworks.success"),
                description: newStatus ? t("bulkDepositNetworks.success.activated") : t("bulkDepositNetworks.success.deactivated"),
            })
        } catch (error) {
            console.error("Failed to toggle status:", error)
            toast({
                title: t("bulkDepositNetworks.error"),
                description: t("bulkDepositNetworks.errors.failedToUpdate"),
                variant: "destructive",
            })
        }
    }

    const handleCreated = () => {
        fetchNetworks(1)
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("bulkDepositNetworks.title")}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t("bulkDepositNetworks.description")}
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t("bulkDepositNetworks.createAuthorization")}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t("bulkDepositNetworks.filters")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Input
                        placeholder={t("bulkDepositNetworks.filterByUserUid")}
                        value={filterUserUid}
                        onChange={(e) => setFilterUserUid(e.target.value)}
                        className="max-w-xs"
                    />
                    <Input
                        placeholder={t("bulkDepositNetworks.filterByNetworkUid")}
                        value={filterNetworkUid}
                        onChange={(e) => setFilterNetworkUid(e.target.value)}
                        className="max-w-xs"
                    />
                    <Button variant="secondary" onClick={() => {
                        setFilterUserUid("")
                        setFilterNetworkUid("")
                    }}>
                        {t("bulkDepositNetworks.clearFilters")}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("bulkDepositNetworks.user")}</TableHead>
                                        <TableHead>{t("bulkDepositNetworks.network")}</TableHead>
                                        <TableHead>{t("bulkDepositNetworks.createdAt")}</TableHead>
                                        <TableHead className="text-right">{t("bulkDepositNetworks.status")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {networks.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                {t("bulkDepositNetworks.noAuthorizationsFound")}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        networks.map((net) => (
                                            <TableRow key={net.uid}>
                                                <TableCell>
                                                    <div className="font-medium">{net.user_display_name || net.user}</div>
                                                    <div className="text-xs text-muted-foreground">{net.user_email}</div>
                                                    <div className="text-xs text-muted-foreground">{net.user}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{net.network_name || net.network}</div>
                                                    <div className="text-xs text-muted-foreground">{net.network}</div>
                                                </TableCell>
                                                <TableCell>{new Date(net.created_at).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    <Switch
                                                        checked={net.is_active}
                                                        onCheckedChange={() => handleToggleStatus(net.uid, net.is_active)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                {t("bulkDepositNetworks.previous")}
                            </Button>
                            <div className="text-sm">
                                {t("bulkDepositNetworks.page")} {page} {t("bulkDepositNetworks.of")} {totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                {t("bulkDepositNetworks.next")}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateBulkDepositNetworkModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleCreated}
            />
        </div>
    )
}
