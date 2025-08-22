// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { useApi } from "@/lib/useApi";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display";

// export default function CommissionStatPage({ params }: { params: { user_id: string } }) {
//   const userId = params.user_id;
//   const [stats, setStats] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [modalOpen, setModalOpen] = useState(false);
//   const [amount, setAmount] = useState("");
//   const [adminNote, setAdminNote] = useState("");
//   const [payLoading, setPayLoading] = useState(false);
//   const [payError, setPayError] = useState("");
//   const [lastPeriodEnd, setLastPeriodEnd] = useState<string | null>(null);
//   const [confirmModalOpen, setConfirmModalOpen] = useState(false);
//   const apiFetch = useApi();
//   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

//   useEffect(() => {
//     const fetchStats = async () => {
//       setLoading(true);
//       setError("");
//       try {
//         const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/users/${userId}/commission-stats/`;
//         const data = await apiFetch(endpoint);
//         setStats(data);
//         // Find last period_end from commission_history
//         if (data.commission_history && data.commission_history.length > 0) {
//           const last = data.commission_history[data.commission_history.length - 1];
//           setLastPeriodEnd(last.period_end);
//         }
//       } catch (err: any) {
//         setError(extractErrorMessages(err));
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchStats();
//   }, [userId, baseUrl, apiFetch]);

//   // Replace handlePayCommission with a two-step confirmation
//   const handlePayClick = () => {
//     setConfirmModalOpen(true);
//   };

//   const handleConfirmPay = async () => {
//     setConfirmModalOpen(false);
//     setPayLoading(true);
//     setPayError("");
//     try {
//       const now = new Date().toISOString();
//       const payload = {
//         amount: parseFloat(amount),
//         period_start: lastPeriodEnd || stats?.period_info?.start || now,
//         period_end: now,
//         admin_notes: adminNote,
//       };
//       const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/users/${userId}/pay-commission/`;
//       await apiFetch(endpoint, {
//         method: "POST",
//         body: JSON.stringify(payload),
//         headers: { "Content-Type": "application/json" },
//       });
//       setModalOpen(false);
//       setAmount("");
//       setAdminNote("");
//       // Optionally, refetch stats
//       window.location.reload();
//     } catch (err: any) {
//       setPayError(extractErrorMessages(err));
//     } finally {
//       setPayLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto mt-8">
//       <div className="flex justify-end mb-4">
//         <Dialog open={modalOpen} onOpenChange={setModalOpen}>
//           <DialogTrigger asChild>
//             <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow" style={{minWidth:120}}>Payer des commissions</Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Payer la commission</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4">
//               <Input
//                 type="number"
//                 placeholder="Montant (ex: 25000.00)"
//                 value={amount}
//                 onChange={e => setAmount(e.target.value)}
//               />
//               <Input
//                 placeholder="Note admin (ex: Raison du paiement)"
//                 value={adminNote}
//                 onChange={e => setAdminNote(e.target.value)}
//               />
//               {payError && <ErrorDisplay error={payError} />}
//             </div>
//             <DialogFooter>
//               <Button onClick={handlePayClick} disabled={payLoading || !amount}>
//                 {payLoading ? "Paiement..." : "Payer"}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//         {/* Confirmation Modal */}
//         <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Confirmer le paiement</DialogTitle>
//             </DialogHeader>
//             <div className="py-4 text-center">
//               <span className="font-semibold">Êtes-vous sûr de vouloir payer la commission de </span>
//               <span className="font-bold text-blue-700">{amount} FCFA</span>
//               <span className="font-semibold"> ?</span>
//             </div>
//             <DialogFooter className="flex justify-center gap-4">
//               <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
//                 Non
//               </Button>
//               <Button className="bg-blue-600 text-white" onClick={handleConfirmPay} disabled={payLoading}>
//                 Oui
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>
//       <div className="space-y-6">
//         {/* Carte Infos Utilisateur */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Informations de l'utilisateur</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div><b>UID :</b> {stats?.user_info?.uid}</div>
//             <div><b>Nom :</b> {stats?.user_info?.name}</div>
//             <div><b>Email :</b> {stats?.user_info?.email}</div>
//           </CardContent>
//         </Card>
        
