"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

export default function RegisterUserForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    identifier: "",
    password: "",
    password_confirm: "",
      is_partner: false,
      can_process_ussd_transaction: false,
    })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const { t } = useLanguage();
  const apiFetch = useApi();
  const { toast } = useToast();

  // Get base URL and token from env
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const apiToken = process.env.NEXT_PUBLIC_API_TOKEN || ""

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, type, checked, value } = e.target;
      setForm({
        ...form,
        [name]: type === "checkbox" ? checked : value,
      });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (form.password !== form.password_confirm) {
      setError(t("register.passwordsNoMatch"))
      toast({
        title: t("register.failed"),
        description: t("register.passwordsNoMatch"),
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (apiToken) {
        headers["Authorization"] = `Bearer ${apiToken}`
      }
      // Map identifier to email or phone for backend compatibility
      const isEmail = /@/.test(form.identifier)
        const submitBody = {
          first_name: form.first_name,
          last_name: form.last_name,
          email: isEmail ? form.identifier : null,
          phone: isEmail ? null : form.identifier,
          password: form.password,
          password_confirm: form.password_confirm,
          is_partner: form.is_partner,
          can_process_ussd_transaction: form.can_process_ussd_transaction,
        }
      const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/register/`, {
        method: "POST",
        headers,
        body: JSON.stringify(submitBody),
      })
      if (data && data.detail) {
        const backendError = extractErrorMessages(data)
        setError(backendError)
        toast({
          title: t("register.failed"),
          description: backendError,
          variant: "destructive",
        })
      } else {
        setSuccess(t("register.success"))
        // Success toast is automatically shown by useApi hook for non-GET requests
        setForm({
          first_name: "",
          last_name: "",
          identifier: "",
          password: "",
          password_confirm: "",
          is_partner: false,
          can_process_ussd_transaction: false,
        })
      }
    } catch (err: any) {
      const backendError = extractErrorMessages(err) || t("register.networkError")
      setError(backendError)
      toast({
        title: t("register.networkError"),
        description: backendError,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("register.registering")}</span>
      </div>
    )
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t("register.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <Input
              name="first_name"
              placeholder={t("register.firstName")}
              value={form.first_name}
              onChange={handleChange}
              required
            />
            <Input
              name="last_name"
              placeholder={t("register.lastName")}
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </div>
          <Input
            name="identifier"
            type="text"
            placeholder={t("register.emailOrPhone") || "Email or phone number"}
            value={(form as any).identifier}
            onChange={handleChange}
            required
          />
          <div className="flex gap-4">
            <Input
              name="password"
              type="password"
              placeholder={t("register.password")}
              value={form.password}
              onChange={handleChange}
              required
            />
            <Input
              name="password_confirm"
              type="password"
              placeholder={t("register.passwordConfirm")}
              value={form.password_confirm}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              name="is_partner"
              checked={form.is_partner}
              onChange={handleChange}
              id="is_partner"
              className="mr-2"
            />
            <label htmlFor="is_partner">{t("register.isPartner") || "Is Partner"}</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              name="can_process_ussd_transaction"
              checked={form.can_process_ussd_transaction}
              onChange={handleChange}
              id="can_process_ussd_transaction"
              className="mr-2"
            />
            <label htmlFor="can_process_ussd_transaction">{t("register.allowTransaction") || "Allow Transaction"}</label>
          </div>
          {error && (
            <ErrorDisplay
              error={error}
              variant="inline"
              showRetry={false}
              className="mb-4"
            />
          )}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <Button type="submit" disabled={loading}>
            {loading ? t("register.registering") : t("register.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}