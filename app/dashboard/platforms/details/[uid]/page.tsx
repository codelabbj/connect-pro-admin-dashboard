"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Copy, Edit, ArrowLeft, BarChart3, Users, CreditCard, TrendingUp, TrendingDown } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import Link from "next/link"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function PlatformDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()
  
  const uid = params.uid as string
  
  const [platform, setPlatform] = useState<any | null>(null)
  const [stats, setStats] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Fetch platform details and statistics
  useEffect(() => {
    const fetchData = async () => {
      if (!uid) return
      
      setLoading(true)
      setError("")
      
      try {
        // Fetch platform details
        const platformData = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${uid}/`)
        setPlatform(platformData)
        
        // Fetch platform statistics
        try {
          const statsData = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${uid}/stats/`)
          setStats(statsData)
        } catch (statsErr) {
          console.warn("Could not fetch platform statistics:", statsErr)
        }
        
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: t("platforms.failedToLoadPlatform"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [uid])

  // Toggle platform status
  const handleToggleStatus = async () => {
    if (!platform) return
    
    setTogglingStatus(true)
    try {
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${platform.uid}/toggle_status/`, {
        method: "PATCH",
      })
      
      setPlatform(prev => prev ? { ...prev, is_active: data.is_active } : prev)
      // Success toast is automatically shown by useApi hook for non-GET requests
    } catch (err: any) {
      toast({
        title: t("platforms.failedToUpdatePlatformStatus"),
        description: extractErrorMessages(err),
        variant: "destructive",
      })
    } finally {
      setTogglingStatus(false)
    }
  }

  // Handle delete attempt (shows info that deletion is not allowed)
  const handleDeleteAttempt = () => {
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    toast({
      title: t("platforms.deletionNotAllowed"),
      description: t("platforms.deletionNotAllowedReason"),
      variant: "destructive",
    })
    setDeleteModalOpen(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("platforms.loadingPlatformDetails")}</span>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => {
          setError("")
        }}
        variant="inline"
        className="mb-6"
      />
    )
  }

  if (!platform) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("platforms.platformNotFound")}</span>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/dashboard/platforms/list")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("platforms.backToPlatforms")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{platform.name}</h1>
            <p className="text-muted-foreground">{t("platforms.platformDetailsTitle")}</p>
          </div>
        </div>

        {/* Platform Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("platforms.platformInformation")}
              <div className="flex items-center gap-2">
                <Switch
                  checked={platform.is_active}
                  onCheckedChange={handleToggleStatus}
                  disabled={togglingStatus}
                />
                <span className="text-sm">
                  {platform.is_active ? t("platforms.active") : t("platforms.inactive")}
                </span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{t("platforms.uid") || "UID"}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-muted rounded text-sm">{platform.uid}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(platform.uid)
                        toast({ title: t("platforms.uidCopied") })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.name")}</Label>
                  <p>{platform.name}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.externalId")}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-muted rounded text-sm">{platform.external_id}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(platform.external_id)
                        toast({ title: t("platforms.externalIdCopied") })
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.description")}</Label>
                  <p className="text-muted-foreground">{platform.description || t("platforms.noDescriptionProvided")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{t("platforms.status")}</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={platform.is_active ? "default" : "secondary"}>
                      {platform.is_active ? t("platforms.active") : t("platforms.inactive")}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.minimumDeposit")}</Label>
                  <p className="font-mono">{platform.min_deposit_amount}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.maximumDeposit")}</Label>
                  <p className="font-mono">{platform.max_deposit_amount}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.minimumWithdrawal")}</Label>
                  <p className="font-mono">{platform.min_withdrawal_amount}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.maximumWithdrawal")}</Label>
                  <p className="font-mono">{platform.max_withdrawal_amount}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{t("platforms.createdBy")}</Label>
                  <p>{platform.created_by_name || t("platforms.unknown")}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.createdAtLabel")}</Label>
                  <p>{platform.created_at ? new Date(platform.created_at).toLocaleString() : t("platforms.unknown")}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">{t("platforms.updatedAt")}</Label>
                  <p>{platform.updated_at ? new Date(platform.updated_at).toLocaleString() : t("platforms.unknown")}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">{t("platforms.activePartners")}</Label>
                  <p className="font-semibold">{platform.active_partners_count || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t("platforms.platformStatistics")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium">{t("platforms.totalTransactions") || "Total Transactions"}</Label>
                  </div>
                  <p className="text-2xl font-bold">{stats.total_transactions}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <Label className="text-sm font-medium">{t("platforms.successful") || "Successful"}</Label>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.successful_transactions}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <Label className="text-sm font-medium">{t("platforms.failed") || "Failed"}</Label>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{stats.failed_transactions}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <Label className="text-sm font-medium">{t("platforms.activePartners")}</Label>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{stats.active_partners}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("platforms.pending") || "Pending Transactions"}</Label>
                  <p className="text-xl font-semibold">{stats.pending_transactions}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("platforms.totalVolume") || "Total Volume"}</Label>
                  <p className="text-xl font-semibold">{stats.total_volume}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t("platforms.totalCommissions") || "Total Commissions"}</Label>
                  <p className="text-xl font-semibold">{stats.total_commissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("common.actions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link href={`/dashboard/platforms/edit/${platform.uid}`}>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  {t("platforms.editPlatform")}
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleToggleStatus}
                disabled={togglingStatus}
              >
                {togglingStatus ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t("common.toggling")}
                  </>
                ) : platform.is_active ? (
                  t("platforms.deactivate") || "Deactivate Platform"
                ) : (
                  t("platforms.activate") || "Activate Platform"
                )}
              </Button>

              <Button 
                variant="destructive" 
                className="flex items-center gap-2"
                onClick={handleDeleteAttempt}
              >
                {t("platforms.deletePlatform")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("platforms.deletionNotAllowed")}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {t("platforms.deletionDisabledInfo")}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t("common.close")}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
