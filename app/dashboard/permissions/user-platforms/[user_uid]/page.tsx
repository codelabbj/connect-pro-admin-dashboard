"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useApi } from "@/lib/useApi"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { ArrowLeft, User, Shield, PieChart, TrendingUp, DollarSign } from "lucide-react"

export default function UserPlatformPermissionsPage() {
  const params = useParams()
  const router = useRouter()
  const apiFetch = useApi()
  const { toast } = useToast()
  
  const userUid = params.user_uid as string
  
  const [userInfo, setUserInfo] = useState<any | null>(null)
  const [commissionConfig, setCommissionConfig] = useState<any | null>(null)
  const [summary, setSummary] = useState<any | null>(null)
  const [platformsWithPermissions, setPlatformsWithPermissions] = useState<any[]>([])
  const [platformsWithoutPermissions, setPlatformsWithoutPermissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Fetch user platform permissions
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!userUid) return
      
      setLoading(true)
      setError("")
      
      try {
        const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")}/api/payments/betting/admin/permissions/user_platforms/?user_uid=${userUid}`
        const data = await apiFetch(endpoint)
        
        setUserInfo(data.user_info)
        setCommissionConfig(data.commission_config)
        setSummary(data.summary)
        setPlatformsWithPermissions(data.platforms_with_permissions || [])
        setPlatformsWithoutPermissions(data.platforms_without_permissions || [])
        // GET requests don't show success toasts automatically
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err)
        setError(errorMessage)
        toast({
          title: "Failed to load user permissions",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserPermissions()
  }, [userUid])

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    )
  }

  const getCommissionStatusBadge = (hasConfig: boolean) => {
    return (
      <Badge variant={hasConfig ? "default" : "outline"}>
        {hasConfig ? "Configured" : "Not Configured"}
      </Badge>
    )
  }

  const getPermissionBadge = (canDeposit: boolean, canWithdraw: boolean) => {
    if (canDeposit && canWithdraw) {
      return <Badge variant="default">Full Access</Badge>
    } else if (canDeposit) {
      return <Badge variant="outline">Deposit Only</Badge>
    } else if (canWithdraw) {
      return <Badge variant="outline">Withdraw Only</Badge>
    } else {
      return <Badge variant="secondary">No Access</Badge>
    }
  }

  const calculateTotalTransactionAmount = (stats: any) => {
    return (stats.total_transactions || 0) > 0 ? stats.total_amount || 0 : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">Loading user permissions...</span>
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay error={error} variant="full" showDismiss={false} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/permissions/list")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Permissions
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Platform Permissions</h1>
            <p className="text-muted-foreground">Comprehensive view of platform access and transaction data</p>
          </div>
        </div>
      </div>

      {/* User Information */}
      {userInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Display Name</div>
                <div className="text-lg font-semibold">{userInfo.display_name}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div className="text-lg">{userInfo.email || "Not provided"}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">UID</div>
                <div className="text-lg font-mono">{userInfo.uid}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div>{getStatusBadge(userInfo.is_active)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Partner Status</div>
                <div>{getStatusBadge(userInfo.is_partner)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commission Configuration */}
      {commissionConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Commission Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Configuration Status</div>
                <div>{getCommissionStatusBadge(commissionConfig.has_config)}</div>
              </div>
              {commissionConfig.has_config && (
                <>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Deposit Rate</div>
                    <div className="text-lg font-semibold">{commissionConfig.deposit_commission_rate}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Withdrawal Rate</div>
                    <div className="text-lg font-semibold">{commissionConfig.withdrawal_commission_rate}%</div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
                <div className="text-sm">{commissionConfig.updated_at ? new Date(commissionConfig.updated_at).toLocaleString() : "Never"}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Updated By</div>
                <div className="text-sm">{commissionConfig.updated_by_name || "Unknown"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permission Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Permission Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm font-medium text-blue-600 mb-1">Total Platforms</div>
                <div className="text-2xl font-bold text-blue-600">{summary.total_platforms}</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm font-medium text-green-600 mb-1">With Permissions</div>
                <div className="text-2xl font-bold text-green-600">{summary.platforms_with_permissions}</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-sm font-medium text-orange-600 mb-1">Active Permissions</div>
                <div className="text-2xl font-bold text-orange-600">{summary.active_permissions}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm font-medium text-red-600 mb-1">No Permissions</div>
                <div className="text-2xl font-bold text-red-600">{summary.platforms_without_permissions}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platforms with Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Platforms with Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {platformsWithPermissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No platform permissions found for this user
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction Stats</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Granted By</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformsWithPermissions.map((platform) => (
                    <TableRow key={platform.uid}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{platform.platform_name}</div>
                          <div className="text-xs text-muted-foreground">UID: {platform.platform_uid.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>{getPermissionBadge(platform.can_deposit, platform.can_withdraw)}</TableCell>
                      <TableCell>{getStatusBadge(platform.is_active)}</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>Total: {platform.transaction_stats.total_transactions}</div>
                          <div>Success: {platform.transaction_stats.successful_transactions}</div>
                          <div>Amount: ${platform.transaction_stats.total_amount}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>Total: ${platform.transaction_stats.total_commission}</div>
                          <div className={platform.transaction_stats.unpaid_commission > 0 ? "text-red-600" : ""}>
                            Unpaid: ${platform.transaction_stats.unpaid_commission}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{platform.granted_by_name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(platform.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Platforms (no permissions) */}
      {platformsWithoutPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Available Platforms (No Permissions Yet)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Platform Info</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformsWithoutPermissions.map((platform) => (
                    <TableRow key={platform.platform_uid}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{platform.platform_name}</div>
                          <div className="text-xs text-muted-foreground">UID: {platform.platform_uid.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>Status: {getStatusBadge(platform.platform_is_active)}</div>
                          <div>External ID: {platform.platform_external_id.slice(0, 8)}...</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          <div>Deposit: ${platform.min_deposit_amount} - ${platform.max_deposit_amount}</div>
                          <div>Withdraw: ${platform.min_withdrawal_amount} - ${platform.max_withdrawal_amount}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/permissions/create?partner=${userUid}&platform=${platform.platform_uid}`)}
                        >
                          Grant Permission
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
