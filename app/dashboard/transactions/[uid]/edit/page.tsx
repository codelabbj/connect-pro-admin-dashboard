"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/providers/language-provider"
import { useApi } from "@/lib/useApi"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Copy } from "lucide-react"
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function EditTransactionPage() {
  const { uid } = useParams()
  const { t } = useLanguage()
  const apiFetch = useApi()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [transaction, setTransaction] = useState<any>(null)
  const [form, setForm] = useState({
    recipient_name: "",
    objet: "",
    external_transaction_id: "",
    raw_sms: "",
    processed_by_phone: "",
  })

  // Transaction logs state
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState("")

  useEffect(() => {
    const fetchTransaction = async () => {
      setLoading(true)
      setError("")
      try {
        const data = await apiFetch(`${baseUrl}api/payments/transactions/${uid}/`)
        setTransaction(data)
        setForm({
          recipient_name: data.recipient_name || data.display_recipient_name || "",
          objet: data.objet || "",
          external_transaction_id: data.external_transaction_id || "",
          raw_sms: data.raw_sms || "",
          processed_by_phone: data.processed_by_phone || "",
        })
      } catch (err: any) {
        setError(extractErrorMessages(err) || t("transactions.failedToLoad"))
      } finally {
        setLoading(false)
      }
    }
    fetchTransaction()
  }, [uid])

  // Fetch transaction logs
  const fetchTransactionLogs = async () => {
    setLogsLoading(true)
    setLogsError("")
    try {
      const data = await apiFetch(`${baseUrl}api/payments/transaction-logs/?transaction=${uid}`)
      const items = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []
      setLogs(items)
    } catch (err: any) {
      setLogsError(extractErrorMessages(err) || (t("transactions.failedToLoad") || "Failed to load"))
    } finally {
      setLogsLoading(false)
    }
  }

  useEffect(() => {
    if (uid) fetchTransactionLogs()
  }, [uid])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const [copied, setCopied] = useState(false)
  const handleCopyReference = () => {
    if (transaction?.reference) {
      navigator.clipboard.writeText(transaction.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const payload = {
        recipient_name: form.recipient_name,
        objet: form.objet,
        external_transaction_id: form.external_transaction_id,
        raw_sms: form.raw_sms,
        processed_by_phone: form.processed_by_phone,
      }
      await apiFetch(`${baseUrl}api/payments/transactions/${uid}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      router.push("/dashboard/transactions")
    } catch (err: any) {
      setError(extractErrorMessages(err) || t("transactions.failedToUpdate"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">{t("common.loading")}</div>
  if (error) return <ErrorDisplay error={error} />

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{t("transactions.editTransaction")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <strong>{t("transactions.reference")}:</strong> {transaction.reference}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-1"
                onClick={handleCopyReference}
                title={copied ? t("smsLogs.copied") : t("smsLogs.copy")}
              >
                <Copy className="w-4 h-4" />
              </Button>
              {copied && <span className="text-xs text-green-600">{t("smsLogs.copied")}</span>}
            </div>
            <div><strong>{t("transactions.type")}:</strong> <Badge>{t(`transactions.${transaction.type}`)}</Badge></div>
            <div><strong>{t("transactions.amount")}:</strong> {transaction.amount}</div>
            <div><strong>{t("transactions.recipientName")}:</strong> {transaction.display_recipient_name || transaction.recipient_name}</div>
            <div><strong>{t("transactions.recipientPhone")}:</strong> {transaction.recipient_phone}</div>
            <div><strong>{t("transactions.network")}: </strong>{transaction.network_name}</div>
            <div><strong>{t("transactions.status")}:</strong> <Badge>{t(`transactions.${transaction.status}`)}</Badge></div>
            <div><strong>{t("transactions.createdAt")}:</strong> {transaction.created_at ? new Date(transaction.created_at).toLocaleString() : "-"}</div>
            <div><strong>{t("transactions.completedAt")}:</strong> {transaction.completed_at ? new Date(transaction.completed_at).toLocaleString() : "-"}</div>
            <div><strong>Processed By:</strong> {transaction.processed_by_name}</div>
            {/* Additional read-only technical fields */}
            <div><strong>{t("transactions.balanceBefore")}</strong>: {transaction.balance_before ?? "-"}</div>
            <div><strong>{t("transactions.balanceAfter")}</strong>: {transaction.balance_after ?? "-"}</div>
            <div><strong>{t("transactions.fees")}</strong>: {transaction.fees ?? "-"}</div>
            <div className="col-span-2"><strong>{t("transactions.confirmationMessage")}</strong>: {transaction.confirmation_message ?? "-"}</div>
            <div className="col-span-2"><strong>{t("transactions.errorMessage")}</strong>: {transaction.error_message ?? "-"}</div>
          </div>
          {/* USSD Path */}
          {transaction.ussd_path && Array.isArray(transaction.ussd_path) && (
            <div className="mb-4">
                <strong>USSD Path:</strong>
                <pre className="bg-muted p-2 rounded text-xs whitespace-pre-wrap font-mono">
                {transaction.ussd_path.map((step: string, idx: number) => {
                    const [key, ...rest] = step.split(":");
                    const value = rest.join(":").trim();
                    return (
                    <div key={idx} style={{ marginBottom: "0.75em" }}>
                        <span style={{ fontWeight: "bold" }}>{key}:</span>{" "}
                        <span>{value}</span>
                    </div>
                    );
                })}
                </pre>
            </div>
            )}
          {/* Editable fields (only requested keys) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium">{t("transactions.recipientName") || "Recipient Name"}</label>
              <Input name="recipient_name" value={form.recipient_name} onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Objet</label>
              <Input name="objet" value={form.objet} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("transactions.externalTransactionId")}</label>
              <Input name="external_transaction_id" value={form.external_transaction_id} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium">{t("transactions.rawSms")}</label>
              <Input name="raw_sms" value={form.raw_sms} onChange={handleChange} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Processed By Phone</label>
              <Input name="processed_by_phone" value={form.processed_by_phone} onChange={handleChange} />
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button type="submit" disabled={saving}>{saving ? t("transactions.saving") : t("transactions.saveChanges")}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>{t("common.cancel")}</Button>
          </div>
        </form>
        {/* Transaction Logs */}
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t("transactionLogs.title") || "Transaction Logs"}</h3>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchTransactionLogs} disabled={logsLoading}>
                {logsLoading ? (t("common.loading") || "Loading...") : (t("common.refresh") || "Refresh")}
              </Button>
            </div>
          </div>
          {logsError && (
            <div className="mb-4">
              <ErrorDisplay error={logsError} onRetry={fetchTransactionLogs} />
            </div>
          )}
          {logsLoading && !logs.length ? (
            <div className="p-4 text-sm text-muted-foreground">{t("common.loading") || "Loading..."}</div>
          ) : logs.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">{t("transactionLogs.empty") || "No logs for this transaction."}</div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any, idx: number) => (
                <div key={log.uid || log.id || idx} className="rounded border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                      {new Date(log.created_at || log.timestamp || Date.now()).toLocaleString()}
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-muted">
                      {log.type || log.event || log.status || "event"}
                    </div>
                  </div>
                  {log.message && (
                    <div className="mt-2 text-sm">{log.message}</div>
                  )}
                  {(log.data || log.payload || log.meta) && (
                    <pre className="mt-2 bg-muted p-2 rounded text-xs whitespace-pre-wrap break-words">
{JSON.stringify(log.data || log.payload || log.meta, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
