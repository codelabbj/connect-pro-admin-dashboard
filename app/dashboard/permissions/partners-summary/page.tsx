"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, Users, PieChart, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useApi } from "@/lib/useApi"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import Link from "next/link"

export default function PartnersPermissionsSummaryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [partners, setPartners] = useState<any[]>([])
  const [totalPartners, setTotalPartners] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedPartner, setSelectedPartner] = useState<any | null>(null)
  
  const { t } = useLanguage()
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  const { toast } = useToast()
  const apiFetch = useApi()
  
  // Modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Fetch all partners permissions summary
  useEffect(() => {
    const fetchPartnersSummary = async () => {
      setLoading(true)
      setError("")
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/permissions/user_platforms_summary/`
        const data = await apiFetch(endpoint)
        
        let filteredPartners = data.partners || []
        
        // Apply search filter
        if (searchTerm.trim() !== "") {
          filteredPartners = filteredPartners.filter((partner: any) =>
            (partner.display_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (partner.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (partner.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (partner.last_name || "").toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        
        setPartners(filteredPartners)
        setTotalPartners(data.total_partners || 0)
        
        toast({
          title: "Partners summary loaded",
          description: "Partners permissions summary loaded successfully",
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        setPartners([])
        setTotalPartners(0)
        toast({
          title: "Failed to load partners summary",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchPartnersSummary()
  }, [searchTerm])

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  const getPermissionBadge = (totalPermissions: number, activePermissions: number) => {
    const ratio = totalPermissions > 0 ? activePermissions / totalPermissions : 0
    
    if (ratio === 0) return <Badge variant="secondary">No Permissions</Badge>
    if (ratio === 1) return <Badge variant="default">All Active</Badge>
    return <Badge variant="outline">Partial</Badge>
  }

  const getCommissionBadge = (totalCommission: number, unpaidCommission: number) => {
    if (unpaidCommission === 0) return <Badge variant="default">All Paid</Badge>
    if (unpaidCommission === totalCommission) return <Badge variant="destructive">All Unpaid</Badge>
    return <Badge variant="outline">Partial Unpaid</Badge>
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const calculateCommissionPercentage = (totalCommission: number, unpaidCommission: number) => {
    if (totalCommission === 0) return "0%"
    return `${((unpaidCommission / totalCommission) * 100).toFixed(1)}%`
  }

  // Open partner details
  const handleOpenDetail = (partner: any) => {
    setSelectedPartner(partner)
    setDetailModalOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Partners Permissions Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Global Statistics */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Partners</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{totalPartners}</div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Active Partners</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {partners.filter(p => p.is_active).length}
                </div>
              </div>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Partner Permissions</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {partners.reduce((sum, p) => sum + p.permission_summary.total_permissions, 0)}
                </div>
              </div>
              
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Unpaid Commission</span>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(partners.reduce((sum, p) => sum + p.transaction_summary.unpaid_commission, 0))}
                </div>
              </div>
            </div>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search partners... (name, email)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Partners Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : error ? (
              <ErrorDisplay
                error={error}
                onRetry={() => {
                  setError("")
                }}
                variant="full"
                showDismiss={false}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Transaction Stats</TableHead>
                    <TableHead>Commission Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.user_uid}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{partner.display_name}</div>
                          <div className="text-sm text-muted-foreground">{partner.email || "No email"}</div>
                          <div className="text-xs text-muted-foreground">UID: {partner.user_uid.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(partner.is_active)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{getPermissionBadge(partner.permission_summary.total_permissions, partner.permission_summary.active_permissions)}</div>
                          <div className="text-xs text-muted-foreground">
                            {partner.permission_summary.total_permissions} total, {partner.permission_summary.active_permissions} active
                          </div>
                          <div className="text-xs text-muted-foreground">
                            D: {partner.permission_summary.deposit_permissions} W: {partner.permission_summary.withdrawal_permissions}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {partner.transaction_summary.total_transactions} transactions
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {partner.transaction_summary.successful_transactions} successful
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total volume: {formatCurrency(partner.transaction_summary.total_commission)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{getCommissionBadge(partner.transaction_summary.total_commission, partner.transaction_summary.unpaid_commission)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(partner.transaction_summary.unpaid_commission)} unpaid
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {calculateCommissionPercentage(partner.transaction_summary.total_commission, partner.transaction_summary.unpaid_commission)} unpaid
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(partner)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Results Summary */}
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {partners.length} of {totalPartners} partners
          </div>
        </CardContent>
      </Card>

      {/* Partner Details Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partner Detailed Information</DialogTitle>
          </DialogHeader>
          {selectedPartner ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div><strong>Display Name:</strong> {selectedPartner.display_name}</div>
                  <div><strong>Email:</strong> {selectedPartner.email || "Not provided"}</div>
                  <div><strong>First Name:</strong> {selectedPartner.first_name || "Not provided"}</div>
                </div>
                <div className="space-y-2">
                  <div><strong>Last Name:</strong> {selectedPartner.last_name || "Not provided"}</div>
                  <div><strong>UID:</strong> <code>{selectedPartner.user_uid}</code></div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedPartner.is_active)}</div>
                </div>
              </div>

              {/* Permission Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Permission Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-600">Total Permissions</div>
                    <div className="text-xl font-bold text-blue-600">{selectedPartner.permission_summary.total_permissions}</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium text-green-600">Active Permissions</div>
                    <div className="text-xl font-bold text-green-600">{selectedPartner.permission_summary.active_permissions}</div>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-sm font-medium text-orange-600">Deposit Permissions</div>
                    <div className="text-xl font-bold text-orange-600">{selectedPartner.permission_summary.deposit_permissions}</div>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-sm font-medium text-purple-600">Withdrawal Permissions</div>
                    <div className="text-xl font-bold text-purple-600">{selectedPartner.permission_summary.withdrawal_permissions}</div>
                  </div>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Transaction Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 mb-2">Transaction Counts</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Total Transactions:</span>
                        <span className="font-medium">{selectedPartner.transaction_summary.total_transactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Successful Transactions:</span>
                        <span className="font-medium">{selectedPartner.transaction_summary.successful_transactions}</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                    <div className="text-sm font-medium text-gray-600 mb-2">Commission Information</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Total Commission:</span>
                        <span className="font-medium">{formatCurrency(selectedPartner.transaction_summary.total_commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Unpaid Commission:</span>
                        <span className="font-medium text-red-600">{formatCurrency(selectedPartner.transaction_summary.unpaid_commission)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid Commission:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(selectedPartner.transaction_summary.total_commission - selectedPartner.transaction_summary.unpaid_commission)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button asChild>
                  <Link href={`/dashboard/permissions/user-platforms/${selectedPartner.user_uid}`}>
                    View Platform Permissions
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/commission-config/edit/${selectedPartner.user_uid}`}>
                    Edit Commission Config
                  </Link>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
