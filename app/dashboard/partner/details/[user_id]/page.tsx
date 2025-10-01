"use client";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/useApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display";

export default function PartnerDetailsPage({ params }: { params: { user_id: string } }) {
  const userId = params.user_id;
  const [partner, setPartner] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const apiFetch = useApi();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    const fetchPartner = async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/partners/${userId}/`;
        const data = await apiFetch(endpoint);
        setPartner(data);
      } catch (err: any) {
        setError(extractErrorMessages(err));
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [userId, baseUrl, apiFetch]);

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Détails du partenaire</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : error ? (
            <ErrorDisplay error={error} />
          ) : partner ? (
            <div className="space-y-2">
              <div><b>UID :</b> {partner.uid}</div>
              <div><b>Nom :</b> {partner.display_name || `${partner.first_name || ""} ${partner.last_name || ""}`}</div>
              <div><b>Email :</b> {partner.email}</div>
              <div><b>Téléphone :</b> {partner.phone}</div>
              <div><b>Statut :</b> {partner.is_active ? "Actif" : "Inactif"}</div>
              <div><b>Email vérifié :</b> {partner.email_verified ? "Oui" : "Non"}</div>
              <div><b>Téléphone vérifié :</b> {partner.phone_verified ? "Oui" : "Non"}</div>
              <div><b>Méthode de contact :</b> {partner.contact_method}</div>
              <div><b>Date de création :</b> {partner.created_at ? partner.created_at.split("T")[0] : "-"}</div>
              <div><b>Dernière connexion :</b> {partner.last_login_at ? partner.last_login_at.split("T")[0] : "-"}</div>
              <div><b>Solde du compte :</b> {partner.account_balance}</div>
              <div><b>Compte actif :</b> {partner.account_is_active ? "Oui" : "Non"}</div>
              <div><b>Compte gelé :</b> {partner.account_is_frozen ? "Oui" : "Non"}</div>
              <div><b>Total transactions :</b> {partner.total_transactions}</div>
              <div><b>Transactions complétées :</b> {partner.completed_transactions}</div>
              <div><b>Montant total des transactions :</b> {partner.total_transaction_amount ?? "-"}</div>
              <div><b>Total commissions reçues :</b> {partner.total_commissions_received ?? "-"}</div>
              <div><b>Peut traiter les transactions USSD :</b> {partner.can_process_ussd_transaction ? "Oui" : "Non"}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
