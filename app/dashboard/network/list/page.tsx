"use client"
import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ArrowUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"


const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function NetworkListPage() {
  const [networks, setNetworks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [countries, setCountries] = useState<any[]>([])
  const [sortField, setSortField] = useState<"nom" | "code" | null>(null)
  const [sortDirection, setSortDirection] = useState<"+" | "-">("-")
  const apiFetch = useApi()
  const { t } = useLanguage()
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1)
  

  useEffect(() => {
    const fetchNetworks = async () => {
      setLoading(true)
      setError("")
      try {
        let endpoint = "";
        if (searchTerm.trim() !== "" || statusFilter !== "all" || countryFilter !== "all" || sortField) {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          if (searchTerm.trim() !== "") {
            params.append("search", searchTerm);
          }
          if (statusFilter !== "all") {
            params.append("is_active", statusFilter === "active" ? "true" : "false");
          }
          if (countryFilter !== "all") {
            params.append("country", countryFilter);
          }
          if (sortField) {
            params.append("ordering", `${sortDirection === "+" ? "+" : "-"}${sortField}`);
          }
          const query = params.toString().replace(/ordering=%2B/g, "ordering=+");
          endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/networks/?${query}`;
        } else {
          const params = new URLSearchParams({
            page: "1",
            page_size: "100",
          });
          endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/networks/?${params.toString()}`;
        }
        const data = await apiFetch(endpoint)
        setNetworks(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("network.success"),
          description: t("network.loadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("network.failedToLoad")
        setError(errorMessage)
        setNetworks([])
        toast({
          title: t("network.failedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
        console.error('Networks fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchNetworks()
  }, [searchTerm, statusFilter, countryFilter, sortField, sortDirection])

  // Fetch countries for filter
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/countries/`)
        setCountries(Array.isArray(data) ? data : data.results || [])
        toast({
          title: t("network.countriesLoaded"),
          description: t("network.countriesLoadedSuccessfully"),
        })
      } catch (err: any) {
        const errorMessage = extractErrorMessages(err) || t("network.failedToLoadCountries")
        console.error('Countries fetch error:', err)
        setCountries([])
        toast({
          title: t("network.countriesFailedToLoad"),
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
    
    fetchCountries()
  }, [])

  // Remove client-side filtering since it's now handled by the API
  const filteredNetworks = networks

  const handleSort = (field: "nom" | "code") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "+" ? "-" : "+"))
      setSortField(field)
    } else {
      setSortField(field)
      setSortDirection("-")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("network.list")}</CardTitle>
        <Link href="/dashboard/network/create"><Button className="mt-2">{t("network.add")}</Button></Link>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder={t("network.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              <SelectItem value="active">{t("network.active")}</SelectItem>
              <SelectItem value="inactive">{t("network.inactive")}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={countryFilter}
            onValueChange={setCountryFilter}
            disabled={loading || countries.length === 0}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label={t("network.country")}> 
              <SelectValue placeholder={loading ? t("common.loading") : t("network.country")} />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="loading" disabled>{t("common.loading")}</SelectItem>
              ) : countries.length === 0 ? (
                <SelectItem value="no-countries" disabled>{t("network.noCountries") || "No countries available"}</SelectItem>
              ) : (
                [<SelectItem value="all" key="all">{t("common.all")}</SelectItem>,
                  ...countries.map((country: any) => (
                    <SelectItem key={country.uid} value={country.uid}>
                      {country.nom}
                    </SelectItem>
                  ))
                ]
              )}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : error ? (
          <ErrorDisplay
            error={error}
            onRetry={() => {
              setError("")
              // This will trigger the useEffect to refetch
            }}
            variant="inline"
            className="mb-6"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button type="button" variant="ghost" onClick={() => handleSort("nom")} className="h-auto p-0 font-semibold">
                    {t("network.name")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button type="button" variant="ghost" onClick={() => handleSort("code")} className="h-auto p-0 font-semibold">
                    {t("network.code")}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>{t("network.country")}</TableHead>
                <TableHead>{t("network.status")}</TableHead>
                <TableHead>{t("network.sentDepositToModule") || "Sent deposit to module"}</TableHead>
                <TableHead>{t("network.sentWithdrawalToModule") || "Sent withdrawal to module"}</TableHead>
                <TableHead>{t("network.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNetworks.map((network: any) => (
                <TableRow key={network.uid}>
                  <TableCell>{network.nom}</TableCell>
                  <TableCell>{network.code}</TableCell>
                  <TableCell>{network.country_name || network.country}</TableCell>
                  <TableCell>{network.is_active ? t("network.active") : t("network.inactive")}</TableCell>
                  <TableCell>
                    {network.sent_deposit_to_module ? (
                      <img src="/icon-yes.svg" alt="Yes" className="h-4 w-4" />
                    ) : (
                      <img src="/icon-no.svg" alt="No" className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell>
                    {network.sent_withdrawal_to_module ? (
                      <img src="/icon-yes.svg" alt="Yes" className="h-4 w-4" />
                    ) : (
                      <img src="/icon-no.svg" alt="No" className="h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/network/edit/${network.uid}`}><Button size="sm">{t("network.editButton")}</Button></Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
} 