"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function NetworkConfigEditPage() {
  const router = useRouter()
  const params = useParams()
  const { id } = params
  const apiFetch = useApi()
  const { toast } = useToast();
  
  const [networks, setNetworks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [network, setNetwork] = useState("")
  const [isActive, setIsActive] = useState(true)
  
  // USSD Commands
  const [ussdBalance, setUssdBalance] = useState("")
  const [ussdDeposit, setUssdDeposit] = useState("")
  const [ussdWithdrawal, setUssdWithdrawal] = useState("")
  
  // SMS Keywords
  const [smsBalanceKeywords, setSmsBalanceKeywords] = useState("")
  const [smsDepositKeywords, setSmsDepositKeywords] = useState("")
  const [smsWithdrawalKeywords, setSmsWithdrawalKeywords] = useState("")
  
  // Error Keywords
  const [errorKeywords, setErrorKeywords] = useState("")
  
  // Custom Settings
  const [timeoutSeconds, setTimeoutSeconds] = useState(30)
  const [maxRetries, setMaxRetries] = useState(3)
  const [autoConfirm, setAutoConfirm] = useState(false)

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || "Failed to load networks"
        setError(errorMessage)
        setNetworks([])
        toast({
          title: "Failed to Load Networks",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    
    fetchNetworks()
  }, [])

  useEffect(() => {
    if (!id) return
    
    const fetchNetworkConfig = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/network-configs/${id}/`)
        
        setNetwork(data.network || "")
        setIsActive(data.is_active)
        
        // USSD Commands
        if (data.ussd_commands) {
          setUssdBalance(data.ussd_commands.balance || "")
          setUssdDeposit(data.ussd_commands.deposit || "")
          setUssdWithdrawal(data.ussd_commands.withdrawal || "")
        }
        
        // SMS Keywords
        if (data.sms_keywords) {
          setSmsBalanceKeywords(Array.isArray(data.sms_keywords.balance) ? data.sms_keywords.balance.join(', ') : "")
          setSmsDepositKeywords(Array.isArray(data.sms_keywords.deposit) ? data.sms_keywords.deposit.join(', ') : "")
          setSmsWithdrawalKeywords(Array.isArray(data.sms_keywords.withdrawal) ? data.sms_keywords.withdrawal.join(', ') : "")
        }
        
        // Error Keywords
        if (data.error_keywords) {
          setErrorKeywords(Array.isArray(data.error_keywords) ? data.error_keywords.join(', ') : "")
        }
        
        // Custom Settings
        if (data.custom_settings) {
          setTimeoutSeconds(data.custom_settings.timeout_seconds || 30)
          setMaxRetries(data.custom_settings.max_retries || 3)
          setAutoConfirm(data.custom_settings.auto_confirm || false)
        }
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || "Failed to load network configuration"
        setError(errorMessage)
        toast({
          title: "Failed to Load Config",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchNetworkConfig()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        network,
        ussd_commands: {
          balance: ussdBalance,
          deposit: ussdDeposit,
          withdrawal: ussdWithdrawal
        },
        sms_keywords: {
          balance: smsBalanceKeywords.split(',').map(k => k.trim()),
          deposit: smsDepositKeywords.split(',').map(k => k.trim()),
          withdrawal: smsWithdrawalKeywords.split(',').map(k => k.trim())
        },
        error_keywords: errorKeywords.split(',').map(k => k.trim()),
        is_active: isActive,
        custom_settings: {
          timeout_seconds: timeoutSeconds,
          max_retries: maxRetries,
          auto_confirm: autoConfirm
        }
      }
      
      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/network-configs/${id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      // Success toast is automatically shown by useApi hook for non-GET requests
      router.push("/dashboard/network-config/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || "Failed to update network configuration"
      setError(errorMessage)
      toast({
        title: "Failed to Update Config",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">Loading...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Network Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? <div>Loading...</div> : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Network Selection */}
            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <div className="relative">
                <select
                  id="network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full h-10 px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  required
                >
                  <option value="">Select a network</option>
                  {networks.map((net: any) => (
                    <option key={net.uid} value={net.uid}>
                      {net.nom}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="is-active">Active</Label>
            </div>

            {/* USSD Commands */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">USSD Commands</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ussd-balance">Balance Command</Label>
                  <Textarea
                    id="ussd-balance"
                    value={ussdBalance}
                    onChange={(e) => setUssdBalance(e.target.value)}
                    placeholder="*880#\n1\n{pin}"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ussd-deposit">Deposit Command</Label>
                  <Textarea
                    id="ussd-deposit"
                    value={ussdDeposit}
                    onChange={(e) => setUssdDeposit(e.target.value)}
                    placeholder="*880#\n2\n1\n{phone}\n{phone}\n{amount}\n{pin}"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ussd-withdrawal">Withdrawal Command</Label>
                  <Textarea
                    id="ussd-withdrawal"
                    value={ussdWithdrawal}
                    onChange={(e) => setUssdWithdrawal(e.target.value)}
                    placeholder="*880#\n3\n1\n{phone}\n{phone}\n{amount}\n{object}\n{pin}"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* SMS Keywords */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SMS Keywords</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-balance">Balance Keywords (comma-separated)</Label>
                  <Input
                    id="sms-balance"
                    value={smsBalanceKeywords}
                    onChange={(e) => setSmsBalanceKeywords(e.target.value)}
                    placeholder="solde actuel, votre solde"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-deposit">Deposit Keywords (comma-separated)</Label>
                  <Input
                    id="sms-deposit"
                    value={smsDepositKeywords}
                    onChange={(e) => setSmsDepositKeywords(e.target.value)}
                    placeholder="depot effectue, retrait effectue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-withdrawal">Withdrawal Keywords (comma-separated)</Label>
                  <Input
                    id="sms-withdrawal"
                    value={smsWithdrawalKeywords}
                    onChange={(e) => setSmsWithdrawalKeywords(e.target.value)}
                    placeholder="vous avez envoye, transfert effectue"
                  />
                </div>
              </div>
            </div>

            {/* Error Keywords */}
            <div className="space-y-2">
              <Label htmlFor="error-keywords">Error Keywords (comma-separated)</Label>
              <Input
                id="error-keywords"
                value={errorKeywords}
                onChange={(e) => setErrorKeywords(e.target.value)}
                placeholder="solde insuffisant, code incorrect, service indisponible"
              />
            </div>

            {/* Custom Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(parseInt(e.target.value))}
                    min="1"
                    max="300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-retries">Max Retries</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                    min="0"
                    max="10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-confirm"
                    checked={autoConfirm}
                    onCheckedChange={setAutoConfirm}
                  />
                  <Label htmlFor="auto-confirm">Auto Confirm</Label>
                </div>
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
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/network-config/list")}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
} 