"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/providers/language-provider"
import AutoRechargeStatisticsSummary from "./components/statistics-summary"
import AutoRechargeTransactions from "./components/transactions"
import AutoRechargeAggregators from "./components/aggregators"
import AutoRechargeMappings from "./components/mappings"

function AutoRechargeContent() {
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabFromUrl && ["transactions", "aggregators", "mappings"].includes(tabFromUrl) ? tabFromUrl : "transactions")
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-1">{t("autoRecharge.title")}</h1>
        <p className="text-muted-foreground text-lg">{t("autoRecharge.subtitle") || "Manage auto-recharge transactions, aggregators, and mappings"}</p>
      </div>

      {/* Statistics Summary at the top */}
      <AutoRechargeStatisticsSummary />
      
      <Card>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">{t("autoRecharge.tabs.transactions")}</TabsTrigger>
              <TabsTrigger value="aggregators">{t("autoRecharge.tabs.aggregators")}</TabsTrigger>
              <TabsTrigger value="mappings">{t("autoRecharge.tabs.mappings")}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="mt-6">
              <AutoRechargeTransactions />
            </TabsContent>
            
            <TabsContent value="aggregators" className="mt-6">
              <AutoRechargeAggregators />
            </TabsContent>
            
            <TabsContent value="mappings" className="mt-6">
              <AutoRechargeMappings />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AutoRechargePage() {
  const { t } = useLanguage()
  return (
    <Suspense fallback={<div className="p-8 text-center">{t("autoRecharge.loading")}</div>}>
      <AutoRechargeContent />
    </Suspense>
  )
}

