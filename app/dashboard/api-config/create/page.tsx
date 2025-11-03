"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export default function ApiConfigCreatePage() {
  const [name, setName] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [timeoutSeconds, setTimeoutSeconds] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        name: name.trim(),
        base_url: baseUrl.trim(),
        public_key: publicKey.trim(),
        secret_key: secretKey.trim(),
        timeout_seconds: parseInt(timeoutSeconds) || 30,
        is_active: isActive,
      }

      await apiFetch(`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")}/api/payments/betting/admin/api-config/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      // Success toast is automatically shown by useApi hook for non-GET requests
      
      router.push("/dashboard/api-config/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: t("apiConfig.failedToCreateApiConfiguration"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t("apiConfig.createApiConfigTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
              <Label htmlFor="public_key">{t("apiConfig.publicKey")} *</Label>
              <Input
                id="public_key"

                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder={t("apiConfig.publicKeyPlaceholder")}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("apiConfig.publicKeyDescription")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret_key">{t("apiConfig.secretKey")} *</Label>
              <Input
                id="secret_key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={t("apiConfig.secretKeyPlaceholder")}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("apiConfig.secretKeyDescription")}
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

          {/* Security Notice */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">{t("apiConfig.securityNotice")}:</h4>
            <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <div>• {t("apiConfig.secretKeysMasked")}</div>
              <div>• {t("apiConfig.storeKeysSecurely")}</div>
              <div>• {t("apiConfig.useHttpsOnly")}</div>
              <div>• {t("apiConfig.testConfigurations")}</div>
            </div>
          </div>

          {/* Configuration Summary */}
          {(name && baseUrl && publicKey && secretKey && timeoutSeconds) && (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">{t("apiConfig.configurationSummary")}:</h4>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <div><strong>{t("apiConfig.nameLabel")}:</strong> {name}</div>
                <div><strong>{t("apiConfig.baseUrlLabel")}:</strong> {baseUrl}</div>
                <div><strong>{t("apiConfig.publicKeyLabel")}:</strong> {publicKey.slice(0, 8)}...{publicKey.slice(-4)}</div>
                <div><strong>{t("apiConfig.secretKeyLabel")}:</strong> {secretKey.slice(0, 4)}••••{secretKey.slice(-4)}</div>
                <div><strong>{t("apiConfig.timeoutLabel")}:</strong> {timeoutSeconds}s</div>
                <div><strong>{t("apiConfig.statusLabel")}:</strong> {isActive ? t("common.active") : t("common.inactive")}</div>
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
            <Button type="submit" disabled={loading || !name || !baseUrl || !publicKey || !secretKey || !timeoutSeconds}>
              {loading ? t("apiConfig.creatingConfiguration") : t("apiConfig.createConfiguration")}
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