//         {/* Cartes Totaux séparées */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <Card className="border-blue-500">
//             <CardHeader>
//               <CardTitle className="text-blue-700">Dépôts</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-sm text-muted-foreground">Nombre</div>
//               <div className="text-2xl font-bold text-blue-700">{stats?.totals?.deposits?.count}</div>
//               <div className="text-sm text-muted-foreground mt-2">Montant</div>
//               <div className="text-xl font-bold text-blue-700">{stats?.totals?.deposits?.amount}</div>
//             </CardContent>
//           </Card>
//           <Card className="border-green-500">
//             <CardHeader>
//               <CardTitle className="text-green-700">Retraits</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-sm text-muted-foreground">Nombre</div>
//               <div className="text-2xl font-bold text-green-700">{stats?.totals?.withdrawals?.count}</div>
//               <div className="text-sm text-muted-foreground mt-2">Montant</div>
//               <div className="text-xl font-bold text-green-700">{stats?.totals?.withdrawals?.amount}</div>
//             </CardContent>
//           </Card>
//           <Card className="border-purple-500">
//             <CardHeader>
//               <CardTitle className="text-purple-700">Toutes opérations</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="text-sm text-muted-foreground">Nombre</div>
//               <div className="text-2xl font-bold text-purple-700">{stats?.totals?.all?.count}</div>
//               <div className="text-sm text-muted-foreground mt-2">Montant</div>
//               <div className="text-xl font-bold text-purple-700">{stats?.totals?.all?.amount}</div>
//             </CardContent>
//           </Card>
//         </div>
//         {/* Cartes Statistiques par réseau */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {stats?.stats_by_network && Object.entries(stats.stats_by_network).map(([network, data]: [string, any]) => (
//             <Card key={network} className="border border-gray-300">
//               <CardHeader>
//                 <CardTitle className="text-gray-800">{network}</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid grid-cols-3 gap-2">
//                   <div>
//                     <div className="text-xs text-muted-foreground">Dépôts</div>
//                     <div className="font-bold text-blue-700">{data.deposits?.count ?? 0}</div>
//                     <div className="text-sm text-blue-700">{data.deposits?.amount ?? 0} FCFA</div>
//                   </div>
//                   <div>
//                     <div className="text-xs text-muted-foreground">Retraits</div>
//                     <div className="font-bold text-green-700">{data.withdrawals?.count ?? 0}</div>
//                     <div className="text-sm text-green-700">{data.withdrawals?.amount ?? 0} FCFA</div>
//                   </div>
//                   <div>
//                     <div className="text-xs text-muted-foreground">Total</div>
//                     <div className="font-bold text-purple-700">{data.total?.count ?? 0}</div>
//                     <div className="text-sm text-purple-700">{data.total?.amount ?? 0} FCFA</div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//         {/* Carte Historique des commissions */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Historique des commissions</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {stats?.commission_history && stats.commission_history.length > 0 ? (
//               <table className="min-w-full text-sm">
//                 <thead>
//                   <tr>
//                     <th className="px-2 py-1 text-left">Référence</th>
//                     <th className="px-2 py-1 text-left">Montant</th>
//                     <th className="px-2 py-1 text-left">Date de paiement</th>
//                     <th className="px-2 py-1 text-left">Début période</th>
//                     <th className="px-2 py-1 text-left">Fin période</th>
//                     <th className="px-2 py-1 text-left">Transactions</th>
//                     <th className="px-2 py-1 text-left">Note admin</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {stats.commission_history.map((item: any, idx: number) => (
//                     <tr key={idx}>
//                       <td className="px-2 py-1">{item.reference}</td>
//                       <td className="px-2 py-1 font-semibold">{item.formatted_amount ?? item.amount + " FCFA"}</td>
//                       <td className="px-2 py-1">{item.created_at ? new Date(item.created_at).toLocaleString("fr-FR") : ""}</td>
//                       <td className="px-2 py-1">{item.period_start}</td>
//                       <td className="px-2 py-1">{item.period_end}</td>
//                       <td className="px-2 py-1">{item.transactions_count ?? 0}</td>
//                       <td className="px-2 py-1">{item.admin_notes}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             ) : (
//               <div>Aucune commission payée pour l'instant.</div>
//             )}
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader>
//             <CardTitle>Période analysée</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div><b>Début :</b> {stats?.period_info?.start ? new Date(stats.period_info.start).toLocaleString("fr-FR") : ""}</div>
//             <div><b>Fin :</b> {stats?.period_info?.end ? new Date(stats.period_info.end).toLocaleString("fr-FR") : ""}</div>
//             <div><b>Inclure les commissions déjà payées :</b> {stats?.period_info?.include_paid ? "Oui" : "Non"}</div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }



"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/useApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display";

