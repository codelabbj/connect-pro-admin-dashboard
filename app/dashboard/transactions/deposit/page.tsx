"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useApi } from "@/lib/useApi"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useLanguage } from "@/components/providers/language-provider"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function DepositPage() {
  const [networks, setNetworks] = useState<any[]>([])
  const [network, setNetwork] = useState("")
  const [amount, setAmount] = useState("")
  //const [confirmAmount, setConfirmAmount] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [confirmRecipientPhone, setConfirmRecipientPhone] = useState("")
  const [objet, setObjet] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmDetails, setConfirmDetails] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<any | null>(null)
  const apiFetch = useApi()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await apiFetch(`${baseUrl}api/payments/networks/`)
        setNetworks(data.results || [])
      } catch (err) {
        setError(t("transactions.failedToLoadNetworks") || "Failed to load networks")
      }
    }
    fetchNetworks()
  }, [apiFetch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Client-side validations
    // if (amount.trim() !== confirmAmount.trim()) {
    //   setError(t("transactions.amountMismatch") || "Amount and Confirm Amount do not match")
    //   return
    // }
    if (recipientPhone.trim() !== confirmRecipientPhone.trim()) {
      setError(t("transactions.phoneMismatch") || "Phone number and Confirm Phone number do not match")
      return
    }
    if (!confirmDetails) {
      setError(t("transactions.confirmDetailsRequired") || "Please confirm the phone number and amount")
      return
    }
    // Prepare payload and open confirmation modal instead of immediate submit
    const payload = {
      type: "deposit",
      amount,
      recipient_phone: recipientPhone,
      recipient_name: null,
      objet: objet.trim() === "" ? null : objet,
      network,
    }
    setPendingPayload(payload)
    setShowConfirmModal(true)
  }

  const handleConfirmSubmit = async () => {
    if (!pendingPayload) return
    setLoading(true)
    setError("")
    try {
      await apiFetch(`${baseUrl}api/payments/transactions/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingPayload),
      })
      // Success toast is automatically shown by useApi hook for non-GET requests
      setShowConfirmModal(false)
      setPendingPayload(null)
      router.push("/dashboard/transactions")
    } catch (err: any) {
      setError(extractErrorMessages(err) || t("transactions.failedToCreateDeposit") || "Failed to create deposit")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>{t("transactions.depositTitle") || "Deposit"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select value={network} onValueChange={setNetwork}>
              <SelectTrigger>
                <SelectValue placeholder={t("transactions.selectNetwork") || "Select Network"} />
              </SelectTrigger>
              <SelectContent>
                {networks.map((n) => (
                  <SelectItem key={n.uid} value={n.uid}>{n.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder={t("transactions.amount") || "Amount"}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              type="number"
              required
            />
            {/* <Input
              placeholder={t("transactions.confirmAmount") || "Confirm Amount"}
              value={confirmAmount}
              onChange={e => setConfirmAmount(e.target.value)}
              type="number"
              required
            /> */}
            <Input
              placeholder={t("transactions.recipientPhone") || "Recipient Phone"}
              value={recipientPhone}
              onChange={e => setRecipientPhone(e.target.value)}
              required
            />
            <Input
              placeholder={t("transactions.confirmRecipientPhone") || "Confirm Recipient Phone"}
              value={confirmRecipientPhone}
              onChange={e => setConfirmRecipientPhone(e.target.value)}
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={confirmDetails}
                onChange={e => setConfirmDetails(e.target.checked)}
              />
              {t("transactions.confirmationLabel") || "I confirm the phone number and amount are correct"}
            </label>
            <Input
              placeholder={t("transactions.purpose") || "Objet"}
              value={objet}
              onChange={e => setObjet(e.target.value)}
              required
            />
            {error && <ErrorDisplay error={error} variant="inline" />}
            <Button
              type="submit"
              disabled={
                loading ||
                !network ||
                !confirmDetails ||
                // amount.trim() !== confirmAmount.trim() ||
                recipientPhone.trim() !== confirmRecipientPhone.trim()
              }
            >
              {loading
                ? t("common.submitting") || "Submitting..."
                : t("transactions.reviewAndConfirm") || "Review & Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("transactions.confirmDepositTitle") || t("transactions.reviewAndConfirm") || "Confirm Deposit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.selectNetwork") || "Network"}:</span><span className="font-medium">{networks.find(n => n.uid === network)?.nom || network}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.amount") || "Amount"}:</span><span className="font-medium">{amount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.recipientPhone") || "Recipient Phone"}:</span><span className="font-medium">{recipientPhone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("transactions.purpose") || "Purpose"}:</span><span className="font-medium">{objet}</span></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowConfirmModal(false); }} disabled={loading}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={loading}>
              {loading ? (t("common.submitting") || "Submitting...") : (t("transactions.submit") || "Submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}