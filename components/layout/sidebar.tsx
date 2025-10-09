"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/providers/language-provider"
import { BarChart3, Users, CreditCard, LogOut, Menu, X, Zap, ChevronDown, ChevronUp, Globe, Share2, Phone, Monitor, MessageCircle, Bell, Settings, Terminal, User, ArrowRightLeft, Gamepad2, Shield, DollarSign, Receipt } from "lucide-react"
import { clearTokens } from "@/lib/api"

// const navigation = [
//   { name: "nav.dashboard", href: "/dashboard", icon: BarChart3 },
//   { name: "nav.users", href: "/dashboard/users", icon: Users },
//   { name: "nav.transactions", href: "/dashboard/transactions", icon: CreditCard },
// ]

export function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [usersDropdownOpen, setUsersDropdownOpen] = useState(false)
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false)
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false)
  const [devicesDropdownOpen, setDevicesDropdownOpen] = useState(false)
  const [networkConfigDropdownOpen, setNetworkConfigDropdownOpen] = useState(false)
  const [platformsDropdownOpen, setPlatformsDropdownOpen] = useState(false)
  const [permissionsDropdownOpen, setPermissionsDropdownOpen] = useState(false)
  const [commissionDropdownOpen, setCommissionDropdownOpen] = useState(false)
  const [apiConfigDropdownOpen, setApiConfigDropdownOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLanguage()

  // Helper to check if a path is active or a child is active
  const isUsersActive = pathname.startsWith("/dashboard/users")
  const isRegisterActive = pathname === "/dashboard/users/register"
  const isListActive = pathname === "/dashboard/users/list"

  // Active logic for new dropdowns
  const isCountryActive = pathname.startsWith("/dashboard/country")
  const isCountryListActive = pathname === "/dashboard/country/list"
  const isCountryCreateActive = pathname === "/dashboard/country/create"

  const isNetworkActive = pathname.startsWith("/dashboard/network")
  const isNetworkListActive = pathname === "/dashboard/network/list"
  const isNetworkCreateActive = pathname === "/dashboard/network/create"

  const isDevicesActive = pathname.startsWith("/dashboard/devices")
  const isDevicesListActive = pathname === "/dashboard/devices/list"

  const isNetworkConfigActive = pathname.startsWith("/dashboard/network-config")
  const isNetworkConfigListActive = pathname === "/dashboard/network-config/list"
  const isNetworkConfigCreateActive = pathname === "/dashboard/network-config/create"

  const isPlatformsActive = pathname.startsWith("/dashboard/platforms")
  const isPlatformsListActive = pathname === "/dashboard/platforms/list"
  const isPlatformsCreateActive = pathname === "/dashboard/platforms/create"

  const isPermissionsActive = pathname.startsWith("/dashboard/permissions")
  const isPermissionsListActive = pathname === "/dashboard/permissions/list"
  const isPermissionsCreateActive = pathname === "/dashboard/permissions/create"
  const isPermissionsSummaryActive = pathname === "/dashboard/permissions/partners-summary"

  const isCommissionActive = pathname.startsWith("/dashboard/commission")
  const isCommissionConfigActive = pathname === "/dashboard/commission-config/list"
  const isCommissionPaymentsActive = pathname === "/dashboard/commission-payments"

  const isBettingTransactionsActive = pathname.startsWith("/dashboard/betting-transactions")

  const isApiConfigActive = pathname.startsWith("/dashboard/api-config")
  const isApiConfigListActive = pathname === "/dashboard/api-config/list"

  const handleLogout = () => {
    clearTokens();
    if (typeof document !== 'undefined') {
      document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
    }
    localStorage.removeItem("isAuthenticated");
    router.push("/");
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", sidebarOpen ? "block" : "hidden")}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800 h-full min-h-0">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Connect Pro Logo" className="h-20 w-20" />
              {/* <span className="text-xl font-bold">Connect Pro</span> */}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto min-h-0">
            <Link
              href="/dashboard"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <BarChart3 className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.dashboard")}
            </Link>
            {/* <Link href="/dashboard/platforms/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/platforms/list" || pathname.startsWith("/dashboard/platforms/")
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"  
            )}>
              <Gamepad2 className="mr-3 h-6 w-6 flex-shrink-0" />
              Platforms
            </Link>
            <Link href="/dashboard/permissions/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/permissions/list" || pathname.startsWith("/dashboard/permissions/")
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"  
            )}>
              <Shield className="mr-3 h-6 w-6 flex-shrink-0" />
              Permissions
            </Link> */}
            {/* <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isCommissionActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setCommissionDropdownOpen((open) => !open)}
                aria-expanded={commissionDropdownOpen}
              >
                <DollarSign className="mr-3 h-6 w-6 flex-shrink-0" />
                Commission
                {commissionDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  commissionDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link
                  href="/dashboard/commission-config/list"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isCommissionConfigActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  Config Management
                </Link>
                <Link
                  href="/dashboard/commission-payments"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isCommissionPaymentsActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  Payments
                </Link>
              </div>
            </div>
            <Link href="/dashboard/betting-transactions" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname.startsWith("/dashboard/betting-transactions")
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"  
            )}>
              <Receipt className="mr-3 h-6 w-6 flex-shrink-0" />
              Betting Transactions
            </Link>
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isApiConfigActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setApiConfigDropdownOpen((open) => !open)}
                aria-expanded={apiConfigDropdownOpen}
              >
                <Settings className="mr-3 h-6 w-6 flex-shrink-0" />
                API Config
                {apiConfigDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  apiConfigDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link
                  href="/dashboard/api-config/list"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isApiConfigListActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  Configuration List
                </Link>
                <Link
                  href="/dashboard/api-config/create"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    !isApiConfigListActive && isApiConfigActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  Create Config
                </Link>
              </div>
            </div> */}
            {/* Users Dropdown */}
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isUsersActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setUsersDropdownOpen((open) => !open)}
                aria-expanded={usersDropdownOpen}
              >
                <Users className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.users")}
                {usersDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  usersDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link
                  href="/dashboard/users/register"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isRegisterActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {t("nav.register")}
                </Link>
                <Link
                  href="/dashboard/users/list"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isListActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  {t("nav.userList")}
                </Link>
              </div>
            </div>
            <Link
              href="/dashboard/transactions"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard/transactions"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.transactions")}
            </Link>
            {/* <Link
              href="/dashboard/transfers"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard/transfers" || pathname.startsWith("/dashboard/transfers/")
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <ArrowRightLeft className="mr-3 h-6 w-6 flex-shrink-0" />
              Partner Transfers
            </Link> */}
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isCountryActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setCountryDropdownOpen((open) => !open)}
                aria-expanded={countryDropdownOpen}
              >
                <Globe className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.country")}
                {countryDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  countryDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link href="/dashboard/country/list" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isCountryListActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.countryList")}</Link>
                <Link href="/dashboard/country/create" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isCountryCreateActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.countryCreate")}</Link>
              </div>
            </div>
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isNetworkActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setNetworkDropdownOpen((open) => !open)}
                aria-expanded={networkDropdownOpen}
              >
                <Share2 className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.network")}
                {networkDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  networkDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link href="/dashboard/network/list" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isNetworkListActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.networkList")}</Link>
                <Link href="/dashboard/network/create" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isNetworkCreateActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.networkCreate")}</Link>
              </div>
            </div>
            <Link href="/dashboard/phone-number/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/phone-number/list"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <Phone className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.phoneNumbers")}
            </Link>
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isDevicesActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setDevicesDropdownOpen((open) => !open)}
                aria-expanded={devicesDropdownOpen}
              >
                <Monitor className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.devices")}
                {devicesDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  devicesDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link href="/dashboard/devices/list" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isDevicesListActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.devicesList")}</Link>
              </div>
            </div>
            <Link href="/dashboard/sms-logs/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/sms-logs/list"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <MessageCircle className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.smsLogs")}
            </Link>
            <Link href="/dashboard/fcm-logs/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/fcm-logs/list"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <Bell className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.fcmLogs")}
            </Link>
            <Link href="/dashboard/partner" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/partner"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <User className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.partner")}
            </Link>
            <Link href="/dashboard/topup" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/topup"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <CreditCard className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("topup.title")}
            </Link>
            <Link href="/dashboard/earning-management" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/earning-management"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <BarChart3 className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("earning.title")}
            </Link>
            <Link
              href="/dashboard/momo-pay-transactions"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard/momo-pay-transactions"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("MoMo Pay Transactions")}
            </Link>
            <Link
              href="/dashboard/wave-business-transaction"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard/wave-business-transaction"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("Wave Business Transaction")}
            </Link>
            {/* <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isNetworkConfigActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setNetworkConfigDropdownOpen((open) => !open)}
                aria-expanded={networkConfigDropdownOpen}
              >
                <Settings className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.networkConfig")}
                {networkConfigDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  networkConfigDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link href="/dashboard/network-config/list" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isNetworkConfigListActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.networkConfigList")}</Link>
                <Link href="/dashboard/network-config/create" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isNetworkConfigCreateActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.networkConfigCreate")}</Link>
              </div>
            </div>
            <Link href="/dashboard/remote-command/create" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/remote-command/create"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <Terminal className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.remoteCommand")}
            </Link> */}
          </nav>
          <div className="p-4">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-3 h-6 w-6" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full min-h-0">
          {/* Make sidebar scrollable if content overflows */}
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Connect Pro Logo" className="h-8 w-8" />
              <span className="text-xl font-bold">Connect Pro</span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto min-h-0">
            <Link
              href="/dashboard"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
            >
              <BarChart3 className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.dashboard")}
            </Link>
            {/* <Link href="/dashboard/platforms/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/platforms/list" || pathname.startsWith("/dashboard/platforms/")
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            )}>
              <Gamepad2 className="mr-3 h-6 w-6 flex-shrink-0" />
              Platforms
            </Link>
            <Link href="/dashboard/permissions/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/permissions/list" || pathname.startsWith("/dashboard/permissions/")
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            )}>
              <Shield className="mr-3 h-6 w-6 flex-shrink-0" />
              Permissions
            </Link> */}
            {/* <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isCommissionActive
                    ? "bg-blue-100 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setCommissionDropdownOpen((open) => !open)}
                aria-expanded={commissionDropdownOpen}
              >
                <DollarSign className="mr-3 h-6 w-6 flex-shrink-0" />
                Commission
                {commissionDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  commissionDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link
                  href="/dashboard/commission-config/list"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isCommissionConfigActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                >
                  Config Management
                </Link>
                <Link
                  href="/dashboard/commission-payments"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isCommissionPaymentsActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                >
                  Payments
                </Link>
              </div>
            </div>
            <Link href="/dashboard/betting-transactions" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname.startsWith("/dashboard/betting-transactions")
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            )}>
              <Receipt className="mr-3 h-6 w-6 flex-shrink-0" />
              Betting Transactions
            </Link> */}
            {/* Users Dropdown */}
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isUsersActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setUsersDropdownOpen((open) => !open)}
                aria-expanded={usersDropdownOpen}
              >
                <Users className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.users")}
                {usersDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  usersDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link
                  href="/dashboard/users/register"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isRegisterActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                >
                  {t("nav.register")}
                </Link>
                <Link
                  href="/dashboard/users/list"
                  className={cn(
                    "block px-2 py-2 text-sm rounded-md transition-colors",
                    isListActive
                      ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                  )}
                >
                  {t("nav.userList")}
                </Link>
              </div>
            </div>
            <Link
              href="/dashboard/transactions"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard/transactions"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
            >
              <CreditCard className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.transactions")}
            </Link>
            {/* <Link
              href="/dashboard/transfers"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard/transfers" || pathname.startsWith("/dashboard/transfers/")
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
            >
              <ArrowRightLeft className="mr-3 h-6 w-6 flex-shrink-0" />
              Partner Transfers
            </Link> */}
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isCountryActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setCountryDropdownOpen((open) => !open)}
                aria-expanded={countryDropdownOpen}
              >
                <Globe className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.country")}
                {countryDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  countryDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link href="/dashboard/country/list" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isCountryListActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.countryList")}</Link>
                <Link href="/dashboard/country/create" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isCountryCreateActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.countryCreate")}</Link>
              </div>
            </div>
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isNetworkActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setNetworkDropdownOpen((open) => !open)}
                aria-expanded={networkDropdownOpen}
              >
                <Share2 className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.network")}
                {networkDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  networkDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link href="/dashboard/network/list" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isNetworkListActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.networkList")}</Link>
                <Link href="/dashboard/network/create" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isNetworkCreateActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.networkCreate")}</Link>
              </div>
            </div>
            <Link href="/dashboard/phone-number/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/phone-number/list"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <Phone className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.phoneNumbers")}
            </Link>
            <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isDevicesActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setDevicesDropdownOpen((open) => !open)}
                aria-expanded={devicesDropdownOpen}
              >
                <Monitor className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.devices")}
                {devicesDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  devicesDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link href="/dashboard/devices/list" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isDevicesListActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.devicesList")}</Link>
              </div>
            </div>
            <Link href="/dashboard/sms-logs/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/sms-logs/list"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <MessageCircle className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.smsLogs")}
            </Link>
            <Link href="/dashboard/fcm-logs/list" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/fcm-logs/list"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <Bell className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.fcmLogs")}
            </Link>
            <Link href="/dashboard/partner" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/partner"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <User className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.partner")}
            </Link>
            <Link href="/dashboard/topup" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/topup"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <CreditCard className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("topup.title")}
            </Link>
            <Link href="/dashboard/earning-management" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/earning-management"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <BarChart3 className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("earning.title")}
            </Link>
            <Link
              href="/dashboard/momo-pay-transactions"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard/momo-pay-transactions"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("MoMo Pay Transactions")}
            </Link>
            <Link
              href="/dashboard/wave-business-transaction"
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                pathname === "/dashboard/wave-business-transaction"
                  ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("Wave Business Transaction")}
            </Link>
            {/* <div>
              <button
                className={cn(
                  "group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isNetworkConfigActive
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setNetworkConfigDropdownOpen((open) => !open)}
                aria-expanded={networkConfigDropdownOpen}
              >
                <Settings className="mr-3 h-6 w-6 flex-shrink-0" />
                {t("nav.networkConfig")}
                {networkConfigDropdownOpen ? (
                  <ChevronUp className="ml-auto h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-auto h-4 w-4" />
                )}
              </button>
              <div
                className={cn(
                  "pl-8 flex flex-col gap-1 overflow-hidden transition-all duration-300",
                  networkConfigDropdownOpen ? "max-h-32 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                )}
              >
                <Link href="/dashboard/network-config/list" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isNetworkConfigListActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.networkConfigList")}</Link>
                <Link href="/dashboard/network-config/create" className={cn(
                  "block px-2 py-2 text-sm rounded-md transition-colors",
                  isNetworkConfigCreateActive
                    ? "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}>{t("nav.networkConfigCreate")}</Link>
              </div>
            </div>
            <Link href="/dashboard/remote-command/create" className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              pathname === "/dashboard/remote-command/create"
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
            )}>
              <Terminal className="mr-3 h-6 w-6 flex-shrink-0" />
              {t("nav.remoteCommand")}
            </Link> */}
          </nav>
          <div className="p-4">
            <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-3 h-6 w-6" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-40" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
      </div>
    </>
  )
}
