// "use client"

// import { useState, useEffect } from "react"
// import { Badge } from "@/components/ui/badge"
// import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
// import { ChartContainer } from "@/components/ui/chart"
// import { useApi } from "@/lib/useApi"
// import { useLanguage } from "@/components/providers/language-provider"
// import { useRouter } from "next/navigation"
// import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
// import { useToast } from "@/hooks/use-toast"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// import { Switch } from "@/components/ui/switch"
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { ClipboardList, Users, KeyRound, Bell, Clock, TrendingUp, Loader, ServerCrash } from "lucide-react";
// import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

// const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

// // Mock data for chart and activity feed
// const mockChartData = [
//   { time: "09:00", users: 10, tasks: 5 },
//   { time: "10:00", users: 15, tasks: 8 },
//   { time: "11:00", users: 20, tasks: 12 },
//   { time: "12:00", users: 25, tasks: 15 },
//   { time: "13:00", users: 30, tasks: 18 },
//   { time: "14:00", users: 28, tasks: 16 },
//   { time: "15:00", users: 35, tasks: 20 },
// ]
// const mockFeed = [
//   { time: "2 min ago", message: "User JohnDoe registered." },
//   { time: "5 min ago", message: "Task #123 completed." },
//   { time: "10 min ago", message: "User JaneSmith verified email." },
//   { time: "15 min ago", message: "Task #124 scheduled." },
// ]



// export default function DashboardPage() {
//   const [stats, setStats] = useState<any>(null)
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState("")
//   const [authError, setAuthError] = useState("")
//   const [showAuthModal, setShowAuthModal] = useState(false)
//   const [showOnlyActiveUsers, setShowOnlyActiveUsers] = useState(false)
//   const [summary, setSummary] = useState<any>(null);
//   const [summaryLoading, setSummaryLoading] = useState(false);
//   const [summaryError, setSummaryError] = useState("");
//   const [transactionStats, setTransactionStats] = useState<any>(null);
//   const [transactionStatsLoading, setTransactionStatsLoading] = useState(false);
//   const [transactionStatsError, setTransactionStatsError] = useState("");

//   const [systemEvents, setSystemEvents] = useState<any[]>([]);
//   const [systemEventsLoading, setSystemEventsLoading] = useState(false);
//   const [systemEventsError, setSystemEventsError] = useState("");

//   const apiFetch = useApi();
//   const { t } = useLanguage();
//   const router = useRouter();
//   const { toast } = useToast();

//   const fetchStats = async () => {
//     setLoading(true);
//     setError("");
//     setAuthError("");
//     setShowAuthModal(false);
//     try {
//       const data = await apiFetch(`${baseUrl}api/auth/admin/notifications/stats/`);
//       setStats(data);
//       toast({
//         title: t("dashboard.success"),
//         description: t("dashboard.statsLoadedSuccessfully"),
//       });
//     } catch (err: any) {
//       let backendError = extractErrorMessages(err) || t("dashboard.failedToLoadStats");
//       // Detect authentication error (401 or token error)
//       if (
//         err?.code === 'token_not_valid' ||
//         err?.status === 401 ||
//         (typeof backendError === 'string' && backendError.toLowerCase().includes('token'))
//       ) {
//         setAuthError(backendError);
//         setShowAuthModal(true);
//         setLoading(false);
//         return;
//       }
//       setError(backendError);
//       toast({
//         title: t("dashboard.failedToLoadStats"),
//         description: backendError,
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Fetch summary data
//   useEffect(() => {
//     const fetchSummary = async () => {
//       setSummaryLoading(true);
//       setSummaryError("");
//       try {
//         const res = await apiFetch(`${baseUrl}api/payments/dashboard/summary/`);
//         setSummary(res);
//       } catch (err: any) {
//         setSummaryError("Failed to load payment summary");
//       } finally {
//         setSummaryLoading(false);
//       }
//     };
//     fetchSummary();
//   }, [apiFetch, baseUrl]);

//   // Fetch transaction stats
//   useEffect(() => {
//     const fetchTransactionStats = async () => {
//       setTransactionStatsLoading(true);
//       setTransactionStatsError("");
//       try {
//         const res = await apiFetch(`${baseUrl}api/payments/stats/transactions/`);
//         setTransactionStats(res);
//       } catch (err: any) {
//         setTransactionStatsError("Failed to load transaction stats");
//       } finally {
//         setTransactionStatsLoading(false);
//       }
//     };
//     fetchTransactionStats();
//   }, [apiFetch, baseUrl]);

//   // Fetch system events
//   useEffect(() => {
//     const fetchSystemEvents = async () => {
//       setSystemEventsLoading(true);
//       setSystemEventsError("");
//       try {
//         const res = await apiFetch(`${baseUrl}api/payments/system-events/`);
//         setSystemEvents(res.results || []);
//       } catch (err: any) {
//         setSystemEventsError("Failed to load system events");
//       } finally {
//         setSystemEventsLoading(false);
//       }
//     };
//     fetchSystemEvents();
//   }, [apiFetch, baseUrl]);

//   useEffect(() => {
//     fetchStats();
    
//   // }, [fetchStats, fetchSystemEvents, fetchSummary, fetchTransactionStats]);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [apiFetch, baseUrl]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <span className="text-lg font-semibold">{t("common.loading")}</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <ErrorDisplay
//         error={error}
//         onRetry={fetchStats}
//         variant="full"
//         showDismiss={false}
//       />
//     );
//   }

//   if (!stats) {
//     // Should not happen, but just in case
//     return null;
//   }

//   return (
//     <>
//       {/* Auth Error Modal */}
//       <Dialog open={showAuthModal}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{t("dashboard.authError")}</DialogTitle>
//           </DialogHeader>
//           <div className="py-4 text-center text-red-600">{authError}</div>
//           <DialogFooter>
//             <button
//               className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
//               onClick={() => { setShowAuthModal(false); router.push("/"); }}
//             >
//               {t("common.ok")}
//             </button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//       {/* Main Dashboard Content */}
//     <div className="space-y-10 px-4 py-8 max-w-7xl mx-auto">
//       {/* Dashboard Header */}
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold tracking-tight mb-1">{t("dashboard.adminDashboard")}</h1>
//         <p className="text-muted-foreground text-lg">{t("dashboard.liveOverview")}</p>
//       </div>

