"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Eye, EyeOff } from "lucide-react"

export default function RegisterUserForm() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    identifier: "",
    password: "",
    password_confirm: "",
    is_partner: false,
    can_process_ussd_transaction: false,
    is_aggregator: false,
    can_process_momo: true,
    can_process_mobcash: true,
    can_process_bulk_payment: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)

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
        is_aggregator: form.is_aggregator,
        can_process_momo: form.can_process_momo,
        can_process_mobcash: form.can_process_mobcash,
        can_process_bulk_payment: form.can_process_bulk_payment,
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
          is_aggregator: false,
          can_process_momo: true,
          can_process_mobcash: true,
          can_process_bulk_payment: true,
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
            <div className="relative flex-1">
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("register.password")}
                value={form.password}
                onChange={handleChange}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative flex-1">
              <Input
                name="password_confirm"
                type={showPasswordConfirm ? "text" : "password"}
                placeholder={t("register.passwordConfirm")}
                value={form.password_confirm}
                onChange={handleChange}
                required
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                tabIndex={-1}
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              name="is_aggregator"
              checked={form.is_aggregator}
              onChange={handleChange}
              id="is_aggregator"
              className="mr-2"
            />
            <label htmlFor="is_aggregator">{t("users.isAggregator") || "Is Aggregator"}</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              name="can_process_momo"
              checked={form.can_process_momo}
              onChange={handleChange}
              id="can_process_momo"
              className="mr-2"
            />
            <label htmlFor="can_process_momo">{t("register.canProcessMomo") || "Can Process MoMo"}</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              name="can_process_mobcash"
              checked={form.can_process_mobcash}
              onChange={handleChange}
              id="can_process_mobcash"
              className="mr-2"
            />
            <label htmlFor="can_process_mobcash">{t("register.canProcessMobcash") || "Can Process MobCash"}</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              name="can_process_bulk_payment"
              checked={form.can_process_bulk_payment}
              onChange={handleChange}
              id="can_process_bulk_payment"
              className="mr-2"
            />
            <label htmlFor="can_process_bulk_payment">{t("register.canProcessBulkPayment") || "Can Process Bulk Payment"}</label>
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