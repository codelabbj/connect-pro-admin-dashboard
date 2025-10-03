"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function PlatformEditPage() {
  const params = useParams()
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()
  
  const uid = params.uid as string
  
  const [name, setName] = useState("")
  const [externalId, setExternalId] = useState("")
  const [minDepositAmount, setMinDepositAmount] = useState("")
  const [maxDepositAmount, setMaxDepositAmount] = useState("")
  const [minWithdrawalAmount, setMinWithdrawalAmount] = useState("")
  const [maxWithdrawalAmount, setMaxWithdrawalAmount] = useState("")
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  // Fetch platform details
  useEffect(() => {
    const fetchPlatform = async () => {
      if (!uid) return
      
      setFetching(true)
      setError("")
      
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${uid}/`)
        
        setName(data.name || "")
        setExternalId(data.external_id || "")
        setMinDepositAmount(data.min_deposit_amount?.toString() || "")
        setMaxDepositAmount(data.max_deposit_amount?.toString() || "")
        setMinWithdrawalAmount(data.min_withdrawal_amount?.toString() || "")
        setMaxWithdrawalAmount(data.max_withdrawal_amount?.toString() || "")
        setDescription(data.description || "")
        setIsActive(data.is_active ?? true)
        
        toast({
          title: "Platform loaded",
          description: "Platform details loaded successfully",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: "Failed to load platform",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setFetching(false)
      }
    }
    
    fetchPlatform()
  }, [uid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        name: name.trim(),
        min_deposit_amount: parseFloat(minDepositAmount) || 0,
        max_deposit_amount: parseFloat(maxDepositAmount) || 0,
        min_withdrawal_amount: parseFloat(minWithdrawalAmount) || 0,
        max_withdrawal_amount: parseFloat(maxWithdrawalAmount) || 0,
        description: description.trim(),
        is_active: isActive,
      }

      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${uid}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      toast({
        title: "Platform Updated",
        description: "Platform has been updated successfully",
      })
      
      router.push("/dashboard/platforms/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: "Failed to update platform",
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
        <span className="text-lg font-semibold">Loading platform...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Platform</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Platform UID (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="uid">UID</Label>
            <Input
              id="uid"
              value={uid}
              disabled
              className="bg-muted"
            />
          </div>

          {/* External ID (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="external_id">External ID</Label>
            <Input
              id="external_id"
              value={externalId}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Platform Name */}
          <div className="space-y-2">
            <Label html-for="name">Platform Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 1xbet"
              required
            />
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
              <Label htmlFor="max_withdrawal">Maximum Withdrawal Amount</Label>
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
              {loading ? "Updating..." : "Update Platform"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/platforms/list")}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => {
                if (confirm("Are you sure you want to delete this platform? This action cannot be undone.")) {
                  // Note: The API docs mention that deletion is not allowed for security reasons
                  toast({
                    title: "Deletion Not Allowed",
                    description: "Platform deletion is not allowed for security reasons.",
                    variant: "destructive",
                  })
                }
              }}
            >
              Delete Platform
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
