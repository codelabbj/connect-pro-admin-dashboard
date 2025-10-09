"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

function PermissionCreatePageContent() {
  const [selectedPartner, setSelectedPartner] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState("")
  const [canDeposit, setCanDeposit] = useState(true)
  const [canWithdraw, setCanWithdraw] = useState(true)
  const [enableStatus, setEnableStatus] = useState(true)
  const [loading, setLoading] = useState(false)
  const [partnerOptions, setPartnerOptions] = useState<any[]>([])
  const [platformOptions, setPlatformOptions] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()
  
  // Check for pre-selected partner from URL
  const preselectedPartner = searchParams?.get('partner') || ""

  // Fetch partners and platforms for selection
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true)
      setError("")
      
      try {
        // Fetch active partners
        const partnersParams = new URLSearchParams({
          page_size: "100",
          is_active: "true"
        })
        const partnersEndpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/?${partnersParams.toString()}`
        const partnersData = await apiFetch(partnersEndpoint)
        setPartnerOptions(partnersData.partners || [])
        
        // Fetch active platforms
        const platformsParams = new URLSearchParams({
          page_size: "100",
          is_active: "true"
        })
        const platformsEndpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/?${platformsParams.toString()}`
        const platformsData = await apiFetch(platformsEndpoint)
        setPlatformOptions(platformsData.results || [])
        
        toast({
          title: "Options loaded",
          description: "Partners and platforms loaded successfully",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: "Failed to load options",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoadingOptions(false)
      }
    }
    
    fetchOptions()
  }, [])

  // Auto-select partner if provided in URL
  useEffect(() => {
    if (preselectedPartner && partnerOptions.length > 0 && !selectedPartner) {
      const partnerExists = partnerOptions.some(p => p.uid === preselectedPartner)
      if (partnerExists) {
        setSelectedPartner(preselectedPartner)
      toast({
        title: t("permissions.partnerPreselected"),
        description: t("permissions.partnerSelectedFromUrl"),
      })
      }
    }
  }, [preselectedPartner, partnerOptions, selectedPartner, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPartner || !selectedPlatform) {
      toast({
        title: t("permissions.validationError"),
        description: t("permissions.selectBoth"),
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const payload = {
        partner: selectedPartner,
        platform: selectedPlatform,
        can_deposit: canDeposit,
        can_withdraw: canWithdraw,
      }

      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/permissions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      toast({
        title: t("permissions.permissionGranted"),
        description: t("permissions.grantedSuccessfully"),
      })
      
      router.push("/dashboard/permissions/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: t("permissions.grantFailed"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get selected platform details for display
  const selectedPlatformDetails = platformOptions.find(p => p.uid === selectedPlatform)
  
  // Get selected partner details for display
  const selectedPartnerDetails = partnerOptions.find(p => p.uid === selectedPartner)

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">Loading options...</span>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("permissions.grantNewPermission")}</CardTitle>
        </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Partner Selection */}
          <div className="space-y-2">
            <Label htmlFor="partner">{t("permissions.partnerSelection")} *</Label>
            <Select value={selectedPartner} onValueChange={setSelectedPartner}>
              <SelectTrigger>
                <SelectValue placeholder="Select a partner" />
              </SelectTrigger>
              <SelectContent>
                {partnerOptions.map((partner) => (
                  <SelectItem key={partner.uid} value={partner.uid}>
                    <div className="flex items-center gap-2">
                      <span>{partner.display_name || `${partner.first_name || ""} ${partner.last_name || ""}`}</span>
                      <span className="text-sm text-muted-foreground">({partner.email})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">{t("permissions.platformSelection")} *</Label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {platformOptions.map((platform) => (
                  <SelectItem key={platform.uid} value={platform.uid}>
                    <div className="flex flex-col">
                      <span>{platform.name}</span>
                      <span className="text-sm text-muted-foreground">{platform.description || platform.external_id}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Platform Details Display */}
          {selectedPlatformDetails && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Selected Platform Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {selectedPlatformDetails.name}</div>
                <div><strong>External ID:</strong> {selectedPlatformDetails.external_id}</div>
                <div><strong>Min Deposit:</strong> {selectedPlatformDetails.min_deposit_amount}</div>
                <div><strong>Max Deposit:</strong> {selectedPlatformDetails.max_deposit_amount}</div>
                <div><strong>Min Withdrawal:</strong> {selectedPlatformDetails.min_withdrawal_amount}</div>
                <div><strong>Max Withdrawal:</strong> {selectedPlatformDetails.max_withdrawal_amount}</div>
              </div>
            </div>
          )}

          {/* Selected Partner Details Display */}
          {selectedPartnerDetails && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Selected Partner Details:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Name:</strong> {selectedPartnerDetails.display_name || `${selectedPartnerDetails.first_name || ""} ${selectedPartnerDetails.last_name || ""}`}</div>
                <div><strong>Email:</strong> {selectedPartnerDetails.email}</div>
                <div><strong>Phone:</strong> {selectedPartnerDetails.phone || "N/A"}</div>
                <div><strong>UID:</strong> {selectedPartnerDetails.uid}</div>
              </div>
            </div>
          )}

          {/* Access Permissions */}
          <div className="space-y-4">
              <Label className="text-base font-semibold">{t("permissions.accessPermissions")}</Label>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="can_deposit"
                checked={canDeposit}
                onCheckedChange={setCanDeposit}
              />
              <Label htmlFor="can_deposit">{t("permissions.allowDeposit")}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="can_withdraw"
                checked={canWithdraw}
                onCheckedChange={setCanWithdraw}
              />
              <Label htmlFor="can_withdraw">{t("permissions.allowWithdraw")}</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={enableStatus}
                onCheckedChange={setEnableStatus}
              />
              <Label htmlFor="is_active">{t("permissions.enablePermission")}</Label>
            </div>
          </div>

          {/* Permission Summary */}
          {(selectedPartner && selectedPlatform) && (
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t("permissions.permissionSummary")}</h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <div><strong>{t("permissions.partnerSelection")}:</strong> {selectedPartnerDetails?.display_name || selectedPartnerDetails?.email}</div>
                <div><strong>{t("permissions.platformSelection")}:</strong> {selectedPlatformDetails?.name}</div>
                <div><strong>{t("permissions.canDeposit")}</strong> {canDeposit ? t("common.yes") : t("common.no")}</div>
                <div><strong>{t("permissions.canWithdraw")}</strong> {canWithdraw ? t("common.yes") : t("common.no")}</div>
                <div><strong>{t("permissions.status")}</strong> {enableStatus ? t("common.active") : t("common.inactive")}</div>
              </div>
            </div>
          )}

          {error && (
            <ErrorDisplay
              error={error}
              variant="inline"
              showRetry={false}
              className="mb-4"
            />
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading || !selectedPartner || !selectedPlatform}>
              {loading ? t("permissions.creating") : t("permissions.grantPermission")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/permissions/list")}>
              {t("permissions.cancel")}
            </Button>
          </div>
        </form>
    </CardContent>
    </Card>
    </>
  )
}

export default dynamic(() => Promise.resolve(PermissionCreatePageContent), {
  ssr: false
})
