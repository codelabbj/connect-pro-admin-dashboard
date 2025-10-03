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
      
      toast({
        title: "API Configuration Created",
        description: "API configuration has been created successfully",
      })
      
      router.push("/dashboard/api-config/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: "Failed to create API configuration",
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
          Create API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Betpay Production API"
                required
              />
              <p className="text-sm text-muted-foreground">
                A descriptive name for this API configuration
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url">Base URL *</Label>
              <Input
                id="base_url"
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                required
              />
              <p className="text-sm text-muted-foreground">
                The base URL for the API endpoint
              </p>
            </div>
          </div>

          {/* API Keys */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="public_key">Public Key *</Label>
              <Input
                id="public_key"

                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="pk_live_abc123..."
                required
              />
              <p className="text-sm text-muted-foreground">
                The public key for API authentication
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret_key">Secret Key *</Label>
              <Input
                id="secret_key"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_live_xyz789..."
                required
              />
              <p className="text-sm text-muted-foreground">
                The secret key for API authentication (will be masked in display)
              </p>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds) *</Label>
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
                Request timeout in seconds (1-300)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Configuration Status</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="is_active">
                  {isActive ? "Active" : "Inactive"}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Whether this configuration is currently active
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Security Notice:</h4>
            <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <div>• Secret keys will be masked in the interface for security</div>
              <div>• Store API keys securely and never share them</div>
              <div>• Use HTTPS URLs only in production</div>
              <div>• Test configurations thoroughly before activating</div>
            </div>
          </div>

          {/* Configuration Summary */}
          {(name && baseUrl && publicKey && secretKey && timeoutSeconds) && (
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Configuration Summary:</h4>
              <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <div><strong>Name:</strong> {name}</div>
                <div><strong>Base URL:</strong> {baseUrl}</div>
                <div><strong>Public Key:</strong> {publicKey.slice(0, 8)}...{publicKey.slice(-4)}</div>
                <div><strong>Secret Key:</strong> {secretKey.slice(0, 4)}••••{secretKey.slice(-4)}</div>
                <div><strong>Timeout:</strong> {timeoutSeconds}s</div>
                <div><strong>Status:</strong> {isActive ? "Active" : "Inactive"}</div>
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
              {loading ? "Creating Configuration..." : "Create Configuration"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/dashboard/api-config/list")}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