//         {/* All Stats Section */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//           {/* User Stats Filter */}
//           <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center gap-4 mb-2">
//             <Switch
//               id="active-users-toggle"
//               checked={showOnlyActiveUsers}
//               onCheckedChange={setShowOnlyActiveUsers}
//             />
//             <label htmlFor="active-users-toggle" className="text-sm font-medium">
//               {t("dashboard.showOnlyActiveUsers")}
//             </label>
//           </div>
//           {/* Task Stats */}
//           <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-blue-100 dark:border-blue-900">
//             <CardHeader className="flex flex-row items-center gap-3 w-full">
//               <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
//                 <ClipboardList className="text-blue-600 dark:text-blue-300 w-6 h-6" />
//               </div>
//               <CardTitle className="text-blue-700 dark:text-blue-200 text-lg">{t("dashboard.taskStats")}</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-2 w-full">
//               <div className="flex justify-between items-center"><span>{t("dashboard.activeTasks")}</span><Badge className="bg-blue-600 text-white">{stats.task_stats.active}</Badge></div>
//               <div className="flex justify-between items-center"><span>{t("dashboard.scheduledTasks")}</span><Badge className="bg-blue-400 text-white">{stats.task_stats.scheduled}</Badge></div>
//               <div className="flex justify-between items-center"><span>{t("dashboard.reservedTasks")}</span><Badge className="bg-blue-300 text-white">{stats.task_stats.reserved}</Badge></div>
//             </CardContent>
//           </Card>
//           {/* User Stats */}
//           <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-green-100 dark:border-green-900">
//             <CardHeader className="flex flex-row items-center gap-3 w-full">
//               <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
//                 <Users className="text-green-600 dark:text-green-300 w-6 h-6" />
//               </div>
//               <CardTitle className="text-green-700 dark:text-green-200 text-lg">{t("dashboard.userStats")}</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-2 w-full">
//               {showOnlyActiveUsers ? (
//                 <div className="flex justify-between items-center"><span>{t("dashboard.activeUsers")}</span><Badge className="bg-green-500 text-white">{stats.user_stats.active_users}</Badge></div>
//               ) : (
//                 <>
//                   <div className="flex justify-between items-center"><span>{t("dashboard.totalUsers")}</span><Badge className="bg-green-600 text-white">{stats.user_stats.total_users}</Badge></div>
//                   <div className="flex justify-between items-center"><span>{t("dashboard.activeUsers")}</span><Badge className="bg-green-500 text-white">{stats.user_stats.active_users}</Badge></div>
//                   <div className="flex justify-between items-center"><span>{t("dashboard.pendingUsers")}</span><Badge className="bg-yellow-500 text-white">{stats.user_stats.pending_users}</Badge></div>
//                   <div className="flex justify-between items-center"><span>{t("dashboard.verifiedUsers")}</span><Badge className="bg-green-400 text-white">{stats.user_stats.verified_users}</Badge></div>
//                   <div className="flex justify-between items-center"><span>{t("dashboard.usersRegisteredToday")}</span><Badge className="bg-blue-500 text-white">{stats.user_stats.users_registered_today}</Badge></div>
//                   <div className="flex justify-between items-center"><span>{t("dashboard.usersRegisteredWeek")}</span><Badge className="bg-blue-400 text-white">{stats.user_stats.users_registered_week}</Badge></div>
//                 </>
//               )}
//             </CardContent>
//           </Card>
//           {/* Code Stats */}
//           <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-yellow-100 dark:border-yellow-900">
//             <CardHeader className="flex flex-row items-center gap-3 w-full">
//               <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
//                 <KeyRound className="text-yellow-600 dark:text-yellow-300 w-6 h-6" />
//               </div>
//               <CardTitle className="text-yellow-700 dark:text-yellow-200 text-lg">{t("dashboard.codeStats")}</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-2 w-full">
//               <div className="flex justify-between items-center"><span>{t("dashboard.pendingPasswordReset")}</span><Badge className="bg-yellow-600 text-white">{stats.code_stats.pending_password_reset}</Badge></div>
//               <div className="flex justify-between items-center"><span>{t("dashboard.pendingEmailVerification")}</span><Badge className="bg-yellow-500 text-white">{stats.code_stats.pending_email_verification}</Badge></div>
//               <div className="flex justify-between items-center"><span>{t("dashboard.pendingPhoneVerification")}</span><Badge className="bg-yellow-400 text-white">{stats.code_stats.pending_phone_verification}</Badge></div>
//             </CardContent>
//           </Card>
//           {/* Notification Info */}
//           <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-purple-100 dark:border-purple-900 col-span-1 md:col-span-2 lg:col-span-1">
//             <CardHeader className="flex flex-row items-center gap-3 w-full">
//               <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
//                 <Bell className="text-purple-700 dark:text-purple-200 w-6 h-6" />
//               </div>
//               <CardTitle className="text-purple-700 dark:text-purple-200 text-lg">{t("dashboard.notificationInfo")}</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-2 w-full">
//               <div className="flex justify-between items-center"><span>{t("dashboard.emailService")}</span><span className="font-bold">{stats.notification_info.email_service}</span></div>
//               <div className="flex justify-between items-center"><span>{t("dashboard.smsService")}</span><span className="font-bold">{stats.notification_info.sms_service}</span></div>
//               <div className="flex justify-between items-center"><span>{t("dashboard.asyncEnabled")}</span><Badge className={stats.notification_info.async_enabled ? "bg-green-600 text-white" : "bg-red-600 text-white"}>{stats.notification_info.async_enabled ? t("dashboard.enabled") : t("dashboard.disabled")}</Badge></div>
//               <div className="flex justify-between items-center"><span>{t("dashboard.loggingEnabled")}</span><Badge className={stats.notification_info.logging_enabled ? "bg-green-600 text-white" : "bg-red-600 text-white"}>{stats.notification_info.logging_enabled ? t("dashboard.enabled") : t("dashboard.disabled")}</Badge></div>
//             </CardContent>
//           </Card>
//           {/* Timestamp */}
//           <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-gray-100 dark:border-gray-900 col-span-1 md:col-span-2 lg:col-span-1">
//             <CardHeader className="flex flex-row items-center gap-3 w-full">
//               <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full">
//                 <Clock className="text-gray-700 dark:text-gray-200 w-6 h-6" />
//               </div>
//               <CardTitle className="text-gray-700 dark:text-gray-200 text-lg">{t("dashboard.timestamp")}</CardTitle>
//             </CardHeader>
//             <CardContent className="w-full text-center font-mono text-sm text-gray-500 dark:text-gray-400">
//               {stats.timestamp}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Payment Summary Card */}
//         <div className="mb-8">
//           <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-indigo-100 dark:border-indigo-900">
//             <CardHeader className="flex flex-row items-center gap-3 w-full">
//               <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full">
//                 <TrendingUp className="text-indigo-700 dark:text-indigo-200 w-6 h-6" />
//               </div>
//               <CardTitle className="text-indigo-700 dark:text-indigo-200 text-lg">
//                 {t("dashboard.paymentSummary") || "Payment Summary"}
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-col gap-2 w-full">
//               {summaryLoading ? (
//                 <div className="flex items-center justify-center py-4">
//                   <Loader className="animate-spin mr-2" /> {t("common.loading")}
//                 </div>
//               ) : summaryError ? (
//                 <div className="text-red-600 text-center py-2">{summaryError}</div>
//               ) : summary ? (
//                 <div className="grid grid-cols-2 gap-4">
//                   <div>
//                     <span className="font-medium">{t("dashboard.todayTransactions") || "Today's Transactions"}:</span>
//                     <span className="ml-2">{summary.today_transactions}</span>
//                   </div>
//                   <div>
//                     <span className="font-medium">{t("dashboard.todayCompleted") || "Today's Completed"}:</span>
//                     <span className="ml-2">{summary.today_completed}</span>
//                   </div>
//                   <div>
//                     <span className="font-medium">{t("dashboard.todayRevenue") || "Today's Revenue"}:</span>
//                     <span className="ml-2">{summary.today_revenue}</span>
//                   </div>
//                   <div>
//                     <span className="font-medium">{t("dashboard.todaySuccessRate") || "Today's Success Rate"}:</span>
//                     <span className="ml-2">{summary.today_success_rate}%</span>
//                   </div>
//                   <div>
//                     <span className="font-medium">{t("dashboard.onlineDevices") || "Online Devices"}:</span>
//                     <span className="ml-2">{summary.online_devices}</span>
//                   </div>
//                   <div>
//                     <span className="font-medium">{t("dashboard.pendingTransactions") || "Pending Transactions"}:</span>
//                     <span className="ml-2">{summary.pending_transactions}</span>
//                   </div>
//                   <div className="col-span-2 text-right text-xs text-gray-500 mt-2">
//                     {t("dashboard.lastUpdated") || "Last Updated"}:{" "}
//                     {summary.last_updated ? new Date(summary.last_updated).toLocaleString() : "-"}
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-gray-500 text-center py-2">{t("dashboard.noData") || "No data"}</div>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//       {/* Transaction Stats Card */}
//       <div className="mb-8">
//         <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-pink-100 dark:border-pink-900">
//           <CardHeader className="flex flex-row items-center gap-3 w-full">
//             <div className="bg-pink-100 dark:bg-pink-900 p-2 rounded-full">
//               <TrendingUp className="text-pink-700 dark:text-pink-200 w-6 h-6" />
//             </div>
//             <CardTitle className="text-pink-700 dark:text-pink-200 text-lg">
//               {t("dashboard.transactionStats") || "Transaction Stats"}
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="flex flex-col gap-2 w-full">
//             {transactionStatsLoading ? (
//               <div className="flex items-center justify-center py-4">
//                 <Loader className="animate-spin mr-2" /> {t("common.loading")}
//               </div>
//             ) : transactionStatsError ? (
//               <div className="text-red-600 text-center py-2">{transactionStatsError}</div>
//             ) : transactionStats ? (
//               <div className="grid grid-cols-2 gap-4">
//                 <div><span className="font-medium">{t("dashboard.totalTransactions") || "Total Transactions"}:</span> <span className="ml-2">{transactionStats.total_transactions}</span></div>
//                 <div><span className="font-medium">{t("dashboard.completedTransactions") || "Completed"}:</span> <span className="ml-2">{transactionStats.completed_transactions}</span></div>
//                 <div><span className="font-medium">{t("dashboard.successTransactions") || "Success Transaction"}:</span> <span className="ml-2">{transactionStats.success_transactions ?? "-"}</span></div>
//                 <div><span className="font-medium">{t("dashboard.failedTransactions") || "Failed"}:</span> <span className="ml-2">{transactionStats.failed_transactions}</span></div>
//                 <div><span className="font-medium">{t("dashboard.pendingTransactions") || "Pending"}:</span> <span className="ml-2">{transactionStats.pending_transactions}</span></div>
//                 <div><span className="font-medium">{t("dashboard.processingTransactions") || "Processing"}:</span> <span className="ml-2">{transactionStats.processing_transactions}</span></div>
//                 <div><span className="font-medium">{t("dashboard.totalAmount") || "total amount"}:</span> <span className="ml-2">{transactionStats.total_amount}</span></div>
//                 <div><span className="font-medium">{t("dashboard.successRate") || "Success Rate"}:</span> <span className="ml-2">{transactionStats.success_rate}%</span></div>
//                 <div><span className="font-medium">{t("dashboard.avgProcessingTime") || "Avg. Processing Time"}:</span> <span className="ml-2">{transactionStats.avg_processing_time ?? "-"}</span></div>
//                 <div><span className="font-medium">{t("dashboard.totalAmount") || "Total Amount"}:</span> <span className="ml-2">{transactionStats.total_amount ?? "-"}</span></div>
//                 <div><span className="font-medium">{t("dashboard.depositsCount") || "Deposits"}:</span> <span className="ml-2">{transactionStats.deposits_count}</span></div>
//                 <div><span className="font-medium">{t("dashboard.withdrawalsCount") || "Withdrawals"}:</span> <span className="ml-2">{transactionStats.withdrawals_count}</span></div>
//                 <div><span className="font-medium">{t("dashboard.depositsAmount") || "Deposits Amount"}:</span> <span className="ml-2">{transactionStats.deposits_amount ?? "-"}</span></div>
//                 <div><span className="font-medium">{t("dashboard.withdrawalsAmount") || "Withdrawals Amount"}:</span> <span className="ml-2">{transactionStats.withdrawals_amount ?? "-"}</span></div>
                
