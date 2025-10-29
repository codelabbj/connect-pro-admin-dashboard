"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, MoreHorizontal, Settings, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/lib/useApi"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import Link from "next/link"

export default function ApiConfigListPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [configs, setConfigs] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sortField, setSortField] = useState<"name" | "updated_at" | "created_at" | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  
  const { t } = useLanguage()
  const itemsPerPage = 20
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi()
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null)

  // Fetch API configurations
  useEffect(() => {
    const fetchConfigs = async () => {
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

        // Add sorting
        let ordering = ""
        if (sortField === "name") {
          ordering = `${sortDirection === "asc" ? "" : "-"}name`
        } else if (sortField === "updated_at") {
          ordering = `${sortDirection === "asc" ? "" : "-"}updated_at`
        } else if (sortField === "created_at") {
          ordering = `${sortDirection === "asc" ? "" : "-"}created_at`
        }
        
        if (ordering) {
          params.append("ordering", ordering)
        }

        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/api-config/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        setConfigs(data.results || [])
        setTotalCount(data.count || 0)
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
        
        toast({
          title: t("apiConfig.apiConfigurationsLoaded"),
          description: t("apiConfig.apiConfigurationsLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setConfigs([])
        setTotalCount(0)
        setTotalPages(1)
        toast({
          title: t("apiConfig.failedToLoadApiConfigurations"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchConfigs()
  }, [searchTerm, currentPage, sortField, sortDirection])

  const handleSort = (field: "name" | "updated_at" | "created_at") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  // Fetch config details
  const handleOpenDetail = (config: any) => {
    setDetailModalOpen(true)
    setSelectedConfig(config)
  }

  const startIndex = (currentPage - 1) * itemsPerPage

  const maskSecretKey = (key: string) => {
    if (!key) return t("apiConfig.notSet")
    if (key.length <= 8) return "••••••••"
    return `${key.slice(0, 4)}${'•'.repeat(key.length - 8)}${key.slice(-4)}`
  }

  const maskPublicKey = (key: string) => {
    if (!key) return t("apiConfig.notSet")
    if (key.length <= 12) return "••••••••••••"
    return `${key.slice(0, 8)}${'•'.repeat(key.length - 12)}${key.slice(-4)}`
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? t("common.active") : t("common.inactive")}
      </Badge>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("apiConfig.apiConfigurationManagement")}
          </CardTitle>
          <Link href="/dashboard/api-config/create">
            <Button className="mt-2">{t("apiConfig.createApiConfiguration")}</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("apiConfig.searchApiConfigurations")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
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
                    <TableHead>{t("common.uid") || "UID"}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("name")} className="h-auto p-0 font-semibold">
                        {t("apiConfig.name")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("apiConfig.baseUrlTable")}</TableHead>
                    <TableHead>{t("apiConfig.publicKeyTable")}</TableHead>
                    <TableHead>{t("apiConfig.timeout")}</TableHead>
                    <TableHead>{t("apiConfig.status")}</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort("updated_at")} className="h-auto p-0 font-semibold">
                        {t("apiConfig.lastUpdatedTable")}
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>{t("apiConfig.updatedByTable")}</TableHead>
                    <TableHead>{t("apiConfig.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.uid}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="px-1 py-0.5 bg-muted rounded text-xs">
                            {config.uid.slice(0, 8)}...
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => {
                              navigator.clipboard.writeText(config.uid)
                              toast({ title: t("common.uidCopied") || "UID copied!" })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 py-0.5 rounded">
                          {config.base_url}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {maskPublicKey(config.public_key)}
                        </code>
                      </TableCell>
                      <TableCell>{config.timeout_seconds}s</TableCell>
                      <TableCell>{getStatusBadge(config.is_active)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {config.updated_at ? new Date(config.updated_at).toLocaleDateString() : "-"}
                        </div>
                      </TableCell>
                      <TableCell>{config.updated_by_name || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetail(config)}>
                              {t("apiConfig.viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Link href={`/dashboard/api-config/edit/${config.uid}`}>
                                {t("apiConfig.editConfiguration")}
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              {t("apiConfig.showing")}: {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalCount)} {t("common.of")} {totalCount}
            </div>
            <div className="text-sm">
              {t("common.page")} {currentPage} {t("common.of")} {totalPages}
            </div>
            <div className="flex items-center space-x-2">

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("common.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {t("common.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Config Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("apiConfig.configurationInformation")}</DialogTitle>
          </DialogHeader>
          {selectedConfig ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <strong>{t("common.uid")}:</strong> {selectedConfig.uid}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedConfig.uid)
                      toast({ title: t("common.uidCopied") || "UID copied!" })
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div><strong>{t("apiConfig.name")}:</strong> {selectedConfig.name}</div>
                <div><strong>{t("apiConfig.baseUrl")}:</strong> <code className="bg-muted px-1 py-0.5 rounded">{selectedConfig.base_url}</code></div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div><strong>{t("apiConfig.publicKey")}:</strong></div>
                  <div className="bg-muted p-2 rounded">
                    <code>{maskPublicKey(selectedConfig.public_key)}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedConfig.public_key)
                        toast({ title: t("apiConfig.publicKeyCopied") || "Public key copied!" })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div><strong>{t("apiConfig.secretKey")}:</strong></div>
                  <div className="bg-muted p-2 rounded">
                    <code>{maskSecretKey(selectedConfig.secret_key)}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-2"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedConfig.secret_key)
                        toast({ title: t("apiConfig.secretKeyCopied") || "Secret key copied!" })
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div><strong>{t("apiConfig.timeout")}:</strong> {selectedConfig.timeout_seconds} {t("apiConfig.seconds") || "seconds"}</div>
                <div><strong>{t("apiConfig.status")}:</strong> {getStatusBadge(selectedConfig.is_active)}</div>
                <div><strong>{t("apiConfig.created")}:</strong> {selectedConfig.created_at ? new Date(selectedConfig.created_at).toLocaleString() : t("platforms.unknown")}</div>
                <div><strong>{t("apiConfig.lastUpdated")}:</strong> {selectedConfig.updated_at ? new Date(selectedConfig.updated_at).toLocaleString() : t("platforms.unknown")}</div>
                <div><strong>{t("apiConfig.updatedBy")}:</strong> {selectedConfig.updated_by_name || t("platforms.unknown")}</div>
              </div>
            </div>
          ) : null}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setDetailModalOpen(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
