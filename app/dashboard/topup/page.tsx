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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"
import { useApi } from "@/lib/useApi"

export default function TopupPage() {
	const [searchTerm, setSearchTerm] = useState("")
	const [statusFilter, setStatusFilter] = useState("all")
	const [currentPage, setCurrentPage] = useState(1)
	const [topups, setTopups] = useState<any[]>([])
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
	const [detailTopup, setDetailTopup] = useState<any | null>(null)
	const [detailLoading, setDetailLoading] = useState(false)
	const [detailError, setDetailError] = useState("")
	
	// Approve/Reject modal state
	const [actionModalOpen, setActionModalOpen] = useState(false);
	const [actionType, setActionType] = useState<"approve"|"reject"|null>(null);
	const [actionTopup, setActionTopup] = useState<any|null>(null);
	const [adminNotes, setAdminNotes] = useState("");
	const [rejectionReason, setRejectionReason] = useState("");
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState(false);
	const [disabledTopups, setDisabledTopups] = useState<{[uid:string]:"approved"|"rejected"|undefined}>({});
	const [proofImageModalOpen, setProofImageModalOpen] = useState(false);
	const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

	// Fetch topups from API
	useEffect(() => {
		const fetchTopups = async () => {
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
				const orderingParam = sortField
					? `&ordering=${(sortDirection === "asc" ? "+" : "-")}${sortField}`
					: ""
				const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/recharge-requests/?${params.toString()}${orderingParam}`
				const data = await apiFetch(endpoint)
				setTopups(data.results || [])
				setTotalCount(data.count || 0)
				setTotalPages(Math.ceil((data.count || 0) / itemsPerPage))
				toast({ title: t("topup.success"), description: t("topup.loadedSuccessfully") })
			} catch (err: any) {
				const errorMessage = extractErrorMessages(err)
				setError(errorMessage)
				setTopups([])
				setTotalCount(0)
				setTotalPages(1)
				toast({ title: t("topup.failedToLoad"), description: errorMessage, variant: "destructive" })
			} finally {
				setLoading(false)
			}
		}
		fetchTopups()
	}, [searchTerm, currentPage, itemsPerPage, baseUrl, statusFilter, sortField, sortDirection, t, toast, apiFetch])

	const startIndex = (currentPage - 1) * itemsPerPage

	const handleSort = (field: "amount" | "created_at" | "status") => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc")
		} else {
			setSortField(field)
			setSortDirection("desc")
		}
	}

	// Fetch topup details
	const handleOpenDetail = async (uid: string) => {
		setDetailModalOpen(true)
		setDetailLoading(true)
		setDetailError("")
		setDetailTopup(null)
		try {
			// For demo, just find in topups
			const found = topups.find((t) => t.uid === uid)
			setDetailTopup(found)
			toast({ title: t("topup.detailLoaded"), description: t("topup.detailLoadedSuccessfully") })
		} catch (err: any) {
			setDetailError(extractErrorMessages(err))
			toast({ title: t("topup.detailFailed"), description: extractErrorMessages(err), variant: "destructive" })
		} finally {
			setDetailLoading(false)
		}
	}

	const handleCloseDetail = () => {
		setDetailModalOpen(false)
		setDetailTopup(null)
		setDetailError("")
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{t("topup.title") || "Top Up Requests"}</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Search & Filter */}
					<div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
							<Input
								placeholder={t("topup.search") || "Search"}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10"
							/>
						</div>
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="w-full sm:w-48 border rounded px-2 py-1"
						>
							<option value="all">{t("topup.allStatuses") || "All Statuses"}</option>
							<option value="pending">{t("topup.pending") || "Pending"}</option>
							<option value="approved">{t("topup.approved") || "Approved"}</option>
							<option value="rejected">{t("topup.rejected") || "Rejected"}</option>
							<option value="expired">{t("topup.expired") || "Expired"}</option>
						</select>
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
										<TableHead>{t("topup.uid") || "UID"}</TableHead>
										<TableHead>
											<Button variant="ghost" onClick={() => handleSort("amount")} className="h-auto p-0 font-semibold">
												{t("topup.amount") || "Amount"}
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
										<TableHead>{t("topup.formattedAmount") || "Formatted Amount"}</TableHead>
										<TableHead>
											<Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-semibold">
												{t("topup.status") || "Status"}
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
										<TableHead>{t("topup.userName") || "User Name"}</TableHead>
										<TableHead>{t("topup.userEmail") || "User Email"}</TableHead>
										<TableHead>{t("topup.reference") || "Reference"}</TableHead>
										<TableHead>
											<Button variant="ghost" onClick={() => handleSort("created_at")} className="h-auto p-0 font-semibold">
												{t("topup.createdAt") || "Created At"}
												<ArrowUpDown className="ml-2 h-4 w-4" />
											</Button>
										</TableHead>
										<TableHead>{t("topup.details") || "Details"}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{topups.map((topup) => (
										<TableRow key={topup.uid}>
											<TableCell>{topup.uid}</TableCell>
											<TableCell>{topup.amount}</TableCell>
											<TableCell>{topup.formatted_amount}</TableCell>
											<TableCell>
												<Badge variant={topup.status === "pending" ? "outline" : topup.status === "approved" ? "default" : "secondary"}>{topup.status_display || topup.status}</Badge>
											</TableCell>
											<TableCell>{topup.user_name}</TableCell>
											<TableCell>{topup.user_email}</TableCell>
											<TableCell>{topup.reference}</TableCell>
											<TableCell>{topup.created_at ? topup.created_at.split("T")[0] : "-"}</TableCell>
											<TableCell>
											   <div className="flex gap-2 items-center">
												<Button size="sm" variant="secondary" onClick={() => handleOpenDetail(topup.uid)}>
													{t("topup.details") || "Details"}	
												</Button>
												{/* Approve Button */}
												<Button
													size="sm"
													variant="default"
													className="ml-2"
													disabled={!!disabledTopups[topup.uid] || topup.status !== "pending"}
													onClick={() => {
														setActionType("approve");
														setActionTopup(topup);
														setAdminNotes("");
														setActionModalOpen(true);
													}}
												>
													{disabledTopups[topup.uid] === "approved" ? t("topup.approved") || "Approved" : t("topup.approve") || "Approve"}
												</Button>
												{/* Reject Button */}
												<Button
													size="sm"
													variant="destructive"
													className="ml-2"
													disabled={!!disabledTopups[topup.uid] || topup.status !== "pending"}
													onClick={() => {
														setActionType("reject");
														setActionTopup(topup);
														setAdminNotes("");
														setRejectionReason("");
														setActionModalOpen(true);
													}}
												>
													{disabledTopups[topup.uid] === "rejected" ? t("topup.rejected") || "Rejected" : t("topup.reject") || "Reject"}
												</Button>
												</div>
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
							{`${t("topup.showingResults") || "Showing"}: ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, totalCount)} / ${totalCount}`}
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
								{`${t("topup.pageOf") || "Page"}: ${currentPage}/${totalPages}`}
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

			{/* Topup Details Modal */}
			<Dialog open={detailModalOpen} onOpenChange={(open) => { if (!open) handleCloseDetail() }}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("topup.details") || "Top Up Details"}</DialogTitle>
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
					) : detailTopup ? (
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<b>{t("topup.uid") || "UID"}:</b> {detailTopup.uid}
								<Button
									variant="ghost"
									size="icon"
									className="h-5 w-5"
									onClick={() => {
										navigator.clipboard.writeText(detailTopup.uid)
										toast({ title: t("topup.copiedUid") || "UID copied!" })
									}}
									aria-label={t("topup.copyUid") || "Copy UID"}
								>
									<Copy className="h-4 w-4" />
								</Button>
							</div>
							{/* <div><b>{t("topup.amount") || "Amount"}:</b> {detailTopup.amount}</div> */}
							<div><b>{t("topup.formattedAmount") || "Formatted Amount"}:</b> {detailTopup.formatted_amount}</div>
							<div><b>{t("topup.status") || "Status"}:</b> {detailTopup.status_display || detailTopup.status}</div>
							<div><b>{t("topup.userName") || "User Name"}:</b> {detailTopup.user_name}</div>
							<div><b>{t("topup.userEmail") || "User Email"}:</b> {detailTopup.user_email}</div>
							<div><b>{t("topup.reference") || "Reference"}:</b> {detailTopup.reference}</div>
							<div><b>{t("topup.createdAt") || "Created At"}:</b> {detailTopup.created_at ? detailTopup.created_at.split("T")[0] : "-"}</div>
							<div><b>{t("topup.expiresAt") || "Expires At"}:</b> {detailTopup.expires_at ? detailTopup.expires_at.split("T")[0] : "-"}</div>
							{/* <div><b>{t("topup.transactionDate") || "Transaction Date"}:</b> {detailTopup.transaction_date ? detailTopup.transaction_date.split("T")[0] : "-"}</div> */}
							<div className="flex items-center gap-2">
								<b>{t("topup.proofImage") || "Proof Image"}:</b>
								{detailTopup.proof_image ? (
									<>
										<Button
											size="sm"
											variant="outline"
											onClick={() => {
												setProofImageUrl(detailTopup.proof_image);
												setProofImageModalOpen(true);
											}}
										>
											{t("topup.viewProof") || "Voir l'image"}
										</Button>
									</>
								) : (
									<span className="text-muted-foreground">{t("topup.noProofImage") || "Aucune image"}</span>
								)}
							</div>
							<div><b>{t("topup.proofDescription") || "Proof Description"}:</b> {detailTopup.proof_description}</div>
							{/* <div><b>{t("topup.accountTransactionReference") || "Transaction Référence"}:</b> {detailTopup.account_transaction_reference}</div> */}
							{/* <div><b>{t("topup.canSubmitProof") || "Peut soumettre preuve"}:</b> {detailTopup.can_submit_proof ? "Oui" : "Non"}</div>
							<div><b>{t("topup.canBeReviewed") || "Peut être vérifié"}:</b> {detailTopup.can_be_reviewed ? "Oui" : "Non"}</div> */}
							<div><b>{t("topup.isExpired") || "Expiré"}:</b> {detailTopup.is_expired ? "Oui" : "Non"}</div>
							<div><b>{t("topup.timeRemaining") || "Temps restant"}:</b> {detailTopup.time_remaining ? `${detailTopup.time_remaining} secondes` : "-"}</div>
							<div><b>{t("topup.reviewedBy") || "Vérifié par"}:</b> {detailTopup.reviewed_by_name}</div>
							<div><b>{t("topup.reviewedAt") || "Vérifié le"}:</b> {detailTopup.reviewed_at ? detailTopup.reviewed_at.split("T")[0] : "-"}</div>
							<div><b>{t("topup.processedAt") || "Traité le"}:</b> {detailTopup.processed_at ? detailTopup.processed_at.split("T")[0] : "-"}</div>
							<div><b>{t("topup.adminNotes") || "Admin Notes"}:</b> {detailTopup.admin_notes}</div>
							<div><b>{t("topup.rejectionReason") || "Rejection Reason"}:</b> {detailTopup.rejection_reason}</div>
						</div>
					) : null}
					<DialogClose asChild>
						<Button className="mt-4 w-full">{t("common.close")}</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>

			{/* Proof Image Modal */}
			<Dialog open={proofImageModalOpen} onOpenChange={setProofImageModalOpen}>
				<DialogContent className="flex flex-col items-center justify-center">
					<DialogHeader>
						<DialogTitle>{t("topup.proofImage") || "Proof Image"}</DialogTitle>
					</DialogHeader>
					{proofImageUrl && (
						<img
							src={proofImageUrl}
							alt={t("topup.proofImageAlt") || "Preuve"}
							className="max-w-full max-h-[70vh] rounded border"
							style={{ objectFit: "contain" }}
						/>
					)}
					<DialogClose asChild>
						<Button className="mt-4 w-full">{t("common.close") || "Fermer"}</Button>
					</DialogClose>
				</DialogContent>
			</Dialog>

			{/* Approve/Reject Modal */}
			<Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {actionType === "approve"
          ? t("topup.approveTitle") || "Approuver la demande"
          : t("topup.rejectTitle") || "Rejeter la demande"}
      </DialogTitle>
    </DialogHeader>
    {actionType === "approve" ? (
      <div className="space-y-4">
        <Input
          placeholder={t("topup.adminNotes") || "Notes administrateur"}
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
        />
      </div>
    ) : (
      <div className="space-y-4">
        <Input
          placeholder={t("topup.rejectionReason") || "Raison du rejet"}
          value={rejectionReason}
          onChange={e => setRejectionReason(e.target.value)}
        />
      </div>
    )}
    <DialogFooter className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => setActionModalOpen(false)}
      >
        {t("common.cancel") || "Annuler"}
      </Button>
      <Button
        onClick={async () => {
          setPendingAction(true);
          try {
            const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/recharge-requests/${actionTopup.uid}/${actionType}/`;
            const payload =
              actionType === "approve"
                ? { admin_notes: adminNotes }
                : { rejection_reason: rejectionReason };
            await apiFetch(endpoint, {
              method: "POST",
              body: JSON.stringify(payload),
              headers: { "Content-Type": "application/json" },
            });
            setDisabledTopups(prev => ({
              ...prev,
              [actionTopup.uid]: actionType === "approve" ? "approved" : "rejected",
            }));
            setActionModalOpen(false);
            setAdminNotes("");
            setRejectionReason("");
            toast({
              title: t("topup.success"),
              description:
                actionType === "approve"
                  ? t("topup.approvedSuccessfully") || "Demande approuvée"
                  : t("topup.rejectedSuccessfully") || "Demande rejetée",
            });
          } catch (err: any) {
            toast({
              title: t("topup.failed"),
              description: extractErrorMessages(err),
              variant: "destructive",
            });
          } finally {
            setPendingAction(false);
          }
        }}
        disabled={pendingAction || (actionType === "approve" && !adminNotes) || (actionType === "reject" && !rejectionReason)}
      >
        {actionType === "approve"
          ? t("topup.confirmApprove") || "Confirmer l'approbation"
          : t("topup.confirmReject") || "Confirmer le rejet"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
		</>
	)
}