//               </div>
//             ) : (
//               <div className="text-gray-500 text-center py-2">{t("dashboard.noData") || "No data"}</div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* System Events Card */}
//       <div className="mb-8">
//         <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-cyan-100 dark:border-cyan-900">
//           <CardHeader className="flex flex-row items-center gap-3 w-full">
//             <div className="bg-cyan-100 dark:bg-cyan-900 p-2 rounded-full">
//               <ServerCrash className="text-cyan-700 dark:text-cyan-200 w-6 h-6" />
//             </div>
//             <CardTitle className="text-cyan-700 dark:text-cyan-200 text-lg">
//               {t("dashboard.systemEvents") || "System Events"}
//             </CardTitle>
//           </CardHeader>
//           <CardContent className="flex flex-col gap-2 w-full">
//             {systemEventsLoading ? (
//               <div className="flex items-center justify-center py-4">
//                 <Loader className="animate-spin mr-2" /> {t("common.loading")}
//               </div>
//             ) : systemEventsError ? (
//               <div className="text-red-600 text-center py-2">{systemEventsError}</div>
//             ) : systemEvents && systemEvents.length > 0 ? (
//               <div className="divide-y divide-cyan-100 dark:divide-cyan-800">
//                 {systemEvents.slice(0, 5).map((event, idx) => (
//                   <div key={event.uid} className="py-2">
//                     <div className="flex items-center gap-2">
//                       <span className="font-semibold">{event.event_type.replace(/_/g, " ").toUpperCase()}</span>
//                       <span className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString()}</span>
//                       <Badge className="ml-2" variant="outline">{event.level}</Badge>
//                     </div>
//                     <div className="text-sm text-gray-700 dark:text-gray-200">{event.description}</div>
//                     {event.data && (
//                       <pre className="bg-cyan-50 dark:bg-cyan-950 rounded p-2 mt-1 text-xs overflow-x-auto">
//                         {JSON.stringify(event.data, null, 2)}
//                       </pre>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-gray-500 text-center py-2">{t("dashboard.noEvents") || "No recent events"}</div>
//             )}
//           </CardContent>
//         </Card>
//       </div>

