"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function PermissionEditPage() {
  const params = useParams()
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()
  
  const uid = params.uid as string
  
  const [partner, setPartner] = useState<any | null>(null)
  const [platform, setPlatform] = useState<any | null>(null)
  const [canDeposit, setCanDeposit] = useState(false)
  const [canWithdraw, setCanWithdraw] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  // Fetch permission details
  useEffect(() => {
    const fetchPermission = async () => {
      if (!uid) return
      
      setFetching(true)
      setError("")
      
      try {
        // We need to get the permission data from the list endpoint since there's no single permission endpoint
        // For now, let's simulate by getting all permissions and finding the one with the matching UID
        const params = new URLSearchParams({
          page_size: "1000"
        })
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/permissions/?${params.toString()}`
        const data = await apiFetch(endpoint)
        
        const permission = data.results.find((p: any) => p.uid === uid)
        
        if (!permission) {
          throw new Error("Permission not found")
        }

        // Set the form data from the permission
        setPartner({
          uid: permission.partner,
          name: permission.partner_name
        })
        
        setPlatform({
          uid: permission.platform,
          name: permission.platform_name,
          external_id: permission.platform_external_id,
          min_deposit_amount: permission.platform_min_deposit,
          max_deposit_amount: permission.platform_max_deposit,
          min_withdrawal_amount: permission.platform_min_withdrawal,
          max_withdrawal_amount: permission.platform_max_withdrawal,
          description: permission.platform_name
        })
        
        setCanDeposit(permission.can_deposit)
        setCanWithdraw(permission.can_withdraw)
        setIsActive(permission.is_active)
        
        toast({
          title: "Permission loaded",
          description: "Permission details loaded successfully",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: "Failed to load permission",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setFetching(false)
      }
    }
    
    fetchPermission()
  }, [uid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        can_deposit: canDeposit,
        can_withdraw: canWithdraw,
        is_active: isActive,
      }

      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/permissions/${uid}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      toast({
        title: "Permission Updated",
        description: "Permission has been updated successfully",
      })
      
      router.push("/dashboard/permissions/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: "Failed to update permission",
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
        <span className="text-lg font-semibold">Loading permission...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Permission</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Read-only Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted rounded-lg">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Permission UID</Label>
                <code className="block px-2 py-1 bg-background rounded text-sm mt-1">{uid}</code>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Partner</Label>
                <div className="mt-1">
                  <div className="font-medium">{partner?.name || "Unknown"}</div>
                  <code className="text-xs text-muted-foreground">{partner?.uid || "N/A"}</code>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Platform</Label>
                <div className="mt-1">
                  <div className="font-medium">{platform?.name || "Unknown"}</div>
                  <code className="text-xs text-muted-foreground">{platform?.external_id || "N/A"}</code>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Platform Limits</Label>
                <div className="mt-1 space-y-1 text-sm">
                  <div><span className="font-medium">Deposit:</span> {platform?.min_deposit_amount} - {platform?.max_deposit_amount}</div>
                  <div><span className="font-medium">Withdrawal:</span> {platform?.min_withdrawal_amount} - {platform?.max_withdrawal_amount}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Permissions */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Access Permissions</Label>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="can_deposit"
                checked={canDeposit}
                onCheckedChange={setCanDeposit}
              />
              <Label htmlFor="can_deposit">Allow Deposit Operations</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="can_withdraw"
                checked={canWithdraw}
                onCheckedChange={setCanWithdraw}
              />
              <Label htmlFor="can_withdraw">Allow Withdrawal Operations</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is_active">Permission Status (Active/Inactive)</Label>
            </div>
          </div>

          {/* Permission Summary */}
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Updated Permission Summary:</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div><strong>Partner:</strong> {partner?.name}</div>
              <div><strong>Platform:</strong> {platform?.name}</div>
              <div><strong>Can Deposit:</strong> {canDeposit ? "Yes" : "No"}</div>
              <div><strong>Can Withdraw:</strong> {canWithdraw ? "Yes" : "No"}</div>
              <div><strong>Status:</strong> {isActive ? "Active" : "Inactive"}</div>
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
              {loading ? "Updating..." : "Update Permission"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/permissions/list")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