export default function CommissionStatPage({ params }: { params: { user_id: string } }) {
  const userId = params.user_id;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [lastPeriodEnd, setLastPeriodEnd] = useState<string | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  
  // Balance history state
  const [balanceHistory, setBalanceHistory] = useState<any>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const apiFetch = useApi();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/users/${userId}/commission-stats/`;
        const data = await apiFetch(endpoint);
        setStats(data);
        // Find last period_end from commission_history
        if (data.commission_history && data.commission_history.length > 0) {
          const last = data.commission_history[data.commission_history.length - 1];
          setLastPeriodEnd(last.period_end);
        }
      } catch (err: any) {
        setError(extractErrorMessages(err));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId, baseUrl, apiFetch]);

  // Fetch balance history
  useEffect(() => {
    const fetchBalanceHistory = async () => {
      setBalanceLoading(true);
      setBalanceError("");
      try {
        const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/users/${userId}/balance-history/?page=${currentPage}&page_size=${itemsPerPage}`;
        const data = await apiFetch(endpoint);
        setBalanceHistory(data);
      } catch (err: any) {
        setBalanceError(extractErrorMessages(err));
      } finally {
        setBalanceLoading(false);
      }
    };
    fetchBalanceHistory();
  }, [userId, baseUrl, apiFetch, currentPage, itemsPerPage]);

  // Replace handlePayCommission with a two-step confirmation
  const handlePayClick = () => {
    setConfirmModalOpen(true);
  };

  const handleConfirmPay = async () => {
    setConfirmModalOpen(false);
    setPayLoading(true);
    setPayError("");
    try {
      const now = new Date().toISOString();
      const payload = {
        amount: parseFloat(amount),
        period_start: lastPeriodEnd || stats?.period_info?.start || now,
        period_end: now,
        admin_notes: adminNote,
      };
      const endpoint = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/users/${userId}/pay-commission/`;
      await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      setModalOpen(false);
      setAmount("");
      setAdminNote("");
      // Optionally, refetch stats
      window.location.reload();
    } catch (err: any) {
      setPayError(extractErrorMessages(err));
    } finally {
      setPayLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (!balanceHistory?.count || balanceHistory.count <= itemsPerPage) return null;

    const totalPages = Math.ceil(balanceHistory.count / itemsPerPage);
    const pages = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || balanceLoading}
        >
          Précédent
        </Button>
        
        <div className="flex gap-1">
          {pages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={balanceLoading}
              className="w-8 h-8 p-0"
            >
              {page}
            </Button>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || balanceLoading}
        >
          Suivant
        </Button>
        
        <span className="text-sm text-muted-foreground ml-2">
          Page {currentPage} sur {totalPages} ({balanceHistory.count} éléments)
        </span>
      </div>
    );
  };

  return (
    <div className=" mx-auto mt-8">
      <div className="flex justify-end mb-4">
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow" style={{minWidth:120}}>Payer des commissions</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payer la commission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Montant (ex: 25000.00)"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <Input
                placeholder="Note admin (ex: Raison du paiement)"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
              />
              {payError && <ErrorDisplay error={payError} />}
            </div>
            <DialogFooter>
              <Button onClick={handlePayClick} disabled={payLoading || !amount}>
                {payLoading ? "Paiement..." : "Payer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Confirmation Modal */}
        <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer le paiement</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <span className="font-semibold">Êtes-vous sûr de vouloir payer la commission de </span>
              <span className="font-bold text-blue-700">{amount} FCFA</span>
              <span className="font-semibold"> ?</span>
            </div>
            <DialogFooter className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>
                Non
              </Button>
              <Button className="bg-blue-600 text-white" onClick={handleConfirmPay} disabled={payLoading}>
                Oui
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-6">
        {/* Carte Infos Utilisateur */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div><b>UID :</b> {stats?.user_info?.uid}</div>
            <div><b>Nom :</b> {stats?.user_info?.name}</div>
            <div><b>Email :</b> {stats?.user_info?.email}</div>
          </CardContent>
        </Card>
        
        {/* Cartes Totaux séparées */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="text-blue-700">Dépôts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Nombre</div>
              <div className="text-2xl font-bold text-blue-700">{stats?.totals?.deposits?.count}</div>
              <div className="text-sm text-muted-foreground mt-2">Montant</div>
              <div className="text-xl font-bold text-blue-700">{stats?.totals?.deposits?.amount}</div>
            </CardContent>
          </Card>
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-700">Retraits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Nombre</div>
              <div className="text-2xl font-bold text-green-700">{stats?.totals?.withdrawals?.count}</div>
              <div className="text-sm text-muted-foreground mt-2">Montant</div>
              <div className="text-xl font-bold text-green-700">{stats?.totals?.withdrawals?.amount}</div>
            </CardContent>
          </Card>
          <Card className="border-purple-500">
            <CardHeader>
              <CardTitle className="text-purple-700">Toutes opérations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Nombre</div>
              <div className="text-2xl font-bold text-purple-700">{stats?.totals?.all?.count}</div>
              <div className="text-sm text-muted-foreground mt-2">Montant</div>
              <div className="text-xl font-bold text-purple-700">{stats?.totals?.all?.amount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Carte Historique des soldes */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des soldes</CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading && (
              <div className="flex justify-center py-4">
                <div className="text-sm text-muted-foreground">Chargement...</div>
              </div>
            )}
            
            {balanceError && (
              <ErrorDisplay error={balanceError} />
            )}
            
            {balanceHistory && balanceHistory.results && balanceHistory.results.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-2 py-2 text-left">Date</th>
                        <th className="px-2 py-2 text-left">Type</th>
                        <th className="px-2 py-2 text-left">Montant</th>
                        <th className="px-2 py-2 text-left">Solde avant</th>
                        <th className="px-2 py-2 text-left">Solde après</th>
                        <th className="px-2 py-2 text-left">Référence</th>
                        <th className="px-2 py-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {balanceHistory.results.map((item: any, idx: number) => (
                        <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-2 py-2">{item.created_at ? new Date(item.created_at).toLocaleString("fr-FR") : ""}</td>
                          <td className="px-2 py-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.type_display === 'Recharge de compte' ?  'bg-green-200 text-green-700' :
                              item.type_display === 'Débit pour dépôt' ? 'bg-blue-100 text-blue-800' :
                              item.type_display === 'deposit' ? 'bg-blue-100 text-blue-800' :
                              item.type_display === 'withdrawal' ? 'bg-green-100 text-green-800' :
                              item.type_display === 'commission' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.type_display}
                            </span>
                          </td>
                          <td className="px-2 py-2 font-semibold">
                            <span className={item.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                              {item.amount > 0 ? '+' : ''}{item.amount} FCFA
                            </span>
                          </td>
                          <td className="px-2 py-2">{item.balance_before} FCFA</td>
                          <td className="px-2 py-2 font-semibold">{item.balance_after} FCFA</td>
                          <td className="px-2 py-2 text-xs text-gray-600">{item.reference || '-'}</td>
                          <td className="px-2 py-2 text-xs">{item.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderPagination()}
              </>
            ) : (
              !balanceLoading && (
                <div className="text-center py-4 text-muted-foreground">
                  Aucun historique de solde disponible.
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* Cartes Statistiques par réseau */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats?.stats_by_network && Object.entries(stats.stats_by_network).map(([network, data]: [string, any]) => (
            <Card key={network} className="border border-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-800">{network}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Dépôts</div>
                    <div className="font-bold text-blue-700">{data.deposits?.count ?? 0}</div>
                    <div className="text-sm text-blue-700">{data.deposits?.amount ?? 0} FCFA</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Retraits</div>
                    <div className="font-bold text-green-700">{data.withdrawals?.count ?? 0}</div>
                    <div className="text-sm text-green-700">{data.withdrawals?.amount ?? 0} FCFA</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="font-bold text-purple-700">{data.total?.count ?? 0}</div>
                    <div className="text-sm text-purple-700">{data.total?.amount ?? 0} FCFA</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Carte Historique des commissions */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des commissions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.commission_history && stats.commission_history.length > 0 ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Référence</th>
                    <th className="px-2 py-1 text-left">Montant</th>
                    <th className="px-2 py-1 text-left">Date de paiement</th>
                    <th className="px-2 py-1 text-left">Début période</th>
                    <th className="px-2 py-1 text-left">Fin période</th>
                    <th className="px-2 py-1 text-left">Transactions</th>
                    <th className="px-2 py-1 text-left">Note admin</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.commission_history.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-2 py-1">{item.reference}</td>
                      <td className="px-2 py-1 font-semibold">{item.formatted_amount ?? item.amount + " FCFA"}</td>
                      <td className="px-2 py-1">{item.created_at ? new Date(item.created_at).toLocaleString("fr-FR") : ""}</td>
                      <td className="px-2 py-1">{item.period_start}</td>
                      <td className="px-2 py-1">{item.period_end}</td>
                      <td className="px-2 py-1">{item.transactions_count ?? 0}</td>
                      <td className="px-2 py-1">{item.admin_notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>Aucune commission payée pour l'instant.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Période analysée</CardTitle>
          </CardHeader>
          <CardContent>
            <div><b>Début :</b> {stats?.period_info?.start ? new Date(stats.period_info.start).toLocaleString("fr-FR") : ""}</div>
            <div><b>Fin :</b> {stats?.period_info?.end ? new Date(stats.period_info.end).toLocaleString("fr-FR") : ""}</div>
            <div><b>Inclure les commissions déjà payées :</b> {stats?.period_info?.include_paid ? "Oui" : "Non"}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}