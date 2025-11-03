"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Percent } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function CommissionConfigCreatePage() {
  const [selectedPartner, setSelectedPartner] = useState("")
  const [depositCommissionRate, setDepositCommissionRate] = useState("")
  const [withdrawalCommissionRate, setWithdrawalCommissionRate] = useState("")
  const [loading, setLoading] = useState(false)
  const [partnerOptions, setPartnerOptions] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  // Fetch active partners for selection
  useEffect(() => {
    const fetchPartners = async () => {
      setLoadingOptions(true)
      setError("")
      
      try {
        const params = new URLSearchParams({
          page_size: "100",
          is_active: "true"
        })
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/?${params.toString()}`
        const data = await apiFetch(endpoint)
        setPartnerOptions(data.partners || [])
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: "Failed to load partners",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoadingOptions(false)
      }
    }
    
    fetchPartners()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedPartner) {
      toast({
        title: "Validation Error",
        description: "Please select a partner",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError("")
    
    try {
      const payload = {
        partner: selectedPartner,
        deposit_commission_rate: parseFloat(depositCommissionRate) || 0,
        withdrawal_commission_rate: parseFloat(withdrawalCommissionRate) || 0,
      }

      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commission-configs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      // Success toast is automatically shown by useApi hook for non-GET requests
      
      router.push("/dashboard/commission-config/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: "Failed to create configuration",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get selected partner details for display
  const selectedPartnerDetails = partnerOptions.find(p => p.uid === selectedPartner)

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">Loading partners...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5" />
          Create Commission Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Partner Selection */}
          <div className="space-y-2">
            <Label htmlFor="partner">Partner *</Label>
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

          {/* Commission Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="deposit_rate">Deposit Commission Rate (%) *</Label>
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
              <Label htmlFor="withdrawal_rate">Withdrawal Commission Rate (%) *</Label>
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

          {/* Configuration Summary */}
          {(selectedPartner && depositCommissionRate && withdrawalCommissionRate) && (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Configuration Summary:</h4>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <div><strong>Partner:</strong> {selectedPartnerDetails?.display_name || selectedPartnerDetails?.email}</div>
                <div><strong>Deposit Commission:</strong> {depositCommissionRate}%</div>
                <div><strong>Withdrawal Commission:</strong> {withdrawalCommissionRate}%</div>
                <div><strong>Created by:</strong> Current Admin</div>
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
            <Button type="submit" disabled={loading || !selectedPartner || !depositCommissionRate || !withdrawalCommissionRate}>
              {loading ? "Creating Configuration..." : "Create Configuration"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/commission-config/list")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
