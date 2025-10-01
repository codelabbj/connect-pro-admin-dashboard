
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
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"


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
	const [verifyingUssd, setVerifyingUssd] = useState(false)
	const [confirmUssdToggle, setConfirmUssdToggle] = useState<null | boolean>(null)

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

	// Add handler for toggling can_process_ussd_transaction
	const handleToggleUssdTransaction = async (canProcess: boolean) => {
		if (!detailPartner?.uid) return;
		setVerifyingUssd(true);
		try {
			const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/${detailPartner.uid}/update/`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ can_process_ussd_transaction: canProcess }),
			});
			setDetailPartner((prev: any) => prev ? { ...prev, can_process_ussd_transaction: canProcess } : prev);
			toast({ title: t("partners.ussdToggled"), description: canProcess ? t("partners.ussdEnabledSuccessfully") : t("partners.ussdDisabledSuccessfully") });
		} catch (err: any) {
			toast({ title: t("partners.ussdToggleFailed"), description: extractErrorMessages(err), variant: "destructive" });
		} finally {
			setVerifyingUssd(false);
		}
	};

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
										{/* <TableHead>{t("partners.details")}</TableHead> */}
								<TableHead>Statistiques des commissions</TableHead>
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
										<Button size="sm" variant="outline" onClick={() => window.location.assign(`/dashboard/partner/commission/${partner.uid}`)}>
											Commission Stat
										</Button>
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
							<div><b>{t("partners.canProcessUssdTransaction") || "Can Process USSD Transaction"}:</b> {detailPartner.can_process_ussd_transaction ? t("common.yes") : t("common.no")}
								<Switch
									checked={detailPartner.can_process_ussd_transaction}
									disabled={detailLoading || verifyingUssd}
									onCheckedChange={() => setConfirmUssdToggle(!detailPartner.can_process_ussd_transaction)}
									className="ml-2"
								/>
							</div>
						</div>
					) : null}
					<DialogClose asChild>
						<Button className="mt-4 w-full">{t("common.close")}</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>

			{/* USSD Transaction Toggle Confirmation Modal */}
			<Dialog open={confirmUssdToggle !== null} onOpenChange={(open) => { if (!open) setConfirmUssdToggle(null) }}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{confirmUssdToggle ? t("partners.enableUssdTransaction") || "Enable USSD Transaction" : t("partners.disableUssdTransaction") || "Disable USSD Transaction"}</DialogTitle>
					</DialogHeader>
					<div className="py-4 text-center">
						{confirmUssdToggle
							? t("partners.confirmEnableUssdTransaction") || "Are you sure you want to enable USSD transaction processing for this partner?"
							: t("partners.confirmDisableUssdTransaction") || "Are you sure you want to disable USSD transaction processing for this partner?"}
					</div>
					<DialogFooter>
						<Button
							className="w-full"
							onClick={async () => {
								await handleToggleUssdTransaction(!!confirmUssdToggle);
								setConfirmUssdToggle(null);
							}}
							disabled={verifyingUssd}
						>
							{verifyingUssd ? t("partners.verifying") || "Verifying..." : t("common.ok")}
						</Button>
						<Button
							variant="outline"
							className="w-full mt-2"
							onClick={() => setConfirmUssdToggle(null)}
							disabled={verifyingUssd}
						>
							{t("common.cancel")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
