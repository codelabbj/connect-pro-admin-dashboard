"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function CountryCreatePage() {
  const [nom, setNom] = useState("")
  const [code, setCode] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/countries/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, code, is_active: isActive })
      })
      // Success toast is automatically shown by useApi hook for non-GET requests
      router.push("/dashboard/country/list")
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err) || t("country.failedToCreate")
      setError(errorMessage)
      toast({
        title: t("country.failedToCreate"),
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
        <span className="text-lg font-semibold">{t("country.loading")}</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("country.create")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>{t("country.name")}</label>
            <Input value={nom} onChange={e => setNom(e.target.value)} required />
          </div>
          <div>
            <label>{t("country.code")}</label>
            <Input value={code} onChange={e => setCode(e.target.value)} required />
          </div>
          <div>
            <label>{t("country.status")}</label>
            <div className="relative">
              <select value={isActive ? "active" : "inactive"} onChange={e => setIsActive(e.target.value === "active")}
                className="w-full h-10 px-3 py-2 pr-10 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
              >
                <option value="active">{t("country.active")}</option>
                <option value="inactive">{t("country.inactive")}</option>
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
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
          <Button type="submit" disabled={loading}>{loading ? t("country.creating") : t("country.create")}</Button>
        </form>
      </CardContent>
    </Card>
  )
} 