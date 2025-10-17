"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Check } from "lucide-react"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

interface Partner {
  uid: string
  display_name?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  is_active?: boolean
}

interface PartnerSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (partner: Partner) => void
  selectedPartnerUid?: string
}

export function PartnerSelectionModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedPartnerUid 
}: PartnerSelectionModalProps) {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([])

  const apiFetch = useApi()
  const { t } = useLanguage()

  useEffect(() => {
    if (isOpen) {
      fetchPartners()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPartners(partners)
    } else {
      const filtered = partners.filter(partner => {
        const displayName = partner.display_name || `${partner.first_name || ""} ${partner.last_name || ""}`.trim()
        return displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               partner.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               partner.phone?.includes(searchTerm) ||
               partner.uid.toLowerCase().includes(searchTerm.toLowerCase())
      })
      setFilteredPartners(filtered)
    }
  }, [searchTerm, partners])

  const fetchPartners = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams({
        page: "1",
        page_size: "100",
      })
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/?${params.toString()}`
      const data = await apiFetch(endpoint)
      
      // Handle the response structure from the partner page
      const partnersData = data.partners || data.results || data
      setPartners(Array.isArray(partnersData) ? partnersData : [])
    } catch (err: any) {
      console.error('Partners fetch error:', err)
      const errorMessage = extractErrorMessages(err) || "Failed to load partners"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (partner: Partner) => {
    onSelect(partner)
    // Don't close automatically - let user complete the form
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] w-[95vw] sm:w-full mx-4">
        <DialogHeader>
          <DialogTitle>{t("deviceAuthorizations.selectPartner") || "Select Partner"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("common.search") || "Search partners..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Error Display */}
          {error && (
            <ErrorDisplay
              error={error}
              onRetry={fetchPartners}
              variant="inline"
              className="mb-4"
            />
          )}

          {/* Partners List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                {t("common.loading") || "Loading partners..."}
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? "No partners found matching your search." : "No partners available."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.uid}
                    className={`p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedPartnerUid === partner.uid ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => handleSelect(partner)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{partner.display_name || `${partner.first_name || ""} ${partner.last_name || ""}`.trim()}</div>
                        {partner.email && (
                          <div className="text-sm text-gray-500 truncate">{partner.email}</div>
                        )}
                        {partner.phone && (
                          <div className="text-sm text-gray-500 truncate">{partner.phone}</div>
                        )}
                        <div className="text-xs text-gray-400 font-mono mt-1 truncate">ID: {partner.uid}</div>
                      </div>
                      {selectedPartnerUid === partner.uid && (
                        <Check className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={onClose} className="w-full sm:w-auto">
              {t("common.done") || "Done"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
