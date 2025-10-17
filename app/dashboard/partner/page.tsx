
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
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy, MoreHorizontal, ShieldCheck, ToggleLeft, ToggleRight, Loader, Plus } from "lucide-react"
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
				toast({ title: t("partners.success"), description: t("partners.loadedSuccessfully") })
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
			toast({ title: t("partners.detailLoaded"), description: t("partners.partnerDetailLoadedSuccessfully") })
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
												<Button variant="outline" size="sm">
													<MoreHorizontal className="h-4 w-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => handleOpenDeviceAuth(partner)}>
													<ShieldCheck className="mr-2 h-4 w-4" />
													{t("deviceAuthorizations.viewAuthorizations") || "View YapsonPress Device Authorizations"}
												</DropdownMenuItem>
												<DropdownMenuItem asChild>
													<Link href={`/dashboard/commission-payments?partner=${partner.uid}`}>
														{t("commissionPayments.payCommission")}
													</Link>
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
		</>
	)
}
