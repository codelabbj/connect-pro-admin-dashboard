"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Percent } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function CommissionConfigEditPage() {
  const params = useParams()
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()
  
  const partnerUid = params.partner_uid as string
  
  const [partnerInfo, setPartnerInfo] = useState<any | null>(null)
  const [hasConfig, setHasConfig] = useState(false)
  const [depositCommissionRate, setDepositCommissionRate] = useState("")
  const [withdrawalCommissionRate, setWithdrawalCommissionRate] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  // Fetch partner commission config
  useEffect(() => {
    const fetchPartnerConfig = async () => {
      if (!partnerUid) return
      
      setFetching(true)
      setError("")
      
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commission-configs/get_partner_config/?partner_uid=${partnerUid}`
        const data = await apiFetch(endpoint)
        
        setPartnerInfo(data.partner_info)
        setHasConfig(data.has_config)
        
        if (data.has_config && data.config) {
          setDepositCommissionRate(data.config.deposit_commission_rate || "")
          setWithdrawalCommissionRate(data.config.withdrawal_commission_rate || "")
        }
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: "Failed to load partner config",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setFetching(false)
      }
    }
    
    fetchPartnerConfig()
  }, [partnerUid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        partner: partnerUid,
        deposit_commission_rate: parseFloat(depositCommissionRate) || 0,
        withdrawal_commission_rate: parseFloat(withdrawalCommissionRate) || 0,
      }

      let response
      if (hasConfig) {
        // Update existing config
        // Since we don't have the config UID, we need to get it first
        const configEndpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commission-configs/get_partner_config/?partner_uid=${partnerUid}`
        const configData = await apiFetch(configEndpoint)
        const configUid = configData.config.uid
        
        response = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commission-configs/${configUid}/`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deposit_commission_rate: payload.deposit_commission_rate,
            withdrawal_commission_rate: payload.withdrawal_commission_rate,
          }),
        })
      } else {
        // Create new config
        response = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commission-configs/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      // Success toast is automatically shown by useApi hook for non-GET requests
      
      router.push("/dashboard/commission-config/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: `Failed to ${hasConfig ? "update" : "create"} configuration`,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">Loading partner configuration...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          {hasConfig ? "Edit" : "Create"} Commission Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Partner Information */}
        {partnerInfo && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Partner Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Name:</strong> {partnerInfo.first_name} {partnerInfo.last_name}</div>
              <div><strong>Email:</strong> {partnerInfo.email}</div>
              <div><strong>UID:</strong> {partnerInfo.uid}</div>
              <div><strong>Status:</strong> {partnerInfo.is_active ? "Active" : "Inactive"}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Commission Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="deposit_rate">Deposit Commission Rate (%)</Label>
              <Input
                id="deposit_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={depositCommissionRate}
                onChange={(e) => setDepositCommissionRate(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-sm text-muted-foreground">
                Percentage commission for deposit transactions (e.g., 2.50)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawal_rate">Withdrawal Commission Rate (%)</Label>
              <Input
                id="withdrawal_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={withdrawalCommissionRate}
                onChange={(e) => setWithdrawalCommissionRate(e.target.value)}
                placeholder="0.00"
                required
              />
              <p className="text-sm text-muted-foreground">
                Percentage commission for withdrawal transactions (e.g., 3.00)
              </p>
            </div>
          </div>

          {/* Rate Recommendations */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Commission Rate Guidelines:</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div><strong>Deposit Rates:</strong></div>
              <div>• Standard: 2.0% - 2.5%</div>
              <div>• High Volume: 1.5% - 2.0%</div>
              <div>• Premium Partners: 1.0% - 1.5%</div>
              <div className="mt-2"><strong>Withdrawal Rates:</strong></div>
              <div>• Standard: 3.0% - 3.5%</div>
              <div>• High Volume: 2.5% - 3.0%</div>
              <div>• Premium Partners: 2.0% - 2.5%</div>
            </div>
          </div>

          {error && (
            <ErrorDisplay
              error={error}
              variant="inline"
              showRetry={false}
              className="mb-4"
            />
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? `${hasConfig ? "Updating" : "Creating"}...` : `${hasConfig ? "Update" : "Create"} Configuration`}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/partner")}>
              Back to Partners
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/commission-config/list")}>
              View All Configs
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
