"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/lib/useApi";
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";

export default function TopupDetailPage() {
  const { uid } = useParams<{ uid: string }>();
  const [topup, setTopup] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();
  const { toast } = useToast();
  const apiFetch = useApi();
  const [proofImageModalOpen, setProofImageModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint = `/api/payments/recharge-requests/${uid}/`;
        const data = await apiFetch(endpoint);
        setTopup(data);
      } catch (err: any) {
        setError(extractErrorMessages(err));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [uid, apiFetch]);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>{t("topup.details") || "Top Up Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-4 text-center">{t("common.loading")}</div>
          ) : error ? (
            <ErrorDisplay error={error} variant="inline" showRetry={false} className="mb-4" />
          ) : topup ? (
            <div className="space-y-2">
              <div><b>{t("topup.uid") || "UID"}:</b> {topup.uid}</div>
              <div><b>{t("topup.amount") || "Amount"}:</b> {topup.amount}</div>
              <div><b>{t("topup.formattedAmount") || "Formatted Amount"}:</b> {topup.formatted_amount}</div>
              <div><b>{t("topup.status") || "Status"}:</b> {topup.status_display || topup.status}</div>
              <div><b>{t("topup.userName") || "User Name"}:</b> {topup.user_name}</div>
              <div><b>{t("topup.userEmail") || "User Email"}:</b> {topup.user_email}</div>
              <div><b>{t("topup.reference") || "Reference"}:</b> {topup.reference}</div>
              <div><b>{t("topup.createdAt") || "Created At"}:</b> {topup.created_at ? topup.created_at.split("T")[0] : "-"}</div>
              <div><b>{t("topup.expiresAt") || "Expires At"}:</b> {topup.expires_at ? topup.expires_at.split("T")[0] : "-"}</div>
              <div><b>{t("topup.transactionDate") || "Transaction Date"}:</b> {topup.transaction_date ? topup.transaction_date.split("T")[0] : "-"}</div>
              <div className="flex items-center gap-2">
                <b>{t("topup.proofImage") || "Proof Image"}:</b>
                {topup.proof_image ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProofImageModalOpen(true)}
                    >
                      {t("topup.viewProof") || "View Image"}
                    </Button>
                    <Dialog open={proofImageModalOpen} onOpenChange={setProofImageModalOpen}>
                      <DialogContent className="flex flex-col items-center justify-center">
                        <DialogHeader>
                          <DialogTitle>{t("topup.proofImage") || "Proof Image"}</DialogTitle>
                        </DialogHeader>
                        <img
                          src={topup.proof_image}
                          alt={t("topup.proofImageAlt") || "Proof"}
                          className="max-w-full max-h-[70vh] rounded border"
                          style={{ objectFit: "contain" }}
                        />
                        <DialogClose asChild>
                          <Button className="mt-4 w-full">{t("common.close") || "Close"}</Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <span className="text-muted-foreground">{t("topup.noProofImage") || "No image"}</span>
                )}
              </div>
              <div><b>{t("topup.proofDescription") || "Proof Description"}:</b> {topup.proof_description}</div>
              <div><b>{t("topup.accountTransactionReference") || "Account Transaction Reference"}:</b> {topup.account_transaction_reference}</div>
              <div><b>{t("topup.canSubmitProof") || "Can Submit Proof"}:</b> {topup.can_submit_proof ? "Yes" : "No"}</div>
              <div><b>{t("topup.canBeReviewed") || "Can Be Reviewed"}:</b> {topup.can_be_reviewed ? "Yes" : "No"}</div>
              <div><b>{t("topup.isExpired") || "Expired"}:</b> {topup.is_expired ? "Yes" : "No"}</div>
              <div><b>{t("topup.timeRemaining") || "Time Remaining"}:</b> {topup.time_remaining ? `${topup.time_remaining} seconds` : "-"}</div>
              <div><b>{t("topup.reviewedBy") || "Reviewed By"}:</b> {topup.reviewed_by_name}</div>
              <div><b>{t("topup.reviewedAt") || "Reviewed At"}:</b> {topup.reviewed_at ? topup.reviewed_at.split("T")[0] : "-"}</div>
              <div><b>{t("topup.processedAt") || "Processed At"}:</b> {topup.processed_at ? topup.processed_at.split("T")[0] : "-"}</div>
              <div><b>{t("topup.adminNotes") || "Admin Notes"}:</b> {topup.admin_notes}</div>
              <div><b>{t("topup.rejectionReason") || "Rejection Reason"}:</b> {topup.rejection_reason}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}