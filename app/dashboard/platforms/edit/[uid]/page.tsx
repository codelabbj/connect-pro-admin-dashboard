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
import { getImageUrl } from "@/lib/utils"

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
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)
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
        setCurrentLogo(data.logo || null)
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
      let body: any;
      let headers: Record<string, string> = {};

      if (logoFile) {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("min_deposit_amount", (parseFloat(minDepositAmount) || 0).toString());
        formData.append("max_deposit_amount", (parseFloat(maxDepositAmount) || 0).toString());
        formData.append("min_withdrawal_amount", (parseFloat(minWithdrawalAmount) || 0).toString());
        formData.append("max_withdrawal_amount", (parseFloat(maxWithdrawalAmount) || 0).toString());
        formData.append("description", description.trim());
        formData.append("is_active", isActive.toString());
        formData.append("logo", logoFile);
        body = formData;
      } else {
        const payload = {
          name: name.trim(),
          min_deposit_amount: parseFloat(minDepositAmount) || 0,
          max_deposit_amount: parseFloat(maxDepositAmount) || 0,
          min_withdrawal_amount: parseFloat(minWithdrawalAmount) || 0,
          max_withdrawal_amount: parseFloat(maxWithdrawalAmount) || 0,
          description: description.trim(),
          is_active: isActive,
        }
        body = JSON.stringify(payload);
        headers["Content-Type"] = "application/json";
      }

      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/platforms/${uid}/`, {
        method: "PATCH",
        headers,
        body,
      })
      // Success toast is automatically shown by useApi hook for non-GET requests
      
      router.push("/dashboard/platforms/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: t("platforms.failedToUpdatePlatform"),
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
        <span className="text-lg font-semibold">{t("platforms.loadingPlatform")}</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("platforms.editPlatform")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Platform UID (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="uid">{t("platforms.uid") || "UID"}</Label>
            <Input
              id="uid"
              value={uid}
              disabled
              className="bg-muted"
            />
          </div>

          {/* External ID (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="external_id">{t("platforms.externalId")}</Label>
            <Input
              id="external_id"
              value={externalId}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">{t("platforms.logo") || "Platform Logo"}</Label>
            <div className="flex flex-col gap-4">
              { (logoFile || currentLogo) && (
                <div className="relative h-24 w-24 border rounded overflow-hidden bg-muted flex items-center justify-center">
                  <img 
                    src={logoFile ? URL.createObjectURL(logoFile) : (getImageUrl(currentLogo) || "")} 
                    alt="Preview" 
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = "flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-bold text-xl";
                        fallback.innerText = name[0] || "?";
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  {logoFile && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-0 right-0 h-6 w-6 rounded-none rounded-bl"
                      onClick={() => setLogoFile(null)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              )}
              <Input 
                id="logo"
                type="file" 
                accept="image/*" 
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)} 
                className="cursor-pointer"
              />
            </div>
          </div>

          {/* Platform Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t("platforms.platformName")} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("platforms.platformNamePlaceholder")}
              required
            />
          </div>

          {/* Deposit Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_deposit">{t("platforms.minimumDepositAmount")}</Label>
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
              <Label htmlFor="max_deposit">{t("platforms.maximumDepositAmount")}</Label>
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
              <Label htmlFor="min_withdrawal">{t("platforms.minimumWithdrawalAmount")}</Label>
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
              <Label htmlFor="max_withdrawal">{t("platforms.maximumWithdrawalAmount")}</Label>
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
            <Label htmlFor="description">{t("platforms.description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("platforms.descriptionPlaceholder")}
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
            <Label htmlFor="is_active">{t("platforms.activePlatform")}</Label>
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
              {loading ? t("platforms.updating") : t("platforms.updatePlatform")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/platforms/list")}>
              {t("common.cancel")}
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => {
                if (confirm(t("platforms.deletePlatformConfirm"))) {
                  // Note: The API docs mention that deletion is not allowed for security reasons
                  toast({
                    title: t("platforms.deletionNotAllowed"),
                    description: t("platforms.deletionNotAllowedReason"),
                    variant: "destructive",
                  })
                }
              }}
            >
              {t("platforms.deletePlatform")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