//       {/* Trends Chart & Live Feed */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Trends Chart */}
//         {/* <div className="col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow p-6 flex flex-col">
//           <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{t("dashboard.userTaskActivity")}</h2>
//           <ChartContainer
//             config={{ users: { color: '#2563eb', label: t("dashboard.users") }, tasks: { color: '#16a34a', label: t("dashboard.tasks") } }}
//             className="h-72"
//           >
//             <ResponsiveContainer>
//               <LineChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
//                 <XAxis dataKey="time" stroke="#8884d8" />
//                 <YAxis stroke="#8884d8" />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} dot={false} />
//                 <Line type="monotone" dataKey="tasks" stroke="#16a34a" strokeWidth={2} dot={false} />
//               </LineChart>
//             </ResponsiveContainer>
//           </ChartContainer>
//         </div> */}
//         {/* Live Activity Feed */}
//         {/* <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 flex flex-col h-full">
//           <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{t("dashboard.liveActivityFeed")}</h2>
//           <div className="flex-1 overflow-y-auto max-h-72">
//             <Table>
//               <TableBody>
//                 {mockFeed.map((item, idx) => (
//                   <TableRow key={idx}>
//                     <TableCell className="w-24 text-muted-foreground">{item.time}</TableCell>
//                     <TableCell className="text-gray-900 dark:text-gray-100">{item.message}</TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         </div> */}
//       </div>
//     </div>
//     </>
//   )
// }


