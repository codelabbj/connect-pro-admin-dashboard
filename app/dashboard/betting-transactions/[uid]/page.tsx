"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, DollarSign, CopyIcon, ExternalLink } from "lucide-react"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function BettingTransactionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const apiFetch = useApi()
  const { toast } = useToast()
  
  const transactionUid = params.uid as string
  
  const [transaction, setTransaction] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingCancellation, setProcessingCancellation] = useState(false)
  const [pendingCancellation, setPendingCancellation] = useState(false)
  const [cancellationNotes, setCancellationNotes] = useState("")
  const [error, setError] = useState("")
  
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

  // Fetch transaction details
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!transactionUid) return
      
      setLoading(true)
      setError("")
      
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/transactions/${transactionUid}/`
        const data = await apiFetch(endpoint)
        setTransaction(data)
        
        toast({
          title: "Transaction loaded",
          description: "Transaction details loaded successfully",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: "Failed to load transaction",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchTransactionDetails()
  }, [transactionUid])

  const handleProcessCancellation = async () => {
    if (!transaction) return
    
    setProcessingCancellation(true)
    try {
      const payload = {
        admin_notes: cancellationNotes || "Cancellation approved by admin"
      }
      
      const response = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/transactions/${transaction.uid}/process_cancellation/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      toast({
        title: "Cancellation Processed",
        description: response.message || "Transaction cancellation has been processed successfully",
      })
      
      // Update transaction data
      setTransaction(response.transaction || transaction)
      setCancellationNotes("")
      setPendingCancellation(false)
      
    } catch (err: any) {
      const errorMessage = extractErrorMessages(err)
      toast({
        title: "Cancellation Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setProcessingCancellation(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
      success: "default",
      failed: "destructive",
      pending: "outline",
      cancelled: "secondary",
      cancellation_requested: "secondary"
    }
    
    return <Badge variant={variants[status] || "outline"}>{status.replace(/_/g, " ").toUpperCase()}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "destructive" | "outline"> = {
      deposit: "default",
      withdraw: "destructive",
      withdrawal: "destructive"
    }
    
    return <Badge variant={variants[type] || "outline"}>{type.toUpperCase()}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">Loading transaction details...</span>
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay error={error} variant="full" showDismiss={false} />
  }

  if (!transaction) {
    return <ErrorDisplay error="Transaction not found" variant="full" showDismiss={false} />
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/betting-transactions")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Transactions
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Transaction Details</h1>
              <p className="text-muted-foreground">Betting transaction details and management</p>
            </div>
          </div>
          
          {transaction.status === "cancellation_requested" && (
            <Button
              variant="destructive"
              onClick={() => setPendingCancellation(true)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Process Cancellation
            </Button>
          )}
        </div>

        {/* Transaction Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Transaction Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Transaction UID</Label>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded text-sm">{transaction.uid}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.uid)
                      toast({ title: "UID copied!" })
                    }}
                  >
                    <CopyIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reference</Label>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-muted rounded text-sm">{transaction.reference}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(transaction.reference)
                      toast({ title: "Reference copied!" })
                    }}
                  >
                    <CopyIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount</Label>
                <div className="text-2xl font-bold">${transaction.amount}</div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div>{getStatusBadge(transaction.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Partner Name</span>
                <span>{transaction.partner_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Platform Name</span>
                <span>{transaction.platform_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Transaction Type</span>
                <span>{getTypeBadge(transaction.transaction_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Betting User ID</span>
                <span>{transaction.betting_user_id || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">External Transaction ID</span>
                <span>{transaction.external_transaction_id || "N/A"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commission Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Commission Rate</span>
                <span>{transaction.commission_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Commission Amount</span>
                <span className="font-medium">${transaction.commission_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Commission Paid</span>
                <span>{transaction.commission_paid ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Paid At</span>
                <span>{transaction.commission_paid_at ? new Date(transaction.commission_paid_at).toLocaleString() : "Not paid"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partner Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Partner Balance Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Balance Before</Label>
                <div className="text-xl font-semibold">${transaction.partner_balance_before}</div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Balance After</Label>
                <div className="text-xl font-semibold">${transaction.partner_balance_after}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created</span>
              <span>{new Date(transaction.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Last Updated</span>
              <span>{new Date(transaction.updated_at).toLocaleString()}</span>
            </div>
            {transaction.cancellation_requested_at && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cancellation Requested</span>
                <span>{new Date(transaction.cancellation_requested_at).toLocaleString()}</span>
              </div>
            )}
            {transaction.cancelled_at && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Cancelled</span>
                <span>{new Date(transaction.cancelled_at).toLocaleString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* External Response */}
        {transaction.external_response && (
          <Card>
            <CardHeader>
              <CardTitle>External Platform Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(transaction.external_response, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {transaction.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{transaction.notes}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Cancellation Processing Dialog */}
      <AlertDialog open={pendingCancellation} onOpenChange={setPendingCancellation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Transaction Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to approve the cancellation of transaction <strong>{transaction?.reference}</strong>. 
              This will refund the partner and mark the transaction as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={cancellationNotes}
                onChange={(e) => setCancellationNotes(e.target.value)}
                placeholder="Add notes about the cancellation approval..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Transaction Information:</h4>
              <div className="text-sm text-red-800 dark:text-red-200 space-y-1">
                <div><strong>Amount:</strong> ${transaction?.amount}</div>
                <div><strong>Partner:</strong> {transaction?.partner_name}</div>
                <div><strong>Platform:</strong> {transaction?.platform_name}</div>
                <div><strong>Commission Loss:</strong> ${transaction?.commission_amount}</div>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessCancellation}
              disabled={processingCancellation}
              className="bg-red-600 hover:bg-red-700"
            >
              {processingCancellation ? "Processing..." : "Approve Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
