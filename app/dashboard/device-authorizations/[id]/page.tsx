"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, ToggleLeft, ToggleRight, Loader } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function DeviceAuthorizationDetailPage() {
  const [authorization, setAuthorization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    is_active: true,
    notes: ""
  })

  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const authorizationId = params.id as string

  useEffect(() => {
    if (authorizationId) {
      fetchAuthorization()
    }
  }, [authorizationId])

  const fetchAuthorization = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiFetch(`${baseUrl}api/payments/betting/admin/device-authorizations/${authorizationId}/`)
      console.log('Device Authorization API response:', data)
      setAuthorization(data)
      setFormData({
        is_active: data.is_active,
        notes: data.notes || ""
      })
    } catch (err: any) {
      console.error('Device Authorization fetch error:', err)
      // Show the full error object to user in error display
      const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToLoad")
      const fullErrorDetails = JSON.stringify(err, null, 2)
      
      setError(`${errorMessage}\n\nFull Error Details:\n${fullErrorDetails}`)
      toast({
        title: t("deviceAuthorizations.failedToLoad"),
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!authorization) return
    
    try {
      setSaving(true)
      const response = await apiFetch(`${baseUrl}api/payments/betting/admin/device-authorizations/${authorization.uid}/`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_active: formData.is_active,
          notes: formData.notes
        })
      })
      
      toast({
        title: t("deviceAuthorizations.success"),
        description: t("deviceAuthorizations.updatedSuccessfully"),
      })
      
      // Update local state
      setAuthorization({
        ...authorization,
        is_active: formData.is_active,
        notes: formData.notes
      })
    } catch (err: any) {
      console.error('Update authorization error:', err)
      // Show the full error object to user in error display
      const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToUpdate")
      const fullErrorDetails = JSON.stringify(err, null, 2)
      
      setError(`${errorMessage}\n\nFull Error Details:\n${fullErrorDetails}`)
      
      toast({
        title: t("deviceAuthorizations.failedToUpdate"),
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!authorization) return
    
    try {
      setToggleLoading(true)
      const response = await apiFetch(`${baseUrl}api/payments/betting/admin/device-authorizations/${authorization.uid}/toggle_active/`, {
        method: 'POST',
        body: JSON.stringify({
          is_active: !authorization.is_active,
          notes: formData.notes || ""
        })
      })
      
      toast({
        title: t("deviceAuthorizations.success"),
        description: t("deviceAuthorizations.toggledSuccessfully"),
      })
      
      // Update local state
      const newActiveState = !authorization.is_active
      setAuthorization({
        ...authorization,
        is_active: newActiveState
      })
      setFormData({
        ...formData,
        is_active: newActiveState
      })
    } catch (err: any) {
      console.error('Toggle authorization error:', err)
      // Show the full error object to user in error display
      const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToToggle")
      const fullErrorDetails = JSON.stringify(err, null, 2)
      
      setError(`${errorMessage}\n\nFull Error Details:\n${fullErrorDetails}`)
      
      toast({
        title: t("deviceAuthorizations.failedToToggle"),
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setToggleLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/dashboard/device-authorizations')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader className="animate-spin h-6 w-6" />
          <span className="text-lg font-semibold">{t("common.loading")}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchAuthorization}
        variant="full"
        showDismiss={false}
      />
    )
  }

  if (!authorization) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t("deviceAuthorizations.notFound") || "Device authorization not found"}</p>
        <Button onClick={handleBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("common.back") || "Back"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back") || "Back"}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("deviceAuthorizations.detail") || "YapsonPress Device Authorization Detail"}</h1>
            <p className="text-gray-600 dark:text-gray-400">UID: {authorization.uid}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={authorization.is_active ? "default" : "secondary"}>
            {authorization.is_active ? t("common.active") : t("common.inactive")}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("deviceAuthorizations.information") || "Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("deviceAuthorizations.uid") || "UID"}
              </Label>
              <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {authorization.uid}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("deviceAuthorizations.partner") || "Partner"}
              </Label>
              <div className="mt-1">
                <p className="font-medium">{authorization.partner_name}</p>
                <p className="text-sm text-gray-500 font-mono">ID: {authorization.partner}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("deviceAuthorizations.originDevice") || "Origin Device"}
              </Label>
              <div className="mt-1">
                <p className="font-medium">{authorization.origin_device_display}</p>
                <p className="text-sm text-gray-500 font-mono">UID: {authorization.origin_device_uid}</p>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("deviceAuthorizations.createdAt") || "Created At"}
              </Label>
              <p className="mt-1">{new Date(authorization.created_at).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("deviceAuthorizations.edit") || "Edit Authorization"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="is_active">{t("deviceAuthorizations.isActive") || "Is Active"}</Label>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="text-sm">
                  {formData.is_active ? t("common.active") : t("common.inactive")}
                </Label>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes">{t("deviceAuthorizations.notes") || "Notes"}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t("deviceAuthorizations.notesPlaceholder") || "Enter notes"}
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving") || "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("common.save") || "Save"}
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleToggleActive}
                disabled={toggleLoading}
                className="flex-1"
              >
                {toggleLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.toggling") || "Toggling..."}
                  </>
                ) : authorization.is_active ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    {t("deviceAuthorizations.deactivate") || "Deactivate"}
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    {t("deviceAuthorizations.activate") || "Activate"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log Card (if needed) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("deviceAuthorizations.activityLog") || "Activity Log"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            <p><strong>{t("deviceAuthorizations.createdAt") || "Created"}:</strong> {new Date(authorization.created_at).toLocaleString()}</p>
            <p><strong>{t("deviceAuthorizations.lastModified") || "Last Modified"}:</strong> {new Date(authorization.created_at).toLocaleString()}</p>
            <p><strong>{t("deviceAuthorizations.currentStatus") || "Current Status"}:</strong> 
              <Badge variant={authorization.is_active ? "default" : "secondary"} className="ml-2">
                {authorization.is_active ? t("common.active") : t("common.inactive")}
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