"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { ChartContainer } from "@/components/ui/chart"
import { useApi } from "@/lib/useApi"
import { useLanguage } from "@/components/providers/language-provider"
import { useRouter } from "next/navigation"
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClipboardList, Users, KeyRound, Bell, Clock, TrendingUp, Loader, ServerCrash, DollarSign, RefreshCw, UserCheck } from "lucide-react";
import { ErrorDisplay, extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

// Mock data for chart and activity feed
const mockChartData = [
  { time: "09:00", users: 10, tasks: 5 },
  { time: "10:00", users: 15, tasks: 8 },
  { time: "11:00", users: 20, tasks: 12 },
  { time: "12:00", users: 25, tasks: 15 },
  { time: "13:00", users: 30, tasks: 18 },
  { time: "14:00", users: 28, tasks: 16 },
  { time: "15:00", users: 35, tasks: 20 },
]
const mockFeed = [
  { time: "2 min ago", message: "User JohnDoe registered." },
  { time: "5 min ago", message: "Task #123 completed." },
  { time: "10 min ago", message: "User JaneSmith verified email." },
  { time: "15 min ago", message: "Task #124 scheduled." },
]

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [authError, setAuthError] = useState("")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOnlyActiveUsers, setShowOnlyActiveUsers] = useState(false)
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [transactionStatsLoading, setTransactionStatsLoading] = useState(false);
  const [transactionStatsError, setTransactionStatsError] = useState("");

  const [systemEvents, setSystemEvents] = useState<any[]>([]);
  const [systemEventsLoading, setSystemEventsLoading] = useState(false);
  const [systemEventsError, setSystemEventsError] = useState("");

  // New state for balance operations
  const [balanceOps, setBalanceOps] = useState<any>(null);
  const [balanceOpsLoading, setBalanceOpsLoading] = useState(false);
  const [balanceOpsError, setBalanceOpsError] = useState("");

  // Recharge requests stats state
  const [rechargeStats, setRechargeStats] = useState<any>(null);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeError, setRechargeError] = useState("");

  // Payment transaction stats state
  const [momoPayStats, setMomoPayStats] = useState<any>(null);
  const [momoPayLoading, setMomoPayLoading] = useState(false);
  const [momoPayError, setMomoPayError] = useState("");
  
  const [waveBusinessStats, setWaveBusinessStats] = useState<any>(null);
  const [waveBusinessLoading, setWaveBusinessLoading] = useState(false);
  const [waveBusinessError, setWaveBusinessError] = useState("");

  const apiFetch = useApi();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    setAuthError("");
    setShowAuthModal(false);
    try {
      const data = await apiFetch(`${baseUrl}api/auth/admin/notifications/stats/`);
      setStats(data);
      toast({
        title: t("dashboard.success"),
        description: t("dashboard.statsLoadedSuccessfully"),
      });
    } catch (err: any) {
      let backendError = extractErrorMessages(err) || t("dashboard.failedToLoadStats");
      // Detect authentication error (401 or token error)
      if (
        err?.code === 'token_not_valid' ||
        err?.status === 401 ||
        (typeof backendError === 'string' && backendError.toLowerCase().includes('token'))
      ) {
        setAuthError(backendError);
        setShowAuthModal(true);
        setLoading(false);
        return;
      }
      setError(backendError);
      toast({
        title: t("dashboard.failedToLoadStats"),
        description: backendError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary data
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      setSummaryError("");
      try {
        const res = await apiFetch(`${baseUrl}api/payments/dashboard/summary/`);
        setSummary(res);
      } catch (err: any) {
        setSummaryError("Failed to load payment summary");
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, [apiFetch, baseUrl]);

  // Fetch transaction stats
  useEffect(() => {
    const fetchTransactionStats = async () => {
      setTransactionStatsLoading(true);
      setTransactionStatsError("");
      try {
        const res = await apiFetch(`${baseUrl}api/payments/stats/transactions/`);
        setTransactionStats(res);
      } catch (err: any) {
        setTransactionStatsError("Failed to load transaction stats");
      } finally {
        setTransactionStatsLoading(false);
      }
    };
    fetchTransactionStats();
  }, [apiFetch, baseUrl]);

  // Fetch system events
  useEffect(() => {
    const fetchSystemEvents = async () => {
      setSystemEventsLoading(true);
      setSystemEventsError("");
      try {
        const res = await apiFetch(`${baseUrl}api/payments/system-events/`);
        setSystemEvents(res.results || []);
      } catch (err: any) {
        setSystemEventsError("Failed to load system events");
      } finally {
        setSystemEventsLoading(false);
      }
    };
    fetchSystemEvents();
  }, [apiFetch, baseUrl]);

  // Fetch balance operations stats
  useEffect(() => {
    const fetchBalanceOps = async () => {
      setBalanceOpsLoading(true);
      setBalanceOpsError("");
      try {
        const res = await apiFetch(`${baseUrl}api/payments/admin/balance-operations/stats/`);
        setBalanceOps(res);
      } catch (err: any) {
        setBalanceOpsError("Failed to load balance operations stats");
      } finally {
        setBalanceOpsLoading(false);
      }
    };
    fetchBalanceOps();
  }, [apiFetch, baseUrl]);

  // Fetch recharge requests stats
  useEffect(() => {
    const fetchRechargeStats = async () => {
      setRechargeLoading(true);
      setRechargeError("");
      try {
        const res = await apiFetch(`${baseUrl}api/payments/user/recharge_requests/stats/`);
        setRechargeStats(res);
      } catch (err: any) {
        setRechargeError("Failed to load recharge stats");
      } finally {
        setRechargeLoading(false);
      }
    };
    fetchRechargeStats();
  }, [apiFetch, baseUrl]);

  // Fetch MoMo Pay transaction stats
  useEffect(() => {
    const fetchMomoPayStats = async () => {
      setMomoPayLoading(true);
      setMomoPayError("");
      try {
        const res = await apiFetch(`${baseUrl}api/payments/momo-pay-transactions/stats/`);
        setMomoPayStats(res);
      } catch (err: any) {
        setMomoPayError("Failed to load MoMo Pay stats");
      } finally {
        setMomoPayLoading(false);
      }
    };
    fetchMomoPayStats();
  }, [apiFetch, baseUrl]);

  // Fetch Wave Business transaction stats
  useEffect(() => {
    const fetchWaveBusinessStats = async () => {
      setWaveBusinessLoading(true);
      setWaveBusinessError("");
      try {
        const res = await apiFetch(`${baseUrl}api/payments/wave-business-transactions/stats/`);
        setWaveBusinessStats(res);
      } catch (err: any) {
        setWaveBusinessError("Failed to load Wave Business stats");
      } finally {
        setWaveBusinessLoading(false);
      }
    };
    fetchWaveBusinessStats();
  }, [apiFetch, baseUrl]);

  useEffect(() => {
    fetchStats();
    
  // }, [fetchStats, fetchSystemEvents, fetchSummary, fetchTransactionStats]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFetch, baseUrl]);

  // Prepare chart data for financial overview
  const prepareFinancialChartData = () => {
    if (!summary || !transactionStats || !balanceOps) return [];

    return [
      {
        name: "Today's Revenue",
        value: parseFloat(summary.today_revenue) || 0,
        color: '#0088FE'
      },
      {
        name: "Total Adjustments",
        value: parseFloat(balanceOps.adjustments.total_credits.total) || 0,
        color: '#00C49F'
      },
      {
        name: "Total Refunds",
        value: parseFloat(balanceOps.refunds.total_amount) || 0,
        color: '#FF8042'
      }
    ];
  };

  // Prepare admin activity chart data
  const prepareAdminActivityData = () => {
    if (!balanceOps) return [];

    const adjustmentAdmins = balanceOps.adjustments.by_admin || [];
    const refundAdmins = balanceOps.refunds.by_admin || [];

    const adminMap = new Map();

    // Process adjustments
    adjustmentAdmins.forEach((admin: any) => {
      const email = admin.created_by__email;
      if (!adminMap.has(email)) {
        adminMap.set(email, {
          email,
          adjustments: 0,
          refunds: 0,
          total: 0
        });
      }
      const current = adminMap.get(email);
      current.adjustments = parseFloat(admin.total_amount) || 0;
      current.total += current.adjustments;
    });

    // Process refunds
    refundAdmins.forEach((admin: any) => {
      const email = admin.created_by__email;
      if (!adminMap.has(email)) {
        adminMap.set(email, {
          email,
          adjustments: 0,
          refunds: 0,
          total: 0
        });
      }
      const current = adminMap.get(email);
      current.refunds = parseFloat(admin.total_amount) || 0;
      current.total += current.refunds;
    });

    return Array.from(adminMap.values());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-lg font-semibold">{t("common.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchStats}
        variant="full"
        showDismiss={false}
      />
    );
  }

  if (!stats) {
    // Should not happen, but just in case
    return null;
  }

  const financialChartData = prepareFinancialChartData();
  const adminActivityData = prepareAdminActivityData();

  return (
    <>
      {/* Auth Error Modal */}
      <Dialog open={showAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.authError")}</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center text-red-600">{authError}</div>
          <DialogFooter>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
              onClick={() => { setShowAuthModal(false); router.push("/"); }}
            >
              {t("common.ok")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Main Dashboard Content */}
    <div className="space-y-10 px-4 py-8 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-1">{t("dashboard.adminDashboard")}</h1>
        <p className="text-muted-foreground text-lg">{t("dashboard.liveOverview")}</p>
      </div>

      {/* Recharge Requests Stats Card */}
        <div className="mb-8">
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-sky-100 dark:border-sky-900">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-sky-100 dark:bg-sky-900 p-2 rounded-full">
                <RefreshCw className="text-sky-700 dark:text-sky-200 w-6 h-6" />
              </div>
              <CardTitle className="text-sky-700 dark:text-sky-200 text-lg">
                {t("dashboard.rechargeRequestsStats") || "Recharge Requests Stats"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 w-full">
              {rechargeLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="animate-spin mr-2" /> {t("common.loading")}
                </div>
              ) : rechargeError ? (
                <div className="text-red-600 text-center py-2">{rechargeError}</div>
              ) : rechargeStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-sky-50 dark:bg-sky-950 p-3 rounded-lg">
                    <span className="font-medium text-sky-700 dark:text-sky-300">
                      {t("dashboard.totalRequests") || "Total Requests"}:
                    </span>
                    <div className="text-lg font-bold text-sky-800 dark:text-sky-200">
                      {rechargeStats.total_requests}
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      {t("dashboard.pendingReview") || "Pending Review"}:
                    </span>
                    <div className="text-lg font-bold text-amber-800 dark:text-amber-200">
                      {rechargeStats.pending_review}
                    </div>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg">
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      {t("dashboard.totalApprovedAmount") || "Total Approved Amount"}:
                    </span>
                    <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                      {rechargeStats.total_approved_amount}
                    </div>
                  </div>

                  {/* By Status */}
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 p-3 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">
                      {t("dashboard.byStatus") || "By Status"}
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      {Object.entries(rechargeStats.by_status || {}).map(([key, val]: any) => (
                        <div key={key} className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                          <div className="text-sm font-medium">{val.name}</div>
                          <div className="text-lg font-bold">{val.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Month Stats */}
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-indigo-50 dark:bg-indigo-950 p-3 rounded-lg">
                    <span className="font-medium text-indigo-700 dark:text-indigo-300 block mb-2">
                      {t("dashboard.currentMonth") || "Current Month"}
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-300">{t("dashboard.totalRequests") || "Total Requests"}</div>
                        <div className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{rechargeStats.month_stats?.total_requests}</div>
                      </div>
                      <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-300">{t("dashboard.approvedCount") || "Approved Count"}</div>
                        <div className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{rechargeStats.month_stats?.approved_count}</div>
                      </div>
                      <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-300">{t("dashboard.approvedAmount") || "Approved Amount"}</div>
                        <div className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{rechargeStats.month_stats?.approved_amount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-300">{t("dashboard.approvalRate") || "Approval Rate"}</div>
                        <div className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{(rechargeStats.month_stats?.approval_rate ?? 0).toFixed(2)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-2">{t("dashboard.noData") || "No data"}</div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Payment Transaction Stats Section */}
      <div className="mb-8">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t("dashboard.paymentTransactionStats") || "Payment Transaction Statistics"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("dashboard.paymentTransactionStatsDescription") || "Real-time statistics for MoMo Pay and Wave Business transactions"}
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MoMo Pay Stats */}
          <Card className="hover:shadow-lg transition-shadow border-teal-100 dark:border-teal-900">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-teal-100 dark:bg-teal-900 p-3 rounded-full">
                <DollarSign className="text-teal-700 dark:text-teal-200 w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-teal-700 dark:text-teal-200 text-xl">
                  {t("dashboard.momoPayStats") || "MoMo Pay Statistics"}
                </CardTitle>
                <p className="text-sm text-teal-600 dark:text-teal-300">
                  {t("dashboard.mobileMoneyTransactions") || "Mobile Money Transactions"}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {momoPayLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin mr-2" /> {t("common.loading")}
                </div>
              ) : momoPayError ? (
                <div className="text-red-600 text-center py-4">{momoPayError}</div>
              ) : momoPayStats ? (
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-teal-50 dark:bg-teal-950 p-4 rounded-lg">
                      <div className="text-sm font-medium text-teal-700 dark:text-teal-300">
                        {t("dashboard.totalTransactions") || "Total Transactions"}
                      </div>
                      <div className="text-2xl font-bold text-teal-800 dark:text-teal-200">
                        {momoPayStats.total_transactions?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                      <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {t("dashboard.totalAmount") || "Total Amount"}
                      </div>
                      <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                        {momoPayStats.total_amount ? `${parseFloat(momoPayStats.total_amount).toLocaleString("fr-FR")} FCFA` : "0 FCFA"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Breakdown */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {t("dashboard.statusBreakdown") || "Status Breakdown"}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.pending") || "Pending"}
                        </span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {momoPayStats.pending_count || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.confirmed") || "Confirmed"}
                        </span>
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {momoPayStats.confirmed_count || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.cancelled") || "Cancelled"}
                        </span>
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          {momoPayStats.cancelled_count || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.expired") || "Expired"}
                        </span>
                        <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          {momoPayStats.expired_count || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">{t("dashboard.noData") || "No data available"}</div>
              )}
            </CardContent>
          </Card>

          {/* Wave Business Stats */}
          <Card className="hover:shadow-lg transition-shadow border-purple-100 dark:border-purple-900">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                <TrendingUp className="text-purple-700 dark:text-purple-200 w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-purple-700 dark:text-purple-200 text-xl">
                  {t("dashboard.waveBusinessStats") || "Wave Business Statistics"}
                </CardTitle>
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  {t("dashboard.waveBusinessTransactions") || "Wave Business Transactions"}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {waveBusinessLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="animate-spin mr-2" /> {t("common.loading")}
                </div>
              ) : waveBusinessError ? (
                <div className="text-red-600 text-center py-4">{waveBusinessError}</div>
              ) : waveBusinessStats ? (
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                      <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        {t("dashboard.totalTransactions") || "Total Transactions"}
                      </div>
                      <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                        {waveBusinessStats.total_transactions?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-950 p-4 rounded-lg">
                      <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                        {t("dashboard.totalAmount") || "Total Amount"}
                      </div>
                      <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                        {waveBusinessStats.total_amount ? `${parseFloat(waveBusinessStats.total_amount).toLocaleString("fr-FR")} FCFA` : "0 FCFA"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Breakdown */}
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      {t("dashboard.statusBreakdown") || "Status Breakdown"}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.pending") || "Pending"}
                        </span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          {waveBusinessStats.pending_count || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.confirmed") || "Confirmed"}
                        </span>
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {waveBusinessStats.confirmed_count || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.cancelled") || "Cancelled"}
                        </span>
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                          {waveBusinessStats.cancelled_count || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t("dashboard.expired") || "Expired"}
                        </span>
                        <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          {waveBusinessStats.expired_count || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">{t("dashboard.noData") || "No data available"}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Balance Operations Stats Card */}
        <div className="mb-8">
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-emerald-100 dark:border-emerald-900">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-full">
                <DollarSign className="text-emerald-700 dark:text-emerald-200 w-6 h-6" />
              </div>
              <CardTitle className="text-emerald-700 dark:text-emerald-200 text-lg">
                {t("dashboard.balanceOperations") || "Balance Operations"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 w-full">
              {balanceOpsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="animate-spin mr-2" /> {t("common.loading")}
                </div>
              ) : balanceOpsError ? (
                <div className="text-red-600 text-center py-2">{balanceOpsError}</div>
              ) : balanceOps ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-lg">
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      {t("dashboard.periodDays") || "Period (Days)"}:
                    </span>
                    <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                      {balanceOps.period_days}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                    <span className="font-medium text-blue-700 dark:text-blue-300">
                      {t("dashboard.totalAdjustments") || "Total Adjustments"}:
                    </span>
                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
                      {balanceOps.adjustments.total_count} operations
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                    <span className="font-medium text-green-700 dark:text-green-300">
                      {t("dashboard.totalCredits") || "Total Credits"}:
                    </span>
                    <div className="text-lg font-bold text-green-800 dark:text-green-200">
                      {balanceOps.adjustments.total_credits.count} operations
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      Montant: {balanceOps.adjustments.total_credits.total || 0}
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                    <span className="font-medium text-orange-700 dark:text-orange-300">
                      {t("dashboard.totalDebits") || "Total Debits"}:
                    </span>
                    <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
                      {balanceOps.adjustments.total_debits.count} operations
                    </div>
                    <div className="text-sm text-orange-600 dark:text-orange-400">
                      Montant: {balanceOps.adjustments.total_debits.total || 0}
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                    <span className="font-medium text-red-700 dark:text-red-300">
                      {t("dashboard.totalRefunds") || "Total Refunds"}:
                    </span>
                    <div className="text-lg font-bold text-red-800 dark:text-red-200">
                      {balanceOps.refunds.total_count} operations
                    </div>
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Montant: {balanceOps.refunds.total_amount || 0}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {t("dashboard.generatedAt") || "Generated At"}:
                    </span>
                    <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                      {new Date(balanceOps.generated_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Admin Activity Summary */}
                  {balanceOps.adjustments.by_admin && balanceOps.adjustments.by_admin.length > 0 && (
                    <div className="col-span-2 lg:col-span-3 bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                      <span className="font-medium text-purple-700 dark:text-purple-300 block mb-2">
                        {t("dashboard.adminActivity") || "Admin Activity"}:
                      </span>
                      <div className="space-y-2">
                        {balanceOps.adjustments.by_admin.map((admin: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {admin.created_by__email}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {admin.created_by__first_name} {admin.created_by__last_name}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="mb-1">
                                {admin.count} operations
                              </Badge>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Montant: {admin.total_amount}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-2">{t("dashboard.noData") || "No data"}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Stats Filter */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center gap-4 mb-2">
            <Switch
              id="active-users-toggle"
              checked={showOnlyActiveUsers}
              onCheckedChange={setShowOnlyActiveUsers}
            />
            <label htmlFor="active-users-toggle" className="text-sm font-medium">
              {t("dashboard.showOnlyActiveUsers")}
            </label>
          </div>
          {/* Task Stats */}
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-blue-100 dark:border-blue-900">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <ClipboardList className="text-blue-600 dark:text-blue-300 w-6 h-6" />
              </div>
              <CardTitle className="text-blue-700 dark:text-blue-200 text-lg">{t("dashboard.taskStats")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center"><span>{t("dashboard.activeTasks")}</span><Badge className="bg-blue-600 text-white">{stats.task_stats.active}</Badge></div>
              <div className="flex justify-between items-center"><span>{t("dashboard.scheduledTasks")}</span><Badge className="bg-blue-400 text-white">{stats.task_stats.scheduled}</Badge></div>
              <div className="flex justify-between items-center"><span>{t("dashboard.reservedTasks")}</span><Badge className="bg-blue-300 text-white">{stats.task_stats.reserved}</Badge></div>
            </CardContent>
          </Card>
          {/* User Stats */}
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-green-100 dark:border-green-900">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                <Users className="text-green-600 dark:text-green-300 w-6 h-6" />
              </div>
              <CardTitle className="text-green-700 dark:text-green-200 text-lg">{t("dashboard.userStats")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 w-full">
              {showOnlyActiveUsers ? (
                <div className="flex justify-between items-center"><span>{t("dashboard.activeUsers")}</span><Badge className="bg-green-500 text-white">{stats.user_stats.active_users}</Badge></div>
              ) : (
                <>
                  <div className="flex justify-between items-center"><span>{t("dashboard.totalUsers")}</span><Badge className="bg-green-600 text-white">{stats.user_stats.total_users}</Badge></div>
                  <div className="flex justify-between items-center"><span>{t("dashboard.activeUsers")}</span><Badge className="bg-green-500 text-white">{stats.user_stats.active_users}</Badge></div>
                  <div className="flex justify-between items-center"><span>{t("dashboard.pendingUsers")}</span><Badge className="bg-yellow-500 text-white">{stats.user_stats.pending_users}</Badge></div>
                  <div className="flex justify-between items-center"><span>{t("dashboard.verifiedUsers")}</span><Badge className="bg-green-400 text-white">{stats.user_stats.verified_users}</Badge></div>
                  <div className="flex justify-between items-center"><span>{t("dashboard.usersRegisteredToday")}</span><Badge className="bg-blue-500 text-white">{stats.user_stats.users_registered_today}</Badge></div>
                  <div className="flex justify-between items-center"><span>{t("dashboard.usersRegisteredWeek")}</span><Badge className="bg-blue-400 text-white">{stats.user_stats.users_registered_week}</Badge></div>
                </>
              )}
            </CardContent>
          </Card>
          {/* Code Stats */}
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-yellow-100 dark:border-yellow-900">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
                <KeyRound className="text-yellow-600 dark:text-yellow-300 w-6 h-6" />
              </div>
              <CardTitle className="text-yellow-700 dark:text-yellow-200 text-lg">{t("dashboard.codeStats")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center"><span>{t("dashboard.pendingPasswordReset")}</span><Badge className="bg-yellow-600 text-white">{stats.code_stats.pending_password_reset}</Badge></div>
              <div className="flex justify-between items-center"><span>{t("dashboard.pendingEmailVerification")}</span><Badge className="bg-yellow-500 text-white">{stats.code_stats.pending_email_verification}</Badge></div>
              <div className="flex justify-between items-center"><span>{t("dashboard.pendingPhoneVerification")}</span><Badge className="bg-yellow-400 text-white">{stats.code_stats.pending_phone_verification}</Badge></div>
            </CardContent>
          </Card>
          {/* Notification Info */}
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-purple-100 dark:border-purple-900 col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                <Bell className="text-purple-700 dark:text-purple-200 w-6 h-6" />
              </div>
              <CardTitle className="text-purple-700 dark:text-purple-200 text-lg">{t("dashboard.notificationInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center"><span>{t("dashboard.emailService")}</span><span className="font-bold">{stats.notification_info.email_service}</span></div>
              <div className="flex justify-between items-center"><span>{t("dashboard.smsService")}</span><span className="font-bold">{stats.notification_info.sms_service}</span></div>
              <div className="flex justify-between items-center"><span>{t("dashboard.asyncEnabled")}</span><Badge className={stats.notification_info.async_enabled ? "bg-green-600 text-white" : "bg-red-600 text-white"}>{stats.notification_info.async_enabled ? t("dashboard.enabled") : t("dashboard.disabled")}</Badge></div>
              <div className="flex justify-between items-center"><span>{t("dashboard.loggingEnabled")}</span><Badge className={stats.notification_info.logging_enabled ? "bg-green-600 text-white" : "bg-red-600 text-white"}>{stats.notification_info.logging_enabled ? t("dashboard.enabled") : t("dashboard.disabled")}</Badge></div>
            </CardContent>
          </Card>
          {/* Timestamp */}
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-gray-100 dark:border-gray-900 col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded-full">
                <Clock className="text-gray-700 dark:text-gray-200 w-6 h-6" />
              </div>
              <CardTitle className="text-gray-700 dark:text-gray-200 text-lg">{t("dashboard.timestamp")}</CardTitle>
            </CardHeader>
            <CardContent className="w-full text-center font-mono text-sm text-gray-500 dark:text-gray-400">
              {stats.timestamp}
            </CardContent>
          </Card>
        </div>

        {/* Financial Overview Charts */}
      {financialChartData.length > 0 && (
        <div className="mb-8">
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-violet-100 dark:border-violet-900">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-violet-100 dark:bg-violet-900 p-2 rounded-full">
                <TrendingUp className="text-violet-700 dark:text-violet-200 w-6 h-6" />
              </div>
              <CardTitle className="text-violet-700 dark:text-violet-200 text-lg">
                {t("dashboard.financialOverview") || "Financial Overview"}
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financialChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {financialChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Activity Chart */}
      {adminActivityData.length > 0 && (
        <div className="mb-8">
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-amber-100 dark:border-amber-900">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
                <UserCheck className="text-amber-700 dark:text-amber-200 w-6 h-6" />
              </div>
              <CardTitle className="text-amber-700 dark:text-amber-200 text-lg">
                {t("dashboard.adminActivityChart") || "Admin Activity Overview"}
              </CardTitle>
            </CardHeader>
            <CardContent className="w-full">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminActivityData}>
                    <XAxis 
                      dataKey="email" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="adjustments" fill="#00C49F" name="Adjustments" />
                    <Bar dataKey="refunds" fill="#FF8042" name="Refunds" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

        

        {/* Payment Summary Card */}
        <div className="mb-8">
          <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-indigo-100 dark:border-indigo-900">
            <CardHeader className="flex flex-row items-center gap-3 w-full">
              <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full">
                <TrendingUp className="text-indigo-700 dark:text-indigo-200 w-6 h-6" />
              </div>
              <CardTitle className="text-indigo-700 dark:text-indigo-200 text-lg">
                {t("dashboard.paymentSummary") || "Payment Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 w-full">
              {summaryLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader className="animate-spin mr-2" /> {t("common.loading")}
                </div>
              ) : summaryError ? (
                <div className="text-red-600 text-center py-2">{summaryError}</div>
              ) : summary ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">{t("dashboard.todayTransactions") || "Today's Transactions"}:</span>
                    <span className="ml-2">{summary.today_transactions}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t("dashboard.todayCompleted") || "Today's Completed"}:</span>
                    <span className="ml-2">{summary.today_completed}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t("dashboard.todayRevenue") || "Today's Revenue"}:</span>
                    <span className="ml-2">{summary.today_revenue}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t("dashboard.todaySuccessRate") || "Today's Success Rate"}:</span>
                    <span className="ml-2">{summary.today_success_rate.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">{t("dashboard.onlineDevices") || "Online Devices"}:</span>
                    <span className="ml-2">{summary.online_devices}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t("dashboard.pendingTransactions") || "Pending Transactions"}:</span>
                    <span className="ml-2">{summary.pending_transactions}</span>
                  </div>
                  <div className="col-span-2 text-right text-xs text-gray-500 mt-2">
                    {t("dashboard.lastUpdated") || "Last Updated"}:{" "}
                    {summary.last_updated ? new Date(summary.last_updated).toLocaleString() : "-"}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-2">{t("dashboard.noData") || "No data"}</div>
              )}
            </CardContent>
          </Card>
        </div>

      {/* Transaction Stats Card */}
      <div className="mb-8">
        <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-pink-100 dark:border-pink-900">
          <CardHeader className="flex flex-row items-center gap-3 w-full">
            <div className="bg-pink-100 dark:bg-pink-900 p-2 rounded-full">
              <TrendingUp className="text-pink-700 dark:text-pink-200 w-6 h-6" />
            </div>
            <CardTitle className="text-pink-700 dark:text-pink-200 text-lg">
              {t("dashboard.transactionStats") || "Transaction Stats"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 w-full">
            {transactionStatsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="animate-spin mr-2" /> {t("common.loading")}
              </div>
            ) : transactionStatsError ? (
              <div className="text-red-600 text-center py-2">{transactionStatsError}</div>
            ) : transactionStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-medium">{t("dashboard.totalTransactions") || "Total Transactions"}:</span> <span className="ml-2">{transactionStats.total_transactions}</span></div>
                <div><span className="font-medium">{t("dashboard.completedTransactions") || "Completed"}:</span> <span className="ml-2">{transactionStats.completed_transactions}</span></div>
                <div><span className="font-medium">{t("dashboard.successTransactions") || "Success Transaction"}:</span> <span className="ml-2">{transactionStats.success_transactions ?? "-"}</span></div>
                <div><span className="font-medium">{t("dashboard.failedTransactions") || "Failed"}:</span> <span className="ml-2">{transactionStats.failed_transactions}</span></div>
                <div><span className="font-medium">{t("dashboard.pendingTransactions") || "Pending"}:</span> <span className="ml-2">{transactionStats.pending_transactions}</span></div>
                <div><span className="font-medium">{t("dashboard.processingTransactions") || "Processing"}:</span> <span className="ml-2">{transactionStats.processing_transactions}</span></div>
                <div><span className="font-medium">{t("dashboard.totalAmount") || "total amount"}:</span> <span className="ml-2">{transactionStats.total_amount}</span></div>
                <div><span className="font-medium">{t("dashboard.successRate") || "Success Rate"}:</span> <span className="ml-2">{transactionStats.success_rate}%</span></div>
                <div><span className="font-medium">{t("dashboard.avgProcessingTime") || "Avg. Processing Time"}:</span> <span className="ml-2">{transactionStats.avg_processing_time ?? "-"}</span></div>
                <div><span className="font-medium">{t("dashboard.totalAmount") || "Total Amount"}:</span> <span className="ml-2">{transactionStats.total_amount ?? "-"}</span></div>
                <div><span className="font-medium">{t("dashboard.depositsCount") || "Deposits"}:</span> <span className="ml-2">{transactionStats.deposits_count}</span></div>
                <div><span className="font-medium">{t("dashboard.withdrawalsCount") || "Withdrawals"}:</span> <span className="ml-2">{transactionStats.withdrawals_count}</span></div>
                <div><span className="font-medium">{t("dashboard.depositsAmount") || "Deposits Amount"}:</span> <span className="ml-2">{transactionStats.deposits_amount ?? "-"}</span></div>
                <div><span className="font-medium">{t("dashboard.withdrawalsAmount") || "Withdrawals Amount"}:</span> <span className="ml-2">{transactionStats.withdrawals_amount ?? "-"}</span></div>
                
              </div>
            ) : (
              <div className="text-gray-500 text-center py-2">{t("dashboard.noData") || "No data"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Events Card */}
      <div className="mb-8">
        <Card className="flex flex-col items-center hover:shadow-lg transition-shadow border-cyan-100 dark:border-cyan-900">
          <CardHeader className="flex flex-row items-center gap-3 w-full">
            <div className="bg-cyan-100 dark:bg-cyan-900 p-2 rounded-full">
              <ServerCrash className="text-cyan-700 dark:text-cyan-200 w-6 h-6" />
            </div>
            <CardTitle className="text-cyan-700 dark:text-cyan-200 text-lg">
              {t("dashboard.systemEvents") || "System Events"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 w-full">
            {systemEventsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="animate-spin mr-2" /> {t("common.loading")}
              </div>
            ) : systemEventsError ? (
              <div className="text-red-600 text-center py-2">{systemEventsError}</div>
            ) : systemEvents && systemEvents.length > 0 ? (
              <div className="divide-y divide-cyan-100 dark:divide-cyan-800">
                {systemEvents.slice(0, 5).map((event, idx) => (
                  <div key={event.uid} className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{event.event_type.replace(/_/g, " ").toUpperCase()}</span>
                      <span className="text-xs text-gray-400">{new Date(event.created_at).toLocaleString()}</span>
                      <Badge className="ml-2" variant="outline">{event.level}</Badge>
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-200">{event.description}</div>
                    {event.data && (
                      <pre className="bg-cyan-50 dark:bg-cyan-950 rounded p-2 mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-2">{t("dashboard.noEvents") || "No recent events"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      

      {/* Trends Chart & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trends Chart */}
        {/* <div className="col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{t("dashboard.userTaskActivity")}</h2>
          <ChartContainer
            config={{ users: { color: '#2563eb', label: t("dashboard.users") }, tasks: { color: '#16a34a', label: t("dashboard.tasks") } }}
            className="h-72"
          >
            <ResponsiveContainer>
              <LineChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="time" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="tasks" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div> */}
        {/* Live Activity Feed */}
        {/* <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">{t("dashboard.liveActivityFeed")}</h2>
          <div className="flex-1 overflow-y-auto max-h-72">
            <Table>
              <TableBody>
                {mockFeed.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="w-24 text-muted-foreground">{item.time}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{item.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div> */}
      </div>
    </div>
    </>
  )
}