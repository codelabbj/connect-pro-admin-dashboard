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
import { Settings } from "lucide-react"

export default function ApiConfigEditPage() {
  const params = useParams()
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()
  
  const configUid = params.uid as string
  
  const [name, setName] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [timeoutSeconds, setTimeoutSeconds] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [originalConfig, setOriginalConfig] = useState<any | null>(null)

  // Fetch API configuration
  useEffect(() => {
    const fetchConfig = async () => {
      if (!configUid) return
      
      setFetching(true)
      setError("")
      
      try {
        // Note: We'll need to fetch config details, assuming we can get configs from the list endpoint
        // In a real scenario, you might need a dedicated GET endpoint for individual configs
        const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")}/api/payments/betting/admin/api-config/`
        const data = await apiFetch(endpoint)
        
        const config = data.results?.find((c: any) => c.uid === configUid)
        if (config) {
          setOriginalConfig(config)
          setName(config.name)
          setBaseUrl(config.base_url)
          setPublicKey(config.public_key || "")
          setTimeoutSeconds(config.timeout_seconds?.toString() || "30")
          setIsActive(config.is_active ?? true)
          // Note: Secret key might not be returned for security reasons
          setSecretKey("") // Will need to be re-entered
        } else {
          setError(t("apiConfig.configurationNotFound"))
        }
        
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: t("apiConfig.failedToLoadConfiguration"),
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setFetching(false)
      }
    }
    
    fetchConfig()
  }, [configUid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError("")
    
    try {
      const payload: any = {
        name: name.trim(),
        base_url: baseUrl.trim(),
        timeout_seconds: parseInt(timeoutSeconds) || 30,
        is_active: isActive,
      }

      // Only include keys if they've been modified
      if (publicKey.trim()) {
        payload.public_key = publicKey.trim()
      }
      if (secretKey.trim()) {
        payload.secret_key = secretKey.trim()
      }

      await apiFetch(`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")}/api/payments/betting/admin/api-config/${configUid}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      // Success toast is automatically shown by useApi hook for non-GET requests
      
      router.push("/dashboard/api-config/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: t("apiConfig.failedToUpdateConfiguration"),
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
        <span className="text-lg font-semibold">{t("apiConfig.loadingConfiguration")}</span>
      </div>
    )
  }

  if (error && !originalConfig) {
    return <ErrorDisplay error={error} variant="full" showDismiss={false} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("apiConfig.editApiConfiguration")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Original Configuration Info */}
        {originalConfig && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">{t("apiConfig.configurationInformation")}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>{t("common.uid")}:</strong> {originalConfig.uid}</div>
              <div><strong>{t("apiConfig.created")}:</strong> {originalConfig.created_at ? new Date(originalConfig.created_at).toLocaleString() : t("platforms.unknown")}</div>
              <div><strong>{t("apiConfig.lastUpdated")}:</strong> {originalConfig.updated_at ? new Date(originalConfig.updated_at).toLocaleString() : t("platforms.unknown")}</div>
              <div><strong>{t("apiConfig.updatedBy")}:</strong> {originalConfig.updated_by_name || t("platforms.unknown")}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("apiConfig.configurationName")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("apiConfig.configurationNamePlaceholder")}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("apiConfig.configurationNameDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url">{t("apiConfig.baseUrl")} *</Label>
              <Input
                id="base_url"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={t("apiConfig.baseUrlPlaceholder")}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("apiConfig.baseUrlDescription")}
              </p>
            </div>
          </div>

          {/* API Keys */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="public_key">{t("apiConfig.publicKey")}</Label>
              <Input
                id="public_key"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder={originalConfig?.public_key ? t("apiConfig.leaveBlankToKeepExistingKey") : t("apiConfig.publicKeyPlaceholder")}
              />
              <p className="text-sm text-muted-foreground">
                {originalConfig?.public_key ? t("apiConfig.leaveBlankToKeepExistingKey") : t("apiConfig.publicKeyDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret_key">{t("apiConfig.secretKey")}</Label>
              <Input
                id="secret_key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={originalConfig?.secret_key ? t("apiConfig.leaveBlankToKeepExistingKeySecret") : t("apiConfig.secretKeyPlaceholder")}
              />
              <p className="text-sm text-muted-foreground">
                {originalConfig?.secret_key ? t("apiConfig.leaveBlankToKeepExistingKeySecret") : t("apiConfig.secretKeyDescription")}
              </p>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timeout">{t("apiConfig.timeoutSeconds")} *</Label>
              <Input
                id="timeout"
                type="number"
                min="1"
                max="300"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(e.target.value)}
                placeholder="30"
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("apiConfig.timeoutDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">{t("apiConfig.configurationStatus")}</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="is_active">
                  {isActive ? t("common.active") : t("common.inactive")}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("apiConfig.configurationStatusDescription")}
              </p>
            </div>
          </div>

          {/* Changes Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">{t("apiConfig.updateSummary")}:</h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <div><strong>{t("apiConfig.nameLabel")}:</strong> {name}</div>
              <div><strong>{t("apiConfig.baseUrlLabel")}:</strong> {baseUrl}</div>
              <div><strong>{t("apiConfig.publicKeyLabel")}:</strong> {publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}` : t("apiConfig.unchanged")}</div>
              <div><strong>{t("apiConfig.secretKeyLabel")}:</strong> {secretKey ? `${secretKey.slice(0, 4)}••••${secretKey.slice(-4)}` : t("apiConfig.unchanged")}</div>
              <div><strong>{t("apiConfig.timeoutLabel")}:</strong> {timeoutSeconds}s</div>
              <div><strong>{t("apiConfig.statusLabel")}:</strong> {isActive ? t("common.active") : t("common.inactive")}</div>
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
            <Button type="submit" disabled={loading || !name || !baseUrl || !timeoutSeconds}>
              {loading ? t("apiConfig.updatingConfiguration") : t("apiConfig.updateConfiguration")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/api-config/list")}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
