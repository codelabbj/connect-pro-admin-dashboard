"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
const yapsonUrl = "https://api.yapson.net/yapson/app_name"

export default function PlatformCreatePage() {
  const [name, setName] = useState("")
  const [externalId, setExternalId] = useState("")
  const [minDepositAmount, setMinDepositAmount] = useState("")
  const [maxDepositAmount, setMaxDepositAmount] = useState("")
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState("")
  const [maxWithdrawalAmount, setMaxWithdrawalAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [yapsonApps, setYapsonApps] = useState<any[]>([])
  const [yapsonLoading, setYapsonLoading] = useState(false)
  
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  // Fetch Yapson apps for external ID selection
  useEffect(() => {
    const fetchYapsonApps = async () => {
      setYapsonLoading(true)
      try {
        const response = await fetch(yapsonUrl)
        const data = await response.json()
        setYapsonApps(data || [])
      } catch (err) {
        console.error("Failed to fetch Yapson apps:", err)
        toast({
          title: "Warning",
          description: "Could not load external platform options. You can still enter external ID manually.",
          variant: "destructive",
        })
      } finally {
        setYapsonLoading(false)
      }
    }
    fetchYapsonApps()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        name: name.trim(),
        external_id: externalId.trim(),
        min_deposit_amount: parseFloat(minDepositAmount) || 0,
        max_deposit_amount: parseFloat(maxDepositAmount) || 0,
        min_withdrawal_amount: parseFloat(minWithdrawalAmount) || 0,
        max_withdrawal_amount: parseFloat(maxWithdrawalAmount) || 0,
        description: description.trim(),
        is_active: isActive,
      }

      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      toast({
        title: "Platform Created",
        description: "Platform has been created successfully",
      })
      
      router.push("/dashboard/platforms/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: "Failed to create platform",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleYapsonAppSelect = (app: any) => {
    setName(app.name)
    setExternalId(app.id)
    setDescription(app.public_name ? `${app.public_name} - Sports betting platform` : `${app.name} - Sports betting platform`)
    setIsActive(app.is_active)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">Creating platform...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Yapson App Selection */}
          <div className="space-y-4">
            <Label>Quick Select from Yapson Apps (Optional)</Label>
            {yapsonLoading ? (
              <div className="text-sm text-muted-foreground">Loading available apps...</div>
            ) : (
              <Select
                onValueChange={(appId) => {
                  const app = yapsonApps.find(a => a.id === appId)
                  if (app) handleYapsonAppSelect(app)
                }}
                placeholder="Select a platform to auto-fill details"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a platform to auto-fill details" />
                </SelectTrigger>
                <SelectContent>
                  {yapsonApps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      <div className="flex items-center gap-2">
                        {app.image && (
                          <img src={app.image} alt={app.name} className="w-6 h-6 object-cover rounded" />
                        )}
                        {app.name} ({app.public_name})
                      </div>
                    </SelectItem>
   ))}                 
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Platform Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 1xbet"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="external_id">External ID *</Label>
              <Input
                id="external_id"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="Platform's external identifier"
                required
              />
            </div>
          </div>

          {/* Deposit Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_deposit">Minimum Deposit Amount</Label>
              <Input
                id="min_deposit"
                type="number"
                step="0.01"
                min="0"
                value={minDepositAmount}
                onChange={(e) => setMinDepositAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_deposit">Maximum Deposit Amount</Label>
              <Input
                id="max_deposit"
                type="number"
                step="0.01"
                min="0"
                value={maxDepositAmount}
                onChange={(e) => setMaxDepositAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Withdrawal Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_withdrawal">Minimum Withdrawal Amount</Label>
              <Input
                id="min_withdrawal"
                type="number"
                step="0.01"
                min="0"
                value={minWithdrawalAmount}
                onChange={(e) => setMinWithdrawalAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label html-for="max_withdrawal">Maximum Withdrawal Amount</Label>
              <Input
                id="max_withdrawal"
                type="number"
                step="0.01"
                min="0"
                value={maxWithdrawalAmount}
                onChange={(e) => setMaxWithdrawalAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Platform description..."
              rows={3}
            />
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">Active Platform</Label>
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
              {loading ? "Creating..." : "Create Platform"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/platforms/list")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
