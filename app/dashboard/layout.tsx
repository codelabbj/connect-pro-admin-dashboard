"use client"

import type React from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
// import { WebSocketProvider } from "@/components/providers/websocket-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get token from localStorage (set in sign-in-form.tsx after login)
  // let token = "";
  // if (typeof window !== "undefined") {
  //   token = localStorage.getItem("accessToken") || "";
  // }
  return (
    // <WebSocketProvider token={token}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    // </WebSocketProvider>
  )
}
