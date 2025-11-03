
"use client"

import { useState, useEffect } from "react"
import { useApi } from "@/lib/useApi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, MoreHorizontal, ShieldCheck, ToggleLeft, ToggleRight, Loader, Plus, TrendingUp, ArrowRightLeft, Wallet, DollarSign, CheckCircle, Clock, CreditCard, Users, Calendar, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DeviceSelectionModal } from "@/components/ui/device-selection-modal"
import Link from "next/link"


export default function PartnerPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [startDate, setStartDate] = useState("")
	const [endDate, setEndDate] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const [partners, setPartners] = useState<any[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [sortField, setSortField] = useState<"display_name" | "email" | "created_at" | null>(null)
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
	const { t } = useLanguage()
	const itemsPerPage = 20
	const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
	const { toast } = useToast()
	const apiFetch = useApi();
	const [detailModalOpen, setDetailModalOpen] = useState(false)
	const [detailPartner, setDetailPartner] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")
	
	// Device authorization states
	const [deviceAuthModalOpen, setDeviceAuthModalOpen] = useState(false)
	const [deviceAuthPartner, setDeviceAuthPartner] = useState<any | null>(null)
	const [deviceAuthorizations, setDeviceAuthorizations] = useState<any[]>([])
	const [deviceAuthLoading, setDeviceAuthLoading] = useState(false)
	const [deviceAuthError, setDeviceAuthError] = useState("")
	const [toggleLoading, setToggleLoading] = useState<string | null>(null)
	
	// Create authorization form states
	const [isCreateAuthDialogOpen, setIsCreateAuthDialogOpen] = useState(false)
	const [createAuthLoading, setCreateAuthLoading] = useState(false)
	const [createAuthError, setCreateAuthError] = useState("")
	const [createAuthFormData, setCreateAuthFormData] = useState({
		origin_device: "",
		is_active: true,
		notes: ""
	})

	// Device selection states
	const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false)
	const [selectedDevice, setSelectedDevice] = useState<any>(null)

	// Betting commission states
	const [bettingCommissionModalOpen, setBettingCommissionModalOpen] = useState(false)
	const [bettingCommissionPartner, setBettingCommissionPartner] = useState<any | null>(null)
	const [bettingCommissionConfig, setBettingCommissionConfig] = useState<any | null>(null)
	const [bettingCommissionLoading, setBettingCommissionLoading] = useState(false)
	const [bettingCommissionError, setBettingCommissionError] = useState("")
	const [bettingCommissionForm, setBettingCommissionForm] = useState({
		deposit_commission_rate: "",
		withdrawal_commission_rate: "",
	})
	const [bettingCommissionStats, setBettingCommissionStats] = useState<any | null>(null)
	const [partnerAccountInfo, setPartnerAccountInfo] = useState<any | null>(null)

	// Betting transfers states
	const [transfersModalOpen, setTransfersModalOpen] = useState(false)
	const [transfersPartner, setTransfersPartner] = useState<any | null>(null)
	const [transfers, setTransfers] = useState<any[]>([])
	const [transfersLoading, setTransfersLoading] = useState(false)

	// Betting commission payment states
	const [bettingCommissionPaymentModalOpen, setBettingCommissionPaymentModalOpen] = useState(false)
	const [bettingCommissionPaymentForm, setBettingCommissionPaymentForm] = useState({
		admin_notes: "",
	})
	const [bettingCommissionPaymentLoading, setBettingCommissionPaymentLoading] = useState(false)
	const [bettingCommissionPaymentError, setBettingCommissionPaymentError] = useState("")

	// Account transactions states
	const [accountTransactionsModalOpen, setAccountTransactionsModalOpen] = useState(false)
	const [accountTransactionsPartner, setAccountTransactionsPartner] = useState<any | null>(null)
	const [accountTransactions, setAccountTransactions] = useState<any[]>([])
	const [accountTransactionsUserInfo, setAccountTransactionsUserInfo] = useState<any | null>(null)
	const [accountTransactionsLoading, setAccountTransactionsLoading] = useState(false)
	const [accountTransactionsError, setAccountTransactionsError] = useState("")
	const [accountTransactionsPage, setAccountTransactionsPage] = useState(1)
	const [accountTransactionsTotalCount, setAccountTransactionsTotalCount] = useState(0)
	const [accountTransactionsNextPage, setAccountTransactionsNextPage] = useState<string | null>(null)
	const [accountTransactionsPrevPage, setAccountTransactionsPrevPage] = useState<string | null>(null)

	// Fetch partners from API (authenticated)
	useEffect(() => {
		const fetchPartners = async () => {
			setLoading(true)
			setError("")
			try {
				const params = new URLSearchParams({
					page: currentPage.toString(),
					page_size: itemsPerPage.toString(),
				})
				if (searchTerm.trim() !== "") {
					params.append("search", searchTerm)
				}
			if (statusFilter !== "all") {
				params.append("is_active", statusFilter === "active" ? "true" : "false")
			}
			if (startDate) {
				params.append("created_at__gte", startDate)
			}
			if (endDate) {
				// Add one day to end date to include the entire end date
				const endDateObj = new Date(endDate)
				endDateObj.setDate(endDateObj.getDate() + 1)
				params.append("created_at__lt", endDateObj.toISOString().split('T')[0])
			}
			const orderingParam = sortField
				? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${sortField}`
				: ""
				const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/?${params.toString()}${orderingParam}`
				const data = await apiFetch(endpoint)
				setPartners(data.partners || [])
				setTotalCount(data.pagination?.total_count || 0)
				setTotalPages(data.pagination?.total_pages || 1)
				// GET requests don't show success toasts automatically
			} catch (err: any) {
				const errorMessage = extractErrorMessages(err)
				setError(errorMessage)
				setPartners([])
				setTotalCount(0)
				setTotalPages(1)
				toast({ title: t("partners.failedToLoad"), description: errorMessage, variant: "destructive" })
			} finally {
				setLoading(false)
			}
		}
		fetchPartners()
	}, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, startDate, endDate, sortField, sortDirection, t, toast, apiFetch])

	const startIndex = (currentPage - 1) * itemsPerPage

	const handleSort = (field: "display_name" | "email" | "created_at") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("desc")
		}
	}

	// Fetch partner details (authenticated)
	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailPartner(null)
		try {
			const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/${uid}/`
			const data = await apiFetch(endpoint)
			setDetailPartner(data)
			// GET requests don't show success toasts automatically
		} catch (err: any) {
			setDetailError(extractErrorMessages(err))
			toast({ title: t("partners.detailFailed"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setDetailLoading(false)
		}
	}

	const handleCloseDetail = () => {
		setDetailModalOpen(false)
		setDetailPartner(null)
		setDetailError("")
	}

	// Device authorization functions
	const handleOpenDeviceAuth = async (partner: any) => {
		setDeviceAuthModalOpen(true)
		setDeviceAuthLoading(true)
		setDeviceAuthError("")
		setDeviceAuthPartner(partner)
		setDeviceAuthorizations([])
		try {
			const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/device-authorizations/by_partner/?partner_id=${partner.uid}`
			const data = await apiFetch(endpoint)
			setDeviceAuthorizations(Array.isArray(data) ? data : data.results || [])
			toast({ 
				title: t("deviceAuthorizations.success"), 
				description: t("deviceAuthorizations.loadedSuccessfully") 
			})
		} catch (err: any) {
			const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToLoad")
			setDeviceAuthError(errorMessage)
			setDeviceAuthorizations([])
			toast({ 
				title: t("deviceAuthorizations.failedToLoad"), 
				description: errorMessage, 
				variant: "destructive" 
			})
		} finally {
			setDeviceAuthLoading(false)
		}
	}

	const handleCloseDeviceAuth = () => {
		setDeviceAuthModalOpen(false)
		setDeviceAuthPartner(null)
		setDeviceAuthorizations([])
		setDeviceAuthError("")
	}

	const handleToggleAuthorization = async (authorization: any) => {
		try {
			setToggleLoading(authorization.uid)
			const response = await apiFetch(`${baseUrl}api/payments/betting/admin/device-authorizations/${authorization.uid}/toggle_active/`, {
				method: 'POST',
				body: JSON.stringify({
					is_active: !authorization.is_active,
					notes: authorization.notes || ""
				})
			})
			
			toast({
				title: t("deviceAuthorizations.success"),
				description: t("deviceAuthorizations.toggledSuccessfully"),
			})
			
			// Update local state
			setDeviceAuthorizations(prev => 
				prev.map(auth => 
					auth.uid === authorization.uid 
						? { ...auth, is_active: !auth.is_active }
						: auth
				)
			)
		} catch (err: any) {
			console.error('Toggle authorization error:', err)
			// Show the full error object to user in error display
			const errorMessage = extractErrorMessages(err) || t("deviceAuthorizations.failedToToggle")
			const fullErrorDetails = JSON.stringify(err, null, 2)
			
			// Set error state to show in UI
			setDeviceAuthError(`${errorMessage}\n\nFull Error Details:\n${fullErrorDetails}`)
			
			toast({
				title: t("deviceAuthorizations.failedToToggle"),
				description: errorMessage,
				variant: "destructive"
			})
		} finally {
			setToggleLoading(null)
		}
	}

	const handleCreateAuthorization = async () => {
		if (!deviceAuthPartner || !createAuthFormData.origin_device.trim()) {
			setCreateAuthError(t("deviceAuthorizations.originDevicePlaceholder") || "Origin device is required")
			return
		}

		try {
			setCreateAuthLoading(true)
			setCreateAuthError("") // Clear any previous errors
			
			const response = await apiFetch(`${baseUrl}api/payments/betting/admin/device-authorizations/`, {
				method: 'POST',
				body: JSON.stringify({
					partner: deviceAuthPartner.uid,
					origin_device: createAuthFormData.origin_device.trim(),
					is_active: createAuthFormData.is_active,
					notes: createAuthFormData.notes.trim()
				})
			})

			// Add the new authorization to the list
			setDeviceAuthorizations(prev => [response, ...prev])
			
			// Reset form
			setCreateAuthFormData({
				origin_device: "",
				is_active: true,
				notes: ""
			})
			setSelectedDevice(null)
			setIsCreateAuthDialogOpen(false)

			toast({
				title: t("deviceAuthorizations.success"),
				description: t("deviceAuthorizations.createdSuccessfully")
			})
		} catch (err: any) {
			console.error('Create authorization error:', err)
			// Show the full error object to user in modal error display
			const errorMessage = extractErrorMessages(err)
			const fullErrorDetails = JSON.stringify(err, null, 2)
			
			// Set error state to show in modal
			setCreateAuthError(`${errorMessage}\n\nFull Error Details:\n${fullErrorDetails}`)
			
			toast({
				title: t("deviceAuthorizations.failedToCreate"),
				description: errorMessage,
				variant: "destructive"
			})
		} finally {
			setCreateAuthLoading(false)
		}
	}

	const handleDeviceSelect = (device: any) => {
		setSelectedDevice(device)
		setCreateAuthFormData(prev => ({ ...prev, origin_device: device.uid }))
	}

	// Betting commission handlers
	const handleOpenBettingCommission = async (partner: any) => {
		setBettingCommissionModalOpen(true)
		setBettingCommissionLoading(true)
		setBettingCommissionError("")
		setBettingCommissionPartner(partner)
		setBettingCommissionConfig(null)
		setBettingCommissionStats(null)
		setPartnerAccountInfo(null)
		
		try {
			// Get partner commission config
			const configEndpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commission-configs/get_partner_config/?partner_uid=${partner.uid}`
			const configData = await apiFetch(configEndpoint)
			
			if (configData.success && configData.has_config) {
				setBettingCommissionConfig(configData.config)
				setPartnerAccountInfo(configData.account)
				setBettingCommissionForm({
					deposit_commission_rate: configData.config.deposit_commission_rate || "",
					withdrawal_commission_rate: configData.config.withdrawal_commission_rate || "",
				})
			} else {
				// Default values if no config exists
				setBettingCommissionForm({
					deposit_commission_rate: "2.00",
					withdrawal_commission_rate: "3.00",
				})
			}
			
			// Store account info even if no config exists
			if (configData.success && configData.account) {
				setPartnerAccountInfo(configData.account)
			}
			
			// Get partner-specific stats
			const statsEndpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/partner_commission_stats/?partner_uid=${partner.uid}`
			const statsData = await apiFetch(statsEndpoint)
			setBettingCommissionStats(statsData)
			// GET requests don't show success toasts automatically
		} catch (err: any) {
			setBettingCommissionError(extractErrorMessages(err))
			toast({ title: t("common.error"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setBettingCommissionLoading(false)
		}
	}

	const handleSaveBettingCommission = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!bettingCommissionPartner) return

		setBettingCommissionLoading(true)
		setBettingCommissionError("")
		
		try {
			const payload = {
				partner: bettingCommissionPartner.uid,
				deposit_commission_rate: bettingCommissionForm.deposit_commission_rate,
				withdrawal_commission_rate: bettingCommissionForm.withdrawal_commission_rate,
			}

			let endpoint, method
			if (bettingCommissionConfig) {
				// Update existing config
				endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commission-configs/${bettingCommissionConfig.uid}/`
				method = "PATCH"
			} else {
				// Create new config
				endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commission-configs/`
				method = "POST"
			}

			const data = await apiFetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			})

			setBettingCommissionConfig(data)
			toast({ 
				title: t("common.success"), 
				description: t("bettingCommission.configurationSaved") 
			})
		} catch (err: any) {
			setBettingCommissionError(extractErrorMessages(err))
			toast({ title: t("common.error"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setBettingCommissionLoading(false)
		}
	}

	const handleOpenTransfers = async (partner: any) => {
		setTransfersPartner(partner)
		setTransfersModalOpen(true)
		setTransfersLoading(true)
		setTransfers([])
		
		try {
			const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/partner-transfers/by_partner/?partner_uid=${partner.uid}`
			const data = await apiFetch(endpoint)
			setTransfers(Array.isArray(data) ? data : data.results || [])
		} catch (err: any) {
			toast({
				title: t("common.error"),
				description: extractErrorMessages(err),
				variant: "destructive",
			})
		} finally {
			setTransfersLoading(false)
		}
	}

	const handlePayBettingCommission = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!bettingCommissionPartner) return

		setBettingCommissionPaymentLoading(true)
		setBettingCommissionPaymentError("")
		
		try {
			const payload = {
				partner_uid: bettingCommissionPartner.uid,
				transaction_ids: null, // null = pay all unpaid commissions
				admin_notes: bettingCommissionPaymentForm.admin_notes,
			}

			const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/pay_commissions/`
			const data = await apiFetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			})

			toast({ 
				title: t("common.success"), 
				description: data.message || t("bettingCommission.paymentCompleted") 
			})
			
			setBettingCommissionPaymentModalOpen(false)
			setBettingCommissionPaymentForm({ admin_notes: "" })
			
			// Refresh partner-specific stats
			const statsEndpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/betting/admin/commissions/partner_commission_stats/?partner_uid=${bettingCommissionPartner.uid}`
			const statsData = await apiFetch(statsEndpoint)
			setBettingCommissionStats(statsData)
		} catch (err: any) {
			setBettingCommissionPaymentError(extractErrorMessages(err))
			toast({ title: t("common.error"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setBettingCommissionPaymentLoading(false)
		}
	}

	// Account transactions handlers
	const handleOpenAccountTransactions = async (partner: any) => {
		setAccountTransactionsPartner(partner)
		setAccountTransactionsModalOpen(true)
		setAccountTransactionsLoading(true)
		setAccountTransactionsError("")
		setAccountTransactions([])
		setAccountTransactionsUserInfo(null)
		setAccountTransactionsPage(1)
		setAccountTransactionsTotalCount(0)
		setAccountTransactionsNextPage(null)
		setAccountTransactionsPrevPage(null)
		
		try {
			const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/account-transactions/${partner.uid}/`
			const data = await apiFetch(endpoint)
			
			setAccountTransactions(data.results || [])
			setAccountTransactionsUserInfo(data.user_info || null)
			setAccountTransactionsTotalCount(data.count || 0)
			setAccountTransactionsNextPage(data.next || null)
			setAccountTransactionsPrevPage(data.previous || null)
			// GET requests don't show success toasts automatically
		} catch (err: any) {
			const errorMessage = extractErrorMessages(err)
			setAccountTransactionsError(errorMessage)
			toast({
				title: t("common.error") || "Error",
				description: errorMessage,
				variant: "destructive",
			})
		} finally {
			setAccountTransactionsLoading(false)
		}
	}

	const handleAccountTransactionsPageChange = async (pageUrl: string) => {
		if (!pageUrl) return
		
		setAccountTransactionsLoading(true)
		setAccountTransactionsError("")
		
		try {
			// Extract page number from URL or use direct URL
			const data = await apiFetch(pageUrl)
			
			setAccountTransactions(data.results || [])
			setAccountTransactionsTotalCount(data.count || 0)
			setAccountTransactionsNextPage(data.next || null)
			setAccountTransactionsPrevPage(data.previous || null)
			
			// Extract page number from URL for state
			const urlObj = new URL(pageUrl)
			const pageParam = urlObj.searchParams.get('page')
			if (pageParam) {
				setAccountTransactionsPage(parseInt(pageParam))
			}
			// GET requests don't show success toasts automatically
		} catch (err: any) {
			const errorMessage = extractErrorMessages(err)
			setAccountTransactionsError(errorMessage)
			toast({
				title: t("common.error") || "Error",
				description: errorMessage,
				variant: "destructive",
			})
		} finally {
			setAccountTransactionsLoading(false)
		}
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{t("partners.title")}</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Search & Filter */}
					<div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<Input
								placeholder={t("partners.search")}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue placeholder={t("partners.allStatuses")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("partners.allStatuses")}</SelectItem>
								<SelectItem value="active">{t("partners.active")}</SelectItem>
								<SelectItem value="inactive">{t("partners.inactive")}</SelectItem>
							</SelectContent>
				</Select>
			</div>
			
			{/* Date Filters */}
			<div className="flex flex-col lg:flex-row gap-4 mb-6">
				<div className="flex flex-col lg:flex-row gap-4 flex-1">
					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
							{t("partners.startDate") || "Start Date"}
						</label>
						<Input
							type="date"
							value={startDate}
							onChange={(e) => {
								setStartDate(e.target.value)
								setCurrentPage(1)
							}}
							className="w-full lg:w-48"
						/>
					</div>
					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
							{t("partners.endDate") || "End Date"}
						</label>
						<Input
							type="date"
							value={endDate}
							onChange={(e) => {
								setEndDate(e.target.value)
								setCurrentPage(1)
							}}
							className="w-full lg:w-48"
						/>
					</div>
				</div>
				<div className="flex items-end">
					<Button
						variant="outline"
						onClick={() => {
							setStartDate("")
							setEndDate("")
							setCurrentPage(1)
						}}
						className="h-10"
					>
						{t("partners.clearDates") || "Clear Dates"}
					</Button>
				</div>
			</div>

			{/* Table */}
					<div className="rounded-md border">
						{loading ? (
							<div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
						) : error ? (
							<ErrorDisplay
								error={error}
								onRetry={() => {
									setCurrentPage(1)
									setError("")
								}}
								variant="full"
								showDismiss={false}
							/>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("partners.uid")}</TableHead>
										<TableHead>
											<Button variant="ghost" onClick={() => handleSort("display_name")} className="h-auto p-0 font-semibold">
												{t("partners.name")}
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
										<TableHead>
											<Button variant="ghost" onClick={() => handleSort("email")} className="h-auto p-0 font-semibold">
												{t("partners.email")}
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
										<TableHead>{t("partners.phone")}</TableHead>
										<TableHead>{t("partners.status")}</TableHead>
										<TableHead>{t("partners.createdAt")}</TableHead>
										<TableHead>{t("commission.actions")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{partners.map((partner) => (
										<TableRow key={partner.uid}>
											<TableCell>{partner.uid}</TableCell>
											<TableCell className="font-medium">{partner.display_name || `${partner.first_name || ""} ${partner.last_name || ""}`}</TableCell>
											<TableCell>{partner.email}</TableCell>
											<TableCell>{partner.phone}</TableCell>
											<TableCell>
												{partner.is_active ? (
													<img src="/icon-yes.svg" alt="Active" className="h-4 w-4" />
												) : (
													<img src="/icon-no.svg" alt="Inactive" className="h-4 w-4" />
												)}
											</TableCell>
											<TableCell>{partner.created_at ? partner.created_at.split("T")[0] : "-"}</TableCell>
											{/* <TableCell>
												<Button size="sm" variant="secondary" onClick={() => window.location.assign(`/dashboard/partner/details/${partner.uid}`)}>
													{t("partners.details")}
												</Button>
											</TableCell> */}
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="outline" size="sm" className="h-8 w-8 p-0">
													<span className="sr-only">Ouvrir le menu</span>
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end" className="w-56">
												{/* Non-betting action */}
												<DropdownMenuItem asChild>
													<Link href={`/dashboard/partner/commission/${partner.uid}`} className="flex items-center">
														<DollarSign className="h-4 w-4 mr-2 text-green-600" />
														<span>Commission momo</span>
													</Link>
												</DropdownMenuItem>
												
												{/* Betting Commission Configuration */}
												<DropdownMenuItem onClick={() => handleOpenBettingCommission(partner)}>
													<TrendingUp className="h-4 w-4 mr-2 text-orange-600" />
													<span>{t("bettingCommission.partnersTitle")}</span>
												</DropdownMenuItem>
												
												{/* Betting Partner Transfers */}
												<DropdownMenuItem onClick={() => handleOpenTransfers(partner)}>
													<ArrowRightLeft className="h-4 w-4 mr-2 text-blue-600" />
													<span>{t("bettingCommission.transfers")}</span>
												</DropdownMenuItem>
												
												{/* Betting Commission Payment */}
												<DropdownMenuItem onClick={() => {
													setBettingCommissionPartner(partner)
													setBettingCommissionPaymentModalOpen(true)
												}}>
													<Wallet className="h-4 w-4 mr-2 text-emerald-600" />
													<span>{t("bettingCommission.payCommission")}</span>
												</DropdownMenuItem>

												{/* Device Authorizations */}
												<DropdownMenuItem onClick={() => handleOpenDeviceAuth(partner)}>
													<ShieldCheck className="h-4 w-4 mr-2" />
													<span>{t("deviceAuthorizations.viewAuthorizations") || "View YapsonPress Device Authorizations"}</span>
												</DropdownMenuItem>

												{/* Account Transactions */}
												<DropdownMenuItem onClick={() => handleOpenAccountTransactions(partner)}>
													<CreditCard className="h-4 w-4 mr-2 text-purple-600" />
													<span>{t("partners.viewAccountTransactions") || "View Account Transactions"}</span>
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between mt-6">
						<div className="text-sm text-muted-foreground">
							{`${t("partners.showingResults")}: ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalCount)} / ${totalCount}`}
						</div>
						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
								disabled={currentPage === 1}
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								{t("common.previous")}
							</Button>
							<div className="text-sm">
								{`${t("partners.pageOf")}: ${currentPage}/${totalPages}`}
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
								disabled={currentPage === totalPages}
							>
								{t("common.next")}
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Partner Details Modal */}
			<Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("partners.details")}</DialogTitle>
					</DialogHeader>
					{detailLoading ? (
						<div className="p-4 text-center">{t("common.loading")}</div>
					) : detailError ? (
						<ErrorDisplay
							error={detailError}
							variant="inline"
							showRetry={false}
							className="mb-4"
						/>
					) : detailPartner ? (
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<b>{t("partners.uid")}:</b> {detailPartner.uid}
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-5"
									onClick={() => {
										navigator.clipboard.writeText(detailPartner.uid)
										toast({ title: t("partners.copiedUid") || "UID copied!" })
									}}
									aria-label={t("partners.copyUid") || "Copy UID"}
								>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
							<div><b>{t("partners.name")}:</b> {detailPartner.display_name || `${detailPartner.first_name || ""} ${detailPartner.last_name || ""}`}</div>
							<div><b>{t("partners.email")}:</b> {detailPartner.email}</div>
							<div><b>{t("partners.phone")}:</b> {detailPartner.phone}</div>
							<div><b>{t("partners.status")}:</b> {detailPartner.is_active ? t("partners.active") : t("partners.inactive")}</div>
							<div><b>{t("partners.emailVerified")}:</b> {detailPartner.email_verified ? t("common.yes") : t("common.no")}</div>
							<div><b>{t("partners.phoneVerified")}:</b> {detailPartner.phone_verified ? t("common.yes") : t("common.no")}</div>
							<div><b>{t("partners.contactMethod")}:</b> {detailPartner.contact_method}</div>
							<div><b>{t("partners.createdAt")}:</b> {detailPartner.created_at ? detailPartner.created_at.split("T")[0] : "-"}</div>
							<div><b>{t("partners.lastLogin")}:</b> {detailPartner.last_login_at ? detailPartner.last_login_at.split("T")[0] : "-"}</div>
							<div><b>{t("partners.accountBalance")}:</b> {detailPartner.account_balance}</div>
							<div><b>{t("partners.accountIsActive")}:</b> {detailPartner.account_is_active ? t("common.yes") : t("common.no")}</div>
							<div><b>{t("partners.accountIsFrozen")}:</b> {detailPartner.account_is_frozen ? t("common.yes") : t("common.no")}</div>
							<div><b>{t("partners.totalTransactions")}:</b> {detailPartner.total_transactions}</div>
							<div><b>{t("partners.completedTransactions")}:</b> {detailPartner.completed_transactions}</div>
							<div><b>{t("partners.totalTransactionAmount")}:</b> {detailPartner.total_transaction_amount ?? "-"}</div>
							<div><b>{t("partners.totalCommissionsReceived")}:</b> {detailPartner.total_commissions_received ?? "-"}</div>
						</div>
					) : null}
					<DialogClose asChild>
						<Button className="mt-4 w-full">{t("common.close")}</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>

			{/* Device Authorization Modal */}
			<Dialog open={deviceAuthModalOpen} onOpenChange={(open) => { if (!open) handleCloseDeviceAuth() }}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<div className="flex justify-between items-center">
							<DialogTitle>
								{t("deviceAuthorizations.partnerAuthorizations") || "YapsonPress Device Authorizations"} - {deviceAuthPartner?.display_name || deviceAuthPartner?.email}
							</DialogTitle>
							<Dialog open={isCreateAuthDialogOpen} onOpenChange={setIsCreateAuthDialogOpen}>
								<DialogTrigger asChild>
									<Button size="sm">
										<Plus className="mr-2 h-4 w-4" />
										{t("deviceAuthorizations.create") || "Create Authorization"}
									</Button>
								</DialogTrigger>
							</Dialog>
						</div>
					</DialogHeader>
					{deviceAuthLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader className="animate-spin mr-2 h-6 w-6" />
							<span>{t("common.loading")}</span>
						</div>
					) : deviceAuthError ? (
						<ErrorDisplay
							error={deviceAuthError}
							variant="inline"
							showRetry={false}
							className="mb-4"
						/>
					) : deviceAuthorizations.length > 0 ? (
						<div className="space-y-4">
							<div className="text-sm text-gray-600 dark:text-gray-400">
								{t("deviceAuthorizations.totalAuthorizations") || "Total Authorizations"}: {deviceAuthorizations.length}
							</div>
							<div className="border rounded-lg">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("deviceAuthorizations.uid") || "UID"}</TableHead>
											<TableHead>{t("deviceAuthorizations.originDevice") || "Origin Device"}</TableHead>
											<TableHead>{t("deviceAuthorizations.status") || "Status"}</TableHead>
											<TableHead>{t("deviceAuthorizations.createdAt") || "Created At"}</TableHead>
											<TableHead>{t("deviceAuthorizations.notes") || "Notes"}</TableHead>
											<TableHead>{t("deviceAuthorizations.actions") || "Actions"}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{deviceAuthorizations.map((authorization: any) => (
											<TableRow key={authorization.uid}>
												<TableCell className="font-mono text-xs">{authorization.uid}</TableCell>
												<TableCell>
													<div>
														<div className="font-medium">{authorization.origin_device_display}</div>
														<div className="text-sm text-gray-500 font-mono">{authorization.origin_device_uid}</div>
													</div>
												</TableCell>
												<TableCell>
													<Badge variant={authorization.is_active ? "default" : "secondary"}>
														{authorization.is_active ? t("common.active") : t("common.inactive")}
													</Badge>
												</TableCell>
												<TableCell>{new Date(authorization.created_at).toLocaleString()}</TableCell>
												<TableCell className="max-w-xs truncate">{authorization.notes || "-"}</TableCell>
												<TableCell>
													<Button
														variant="outline"
														size="sm"
														onClick={() => handleToggleAuthorization(authorization)}
														disabled={toggleLoading === authorization.uid}
													>
														{toggleLoading === authorization.uid ? (
															<Loader className="h-4 w-4 animate-spin" />
														) : authorization.is_active ? (
															<ToggleLeft className="h-4 w-4" />
														) : (
															<ToggleRight className="h-4 w-4" />
														)}
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">
							<ShieldCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
							<p>{t("deviceAuthorizations.noAuthorizations") || "No device authorizations found for this partner."}</p>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={handleCloseDeviceAuth}>
							{t("common.close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Create Authorization Form Dialog */}
			<Dialog open={isCreateAuthDialogOpen} onOpenChange={(open) => {
				setIsCreateAuthDialogOpen(open)
				if (!open) {
					setCreateAuthError("") // Clear error when modal is closed
				}
			}}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>
							{t("deviceAuthorizations.create") || "Create YapsonPress Authorization"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{createAuthError && (
							<ErrorDisplay
								error={createAuthError}
								variant="inline"
								showRetry={false}
								showDismiss={true}
								onDismiss={() => setCreateAuthError("")}
								className="mb-4"
							/>
						)}
						<div>
							<Label htmlFor="origin_device">
								{t("deviceAuthorizations.originDevice") || "Origin Device"} *
							</Label>
							<div className="flex gap-2">
								<Input
									id="origin_device"
									value={selectedDevice ? (selectedDevice.device_name || selectedDevice.name || `Device ${selectedDevice.uid?.slice(0, 8)}...`) : createAuthFormData.origin_device}
									placeholder={t("deviceAuthorizations.originDevicePlaceholder") || "Select a device"}
									readOnly
									className="flex-1 mt-1"
								/>
								<Button
									type="button"
									variant="outline"
									onClick={() => setIsDeviceModalOpen(true)}
									className="mt-1"
								>
									{t("common.select") || "Select"}
								</Button>
							</div>
							{selectedDevice && (
								<div className="text-xs text-gray-500 mt-1">
									UID: {selectedDevice.uid}
								</div>
							)}
						</div>
						<div>
							<Label htmlFor="notes">
								{t("deviceAuthorizations.notes") || "Notes"}
							</Label>
							<Textarea
								id="notes"
								value={createAuthFormData.notes}
								onChange={(e) => setCreateAuthFormData(prev => ({ ...prev, notes: e.target.value }))}
								placeholder={t("deviceAuthorizations.notesPlaceholder") || "Enter notes"}
								className="mt-1"
								rows={3}
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Switch
								id="is_active"
								checked={createAuthFormData.is_active}
								onCheckedChange={(checked) => setCreateAuthFormData(prev => ({ ...prev, is_active: checked }))}
							/>
							<Label htmlFor="is_active">
								{t("deviceAuthorizations.isActive") || "Is Active"}
							</Label>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsCreateAuthDialogOpen(false)}>
							{t("common.cancel")}
						</Button>
						<Button 
							onClick={handleCreateAuthorization}
							disabled={createAuthLoading || !createAuthFormData.origin_device.trim()}
						>
							{createAuthLoading ? (
								<>
									<Loader className="mr-2 h-4 w-4 animate-spin" />
									{t("common.creating") || "Creating..."}
								</>
							) : (
								t("deviceAuthorizations.create") || "Create Authorization"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Device Selection Modal */}
			<DeviceSelectionModal
				isOpen={isDeviceModalOpen}
				onClose={() => setIsDeviceModalOpen(false)}
				onSelect={handleDeviceSelect}
				selectedDeviceUid={selectedDevice?.uid}
			/>

			{/* Betting Commission Configuration Modal */}
			<Dialog open={bettingCommissionModalOpen} onOpenChange={setBettingCommissionModalOpen}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("bettingCommission.title")} - {bettingCommissionPartner?.display_name || bettingCommissionPartner?.email || t("bettingCommission.partner")}</DialogTitle>
					</DialogHeader>
					
					{bettingCommissionLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader className="animate-spin mr-2 h-6 w-6" />
							<span>{t("common.loading")}</span>
						</div>
					) : bettingCommissionError ? (
						<ErrorDisplay error={bettingCommissionError} variant="inline" className="mb-4" />
					) : (
						<div className="space-y-4">
							{/* Partner Balance */}
							{partnerAccountInfo && (
								<div className="p-4 bg-muted rounded-lg">
									<div className="flex items-center gap-2">
										<Wallet className="h-5 w-5 text-green-600" />
										<div>
											<span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t("bettingCommission.partnerBalance")}:</span>
											<p className="text-xl font-bold">{partnerAccountInfo.formatted_balance || `${partnerAccountInfo.balance || 0} XOF`}</p>
										</div>
									</div>
								</div>
							)}

							{/* Commission Statistics */}
							{bettingCommissionStats && bettingCommissionStats.commissions && (
								<div className="space-y-4">
									<h3 className="font-semibold">{t("bettingCommission.commissionStatistics")}</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div><b>{t("bettingCommission.totalTransactionsLabel")}:</b> {bettingCommissionStats.commissions.total_transaction_count || 0}</div>
										<div><b>{t("bettingCommission.totalEarned")}:</b> XOF {parseFloat(bettingCommissionStats.commissions.total_earned || 0).toFixed(2)}</div>
										<div><b>{t("bettingCommission.commissionPaid")}:</b> XOF {parseFloat(bettingCommissionStats.commissions.total_paid || 0).toFixed(2)}</div>
										<div><b>{t("bettingCommission.commissionUnpaid")}:</b> XOF {parseFloat(bettingCommissionStats.commissions.total_unpaid || 0).toFixed(2)}</div>
										<div><b>{t("bettingCommission.commissionPayable")}:</b> XOF {parseFloat(bettingCommissionStats.commissions.payable || 0).toFixed(2)}</div>
										<div><b>{t("bettingCommission.payableTransactions")}:</b> {bettingCommissionStats.commissions.payable_count || 0}</div>
										<div><b>{t("bettingCommission.currentMonthCommission")}:</b> XOF {parseFloat(bettingCommissionStats.commissions.current_month || 0).toFixed(2)}</div>
										<div><b>{t("bettingCommission.currentMonthTransactions")}:</b> {bettingCommissionStats.commissions.current_month_count || 0}</div>
									</div>
								</div>
							)}

							{/* Current Configuration Display */}
							{bettingCommissionConfig && (
								<div className="space-y-2 p-4 bg-muted rounded-lg">
									<h3 className="font-semibold">{t("bettingCommission.currentConfiguration")}</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
										<div><b>{t("bettingCommission.depositCommissionRate")}:</b> {bettingCommissionConfig.deposit_commission_rate}%</div>
										<div><b>{t("bettingCommission.withdrawalCommissionRate")}:</b> {bettingCommissionConfig.withdrawal_commission_rate}%</div>
										<div><b>{t("bettingCommission.updatedBy")}:</b> {bettingCommissionConfig.updated_by_name || t("bettingCommission.notAvailable")}</div>
										<div><b>{t("bettingCommission.lastUpdated")}:</b> {bettingCommissionConfig.updated_at ? new Date(bettingCommissionConfig.updated_at).toLocaleString() : t("bettingCommission.notAvailable")}</div>
									</div>
								</div>
							)}

							{/* Commission Configuration Form */}
							<div className="space-y-4">
								<h3 className="font-semibold">{t("bettingCommission.configurationTitle")}</h3>
								{bettingCommissionError && (
									<ErrorDisplay error={bettingCommissionError} variant="inline" className="mb-4" />
								)}
								<form onSubmit={handleSaveBettingCommission} className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="deposit_commission_rate">{t("bettingCommission.depositCommissionRate")}</Label>
											<Input
												id="deposit_commission_rate"
												type="number"
												step="0.01"
												min="0"
												max="100"
												value={bettingCommissionForm.deposit_commission_rate}
												onChange={(e) => setBettingCommissionForm((prev: any) => ({ 
													...prev, 
													deposit_commission_rate: e.target.value 
												}))}
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="withdrawal_commission_rate">{t("bettingCommission.withdrawalCommissionRate")}</Label>
											<Input
												id="withdrawal_commission_rate"
												type="number"
												step="0.01"
												min="0"
												max="100"
												value={bettingCommissionForm.withdrawal_commission_rate}
												onChange={(e) => setBettingCommissionForm((prev: any) => ({ 
													...prev, 
													withdrawal_commission_rate: e.target.value 
												}))}
												required
											/>
										</div>
									</div>

									<div className="flex items-center gap-4 pt-4 border-t">
										<Button
											type="submit"
											disabled={bettingCommissionLoading}
										>
											{bettingCommissionLoading ? (
												<>
													<Loader className="mr-2 h-4 w-4 animate-spin" />
													{t("bettingCommission.saving")}
												</>
											) : (
												<>
													<Settings className="h-4 w-4 mr-2" />
													{bettingCommissionConfig ? t("bettingCommission.updateConfiguration") : t("bettingCommission.createConfiguration")}
												</>
											)}
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => setBettingCommissionPaymentModalOpen(true)}
											disabled={bettingCommissionLoading}
										>
											<CreditCard className="h-4 w-4 mr-2" />
											{t("bettingCommission.payCommission")}
										</Button>
									</div>
								</form>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setBettingCommissionModalOpen(false)}>
							{t("common.close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Partner Transfers Modal */}
			<Dialog open={transfersModalOpen} onOpenChange={setTransfersModalOpen}>
				<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{t("bettingCommission.transfersTitle")} - {transfersPartner?.display_name || transfersPartner?.email}</DialogTitle>
					</DialogHeader>
					{transfersLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader className="animate-spin mr-2 h-6 w-6" />
							<span>{t("common.loading")}</span>
						</div>
					) : transfers.length > 0 ? (
						<div className="border rounded-lg">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>{t("bettingCommission.transferDate")}</TableHead>
										<TableHead>{t("bettingCommission.transferType")}</TableHead>
										<TableHead>{t("bettingCommission.transferAmount")}</TableHead>
										<TableHead>{t("bettingCommission.transferStatus")}</TableHead>
										<TableHead>{t("bettingCommission.transferReference")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{transfers.map((transfer: any) => (
										<TableRow key={transfer.uid}>
											<TableCell>{new Date(transfer.created_at).toLocaleString()}</TableCell>
											<TableCell>{transfer.transfer_type || t("bettingCommission.notApplicable")}</TableCell>
											<TableCell className="font-medium">{transfer.amount} XOF</TableCell>
											<TableCell>
												<Badge variant={transfer.status === "completed" ? "default" : "secondary"}>
													{transfer.status || t("bettingCommission.notApplicable")}
												</Badge>
											</TableCell>
											<TableCell className="font-mono text-xs">{transfer.reference || transfer.uid}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					) : (
						<div className="text-center py-8 text-gray-500">
							<ArrowRightLeft className="mx-auto h-12 w-12 mb-4 opacity-50" />
							<p>{t("bettingCommission.noTransfers")}</p>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setTransfersModalOpen(false)}>
							{t("common.close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Betting Commission Payment Modal */}
			<Dialog open={bettingCommissionPaymentModalOpen} onOpenChange={setBettingCommissionPaymentModalOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("bettingCommission.payCommission")} - {bettingCommissionPartner?.display_name || bettingCommissionPartner?.email}</DialogTitle>
					</DialogHeader>
					{bettingCommissionPaymentLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader className="animate-spin mr-2 h-6 w-6" />
							<span>{t("common.loading")}</span>
						</div>
					) : (
						<form onSubmit={handlePayBettingCommission} className="space-y-4">
							{bettingCommissionPaymentError && (
								<ErrorDisplay error={bettingCommissionPaymentError} variant="inline" className="mb-4" />
							)}
							<div className="space-y-2">
								<Label htmlFor="admin_notes">{t("bettingCommission.paymentNotes")}</Label>
								<Textarea
									id="admin_notes"
									placeholder={t("bettingCommission.paymentNotesPlaceholder")}
									value={bettingCommissionPaymentForm.admin_notes}
									onChange={(e) => setBettingCommissionPaymentForm((prev: any) => ({ 
										...prev, 
										admin_notes: e.target.value 
									}))}
									rows={3}
								/>
							</div>
							<div className="p-3 bg-muted rounded-lg">
								<p className="text-sm">
									{t("bettingCommission.paymentInfo")}
								</p>
							</div>
							<DialogFooter>
								<Button 
									type="button"
									variant="outline" 
									onClick={() => {
										setBettingCommissionPaymentModalOpen(false)
										setBettingCommissionPaymentForm({ admin_notes: "" })
										setBettingCommissionPaymentError("")
									}}
								>
									{t("common.cancel")}
								</Button>
								<Button type="submit" disabled={bettingCommissionPaymentLoading}>
									{bettingCommissionPaymentLoading ? (
										<>
											<Loader className="mr-2 h-4 w-4 animate-spin" />
											{t("common.processing") || "Processing..."}
										</>
									) : (
										<>
											<Wallet className="mr-2 h-4 w-4" />
											{t("bettingCommission.payCommission")}
										</>
									)}
								</Button>
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{/* Account Transactions Modal */}
			<Dialog open={accountTransactionsModalOpen} onOpenChange={setAccountTransactionsModalOpen}>
				<DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{t("partners.accountTransactions") || "Account Transactions"} - {accountTransactionsPartner?.display_name || accountTransactionsPartner?.email}
						</DialogTitle>
					</DialogHeader>
					
					{accountTransactionsLoading ? (
						<div className="flex items-center justify-center py-8">
							<Loader className="animate-spin mr-2 h-6 w-6" />
							<span>{t("common.loading")}</span>
						</div>
					) : accountTransactionsError ? (
						<ErrorDisplay error={accountTransactionsError} variant="inline" className="mb-4" />
					) : (
						<div className="space-y-4">
							{/* User Info */}
							{accountTransactionsUserInfo && (
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">{t("partners.userInformation") || "User Information"}</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div>
												<div className="text-sm text-muted-foreground">{t("common.uid") || "UID"}</div>
												<div className="font-mono text-sm">{accountTransactionsUserInfo.uid}</div>
											</div>
											<div>
												<div className="text-sm text-muted-foreground">{t("partners.name") || "Name"}</div>
												<div className="font-medium">{accountTransactionsUserInfo.display_name}</div>
											</div>
											<div>
												<div className="text-sm text-muted-foreground">{t("partners.email") || "Email"}</div>
												<div>{accountTransactionsUserInfo.email || "-"}</div>
											</div>
											<div>
												<div className="text-sm text-muted-foreground">{t("partners.phone") || "Phone"}</div>
												<div>{accountTransactionsUserInfo.phone || "-"}</div>
											</div>
											<div>
												<div className="text-sm text-muted-foreground">{t("partners.accountBalance") || "Current Balance"}</div>
												<div className="text-lg font-bold text-green-600">
													{accountTransactionsUserInfo.current_balance?.toLocaleString() || "0"} FCFA
												</div>
											</div>
											<div>
												<div className="text-sm text-muted-foreground">{t("partners.isPartner") || "Is Partner"}</div>
												<div>
													<Badge variant={accountTransactionsUserInfo.is_partner ? "default" : "secondary"}>
														{accountTransactionsUserInfo.is_partner ? t("common.yes") : t("common.no")}
													</Badge>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Transactions Table */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold">{t("partners.transactions") || "Transactions"} ({accountTransactionsTotalCount})</h3>
								</div>
								{accountTransactions.length > 0 ? (
									<div className="border rounded-lg">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>{t("partners.reference") || "Reference"}</TableHead>
													<TableHead>{t("partners.type") || "Type"}</TableHead>
													<TableHead>{t("partners.amount") || "Amount"}</TableHead>
													<TableHead>{t("partners.balanceBefore") || "Balance Before"}</TableHead>
													<TableHead>{t("partners.balanceAfter") || "Balance After"}</TableHead>
													<TableHead>{t("partners.description") || "Description"}</TableHead>
													<TableHead>{t("partners.createdAt") || "Created At"}</TableHead>
													<TableHead>{t("partners.relatedPayment") || "Related Payment"}</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{accountTransactions.map((transaction: any) => (
													<TableRow key={transaction.uid}>
														<TableCell>
															<code className="text-xs">{transaction.reference}</code>
														</TableCell>
														<TableCell>
															<div className="space-y-1">
																<Badge variant={transaction.is_credit ? "default" : transaction.is_debit ? "destructive" : "outline"}>
																	{transaction.type_display || transaction.type}
																</Badge>
															</div>
														</TableCell>
														<TableCell className={`font-medium ${transaction.is_credit ? "text-green-600" : transaction.is_debit ? "text-red-600" : ""}`}>
															{transaction.formatted_amount || `${transaction.is_credit ? "+" : transaction.is_debit ? "-" : ""}${transaction.amount} FCFA`}
														</TableCell>
														<TableCell>
															{parseFloat(transaction.balance_before || 0).toLocaleString()} FCFA
														</TableCell>
														<TableCell className="font-medium">
															{parseFloat(transaction.balance_after || 0).toLocaleString()} FCFA
														</TableCell>
														<TableCell className="max-w-xs truncate" title={transaction.description}>
															{transaction.description || "-"}
														</TableCell>
														<TableCell className="text-sm">
															{new Date(transaction.created_at).toLocaleString()}
														</TableCell>
														<TableCell>
															<div className="space-y-1">
																{transaction.related_payment_reference && (
																	<div className="text-xs">
																		<code>{transaction.related_payment_reference}</code>
																	</div>
																)}
																{transaction.related_payment_recipient && (
																	<div className="text-xs text-muted-foreground">
																		{transaction.related_payment_recipient}
																	</div>
																)}
																{transaction.metadata?.network && (
																	<div className="text-xs">
																		<Badge variant="outline">{transaction.metadata.network}</Badge>
																	</div>
																)}
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								) : (
									<div className="text-center py-8 text-muted-foreground">
										<CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
										<p>{t("partners.noAccountTransactions") || "No account transactions found"}</p>
									</div>
								)}

								{/* Pagination */}
								{(accountTransactionsNextPage || accountTransactionsPrevPage) && (
									<div className="flex items-center justify-between pt-4 border-t">
										<div className="text-sm text-muted-foreground">
											{t("partners.showing") || "Showing"} {accountTransactions.length} {t("partners.of") || "of"} {accountTransactionsTotalCount} {t("partners.transactions") || "transactions"}
										</div>
										<div className="flex items-center space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => accountTransactionsPrevPage && handleAccountTransactionsPageChange(accountTransactionsPrevPage)}
												disabled={!accountTransactionsPrevPage || accountTransactionsLoading}
											>
												<ChevronLeft className="h-4 w-4 mr-1" />
												{t("common.previous") || "Previous"}
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => accountTransactionsNextPage && handleAccountTransactionsPageChange(accountTransactionsNextPage)}
												disabled={!accountTransactionsNextPage || accountTransactionsLoading}
											>
												{t("common.next") || "Next"}
												<ChevronRight className="h-4 w-4 ml-1" />
											</Button>
										</div>
									</div>
								)}
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant="outline" onClick={() => setAccountTransactionsModalOpen(false)}>
							{t("common.close")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
