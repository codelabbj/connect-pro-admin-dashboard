"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function AutoRechargeMappingCreatePage() {
  const router = useRouter()
  const [networks, setNetworks] = useState<any[]>([])
  const [aggregators, setAggregators] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [network, setNetwork] = useState("")
  const [aggregator, setAggregator] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [priority, setPriority] = useState("0")
  const [fixedFee, setFixedFee] = useState("0.00")
  const [percentageFee, setPercentageFee] = useState("0.00")
  const [minAmount, setMinAmount] = useState("100.00")
  const [maxAmount, setMaxAmount] = useState("1000000.00")
  const [aggregatorNetworkCode, setAggregatorNetworkCode] = useState("")
  const [aggregatorCountryCode, setAggregatorCountryCode] = useState("")
  
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/`)
        setNetworks(Array.isArray(data) ? data : data.results || [])
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: t("autoRecharge.mapping.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }

    const fetchAggregators = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auto-recharge/admin/aggregators/`)
        setAggregators(Array.isArray(data) ? data : data.results || [])
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        toast({
          title: t("autoRecharge.aggregators.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }

    fetchNetworks()
    fetchAggregators()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const payload = {
        network: network.trim(),
        aggregator: aggregator.trim(),
        is_active: isActive,
        priority: parseInt(priority) || 0,
        fixed_fee: fixedFee.trim(),
        percentage_fee: percentageFee.trim(),
        min_amount: minAmount.trim(),
        max_amount: maxAmount.trim(),
        aggregator_network_code: aggregatorNetworkCode.trim(),
        aggregator_country_code: aggregatorCountryCode.trim(),
      }

      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auto-recharge/admin/mappings/create/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      router.push("/dashboard/auto-recharge?tab=mappings")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      setError(errorMessage)
      toast({
        title: t("autoRecharge.mapping.failedToCreate"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !error) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("autoRecharge.mapping.creating")}</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("autoRecharge.mapping.create")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Network Selection */}
          <div className="space-y-2">
            <Label htmlFor="network">{t("autoRecharge.mapping.network")} *</Label>
            <Select value={network} onValueChange={setNetwork} required>
              <SelectTrigger>
                <SelectValue placeholder={t("autoRecharge.mapping.selectNetwork")} />
              </SelectTrigger>
              <SelectContent>
                {networks.map((net: any) => (
                  <SelectItem key={net.uid} value={net.uid}>
                    {net.nom} ({net.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aggregator Selection */}
          <div className="space-y-2">
            <Label htmlFor="aggregator">{t("autoRecharge.mapping.aggregator")} *</Label>
            <Select value={aggregator} onValueChange={setAggregator} required>
              <SelectTrigger>
                <SelectValue placeholder={t("autoRecharge.mapping.selectAggregator")} />
              </SelectTrigger>
              <SelectContent>
                {aggregators.map((agg: any) => (
                  <SelectItem key={agg.uid} value={agg.uid}>
                    {agg.name} ({agg.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is_active">{t("autoRecharge.mapping.active")}</Label>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">{t("autoRecharge.mapping.priority")}</Label>
            <Input
              id="priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>

          {/* Fees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fixed_fee">{t("autoRecharge.mapping.fixedFee")}</Label>
              <Input
                id="fixed_fee"
                type="text"
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage_fee">{t("autoRecharge.mapping.percentageFee")}</Label>
              <Input
                id="percentage_fee"
                type="text"
                value={percentageFee}
                onChange={(e) => setPercentageFee(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Amount Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_amount">{t("autoRecharge.mapping.minAmount")}</Label>
              <Input
                id="min_amount"
                type="text"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                placeholder="100.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_amount">{t("autoRecharge.mapping.maxAmount")}</Label>
              <Input
                id="max_amount"
                type="text"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                placeholder="1000000.00"
              />
            </div>
          </div>

          {/* Aggregator Codes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aggregator_network_code">{t("autoRecharge.mapping.aggregatorNetworkCode")}</Label>
              <Input
                id="aggregator_network_code"
                type="text"
                value={aggregatorNetworkCode}
                onChange={(e) => setAggregatorNetworkCode(e.target.value)}
                placeholder="mtn-bj"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aggregator_country_code">{t("autoRecharge.mapping.aggregatorCountryCode")}</Label>
              <Input
                id="aggregator_country_code"
                type="text"
                value={aggregatorCountryCode}
                onChange={(e) => setAggregatorCountryCode(e.target.value)}
                placeholder="BJ"
              />
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
              {loading ? t("autoRecharge.mapping.creating") : t("autoRecharge.mapping.createMapping")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/auto-recharge?tab=mappings")}
            >
              {t("autoRecharge.mapping.cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

