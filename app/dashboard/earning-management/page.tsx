
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLanguage } from "@/components/providers/language-provider"
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"

export default function EarningManagementPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [startDate, setStartDate] = useState("")
	const [endDate, setEndDate] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const [earnings, setEarnings] = useState<any[]>([])
	const [totalCount, setTotalCount] = useState(0)
	const [totalPages, setTotalPages] = useState(1)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [sortField, setSortField] = useState<"amount" | "created_at" | "status" | null>(null)
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
	const { t } = useLanguage()
	const itemsPerPage = 10
	const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
	const { toast } = useToast()
	const apiFetch = useApi();
	const [detailModalOpen, setDetailModalOpen] = useState(false)
	const [detailEarning, setDetailEarning] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")

	// Fetch earnings from API
	useEffect(() => {
		const fetchEarnings = async () => {
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
				params.append("status", statusFilter)
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
				const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/commission-payments/?${params.toString()}${orderingParam}`
				const data = await apiFetch(endpoint)
				setEarnings(data.results || [])
				setTotalCount(data.count || 0)
				setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
				toast({ title: t("earning.success"), description: t("earning.loadedSuccessfully") })
			} catch (err: any) {
				const errorMessage = extractErrorMessages(err)
				setError(errorMessage)
				setEarnings([])
				setTotalCount(0)
				setTotalPages(1)
				toast({ title: t("earning.failedToLoad"), description: errorMessage, variant: "destructive" })
			} finally {
				setLoading(false)
			}
		}
		fetchEarnings()
	}, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, startDate, endDate, sortField, sortDirection, t, toast, apiFetch])

	const startIndex = (currentPage - 1) * itemsPerPage

	const handleSort = (field: "amount" | "created_at" | "status") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("desc")
		}
	}

	// Fetch earning details
	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailEarning(null)
		try {
			// For demo, just find in earnings
			const found = earnings.find((e) => e.uid === uid)
			setDetailEarning(found)
			toast({ title: t("earning.detailLoaded"), description: t("earning.detailLoadedSuccessfully") })
		} catch (err: any) {
			setDetailError(extractErrorMessages(err))
			toast({ title: t("earning.detailFailed"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setDetailLoading(false)
		}
	}

	const handleCloseDetail = () => {
		setDetailModalOpen(false)
		setDetailEarning(null)
		setDetailError("")
	}

		return (
			<>
				<Card>
					<CardHeader>
						<CardTitle>{t("earning.title") || "Earning Management"}</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Search & Filter */}
						<div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
								<Input
									placeholder={t("earning.search") || "Search"}
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
					{/* No status in new API, so remove filter or keep for future */}
			</div>
			
			{/* Date Filters */}
			<div className="flex flex-col lg:flex-row gap-4 mb-6">
				<div className="flex flex-col lg:flex-row gap-4 flex-1">
					<div className="flex flex-col gap-2">
						<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
							{t("earning.startDate") || "Start Date"}
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
							{t("earning.endDate") || "End Date"}
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
						{t("earning.clearDates") || "Clear Dates"}
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
											<TableHead>{t("earning.uid") || "UID"}</TableHead>
											<TableHead>{t("earning.formattedAmount") || "Amount"}</TableHead>
											<TableHead>{t("earning.periodStart") || "Period Start"}</TableHead>
											<TableHead>{t("earning.periodEnd") || "Period End"}</TableHead>
											<TableHead>{t("earning.adminNotes") || "Admin Notes"}</TableHead>
											<TableHead>{t("earning.reference") || "Reference"}</TableHead>
											<TableHead>{t("earning.createdAt") || "Created At"}</TableHead>
											<TableHead>{t("earning.userName") || "User Name"}</TableHead>
											<TableHead>{t("earning.paidByName") || "Paid By"}</TableHead>
											<TableHead>{t("earning.transactionsCount") || "Transactions"}</TableHead>
											<TableHead>{t("earning.details") || "Details"}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{earnings.length === 0 ? (
											<TableRow>
												<TableCell colSpan={11} className="text-center text-muted-foreground py-8">
													{t("earning.noData") || "No earning commissions found."}
												</TableCell>
											</TableRow>
										) : (            
											earnings.map((earning) => (
												<TableRow key={earning.uid}>
													<TableCell>{earning.uid}</TableCell>
													<TableCell>{earning.formatted_amount}</TableCell>
													<TableCell>{earning.period_start ? earning.period_start.split("T")[0] : "-"}</TableCell>
													<TableCell>{earning.period_end ? earning.period_end.split("T")[0] : "-"}</TableCell>
													<TableCell>{earning.admin_notes}</TableCell>
													<TableCell>{earning.reference}</TableCell>
													<TableCell>{earning.created_at ? earning.created_at.split("T")[0] : "-"}</TableCell>
													<TableCell>{earning.user_name}</TableCell>
													<TableCell>{earning.paid_by_name}</TableCell>
													<TableCell>{earning.transactions_count}</TableCell>
													<TableCell>
														<Button size="sm" variant="secondary" onClick={() => handleOpenDetail(earning.uid)}>
															{t("earning.details") || "Details"}
														</Button>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							)}
						</div>

						{/* Pagination */}
						<div className="flex items-center justify-between mt-6">
							<div className="text-sm text-muted-foreground">
								{`${t("earning.showingResults") || "Showing"}: ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalCount)} / ${totalCount}`}
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
									{`${t("earning.pageOf") || "Page"}: ${currentPage}/${totalPages}`}
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

				{/* Earning Details Modal */}
				<Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>{t("earning.details") || "Earning Details"}</DialogTitle>
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
						) : detailEarning ? (
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<b>{t("earning.uid") || "UID"}:</b> {detailEarning.uid}
									<Button
										variant="ghost"
										size="icon"
										className="h-5 w-5"
										onClick={() => {
											navigator.clipboard.writeText(detailEarning.uid)
											toast({ title: t("earning.copiedUid") || "UID copied!" })
										}}
										aria-label={t("earning.copyUid") || "Copy UID"}
									>
										<Copy className="h-4 w-4" />
									</Button>
								</div>
								<div><b>{t("earning.formattedAmount") || "Amount"}:</b> {detailEarning.formatted_amount}</div>
								<div><b>{t("earning.periodStart") || "Period Start"}:</b> {detailEarning.period_start ? detailEarning.period_start.split("T")[0] : "-"}</div>
								<div><b>{t("earning.periodEnd") || "Period End"}:</b> {detailEarning.period_end ? detailEarning.period_end.split("T")[0] : "-"}</div>
								<div><b>{t("earning.adminNotes") || "Admin Notes"}:</b> {detailEarning.admin_notes}</div>
								<div><b>{t("earning.reference") || "Reference"}:</b> {detailEarning.reference}</div>
								<div><b>{t("earning.createdAt") || "Created At"}:</b> {detailEarning.created_at ? detailEarning.created_at.split("T")[0] : "-"}</div>
								<div><b>{t("earning.userName") || "User Name"}:</b> {detailEarning.user_name}</div>
								<div><b>{t("earning.paidByName") || "Paid By"}:</b> {detailEarning.paid_by_name}</div>
								<div><b>{t("earning.transactionsCount") || "Transactions"}:</b> {detailEarning.transactions_count}</div>
							</div>
						) : null}
						<DialogClose asChild>
							<Button className="mt-4 w-full">{t("common.close")}</Button>
						</DialogClose>
					</DialogContent>
				</Dialog>
			</>
		)
}
