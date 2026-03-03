"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react"
import { extractErrorMessages } from "@/components/ui/error-display"

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export default function ForgotPasswordPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const { toast } = useToast()

    // step 1: enter identifier; step 2: enter code + new password; step 3: success
    const [step, setStep] = useState<1 | 2 | 3>(1)

    // Step 1 state
    const [identifier, setIdentifier] = useState("")
    const [sendingCode, setSendingCode] = useState(false)

    // Step 2 state
    const [code, setCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [resetting, setResetting] = useState(false)

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setSendingCode(true)
        try {
            const res = await fetch(`${baseUrl}api/auth/password-reset/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                const msg = extractErrorMessages(data) || t("auth.networkError")
                toast({ title: t("auth.loginFailed"), description: msg, variant: "destructive" })
                return
            }
            toast({ title: t("auth.resetCodeSent"), description: t("auth.resetCodeSentDesc") })
            setStep(2)
        } catch {
            toast({ title: t("auth.networkError"), description: t("auth.networkError"), variant: "destructive" })
        } finally {
            setSendingCode(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast({ title: t("updatePassword.passwordsDoNotMatch"), variant: "destructive" })
            return
        }
        setResetting(true)
        try {
            const res = await fetch(`${baseUrl}api/auth/password-reset/confirm/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, code, new_password: newPassword }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                const msg = extractErrorMessages(data) || t("auth.networkError")
                toast({ title: t("auth.loginFailed"), description: msg, variant: "destructive" })
                return
            }
            setStep(3)
        } catch {
            toast({ title: t("auth.networkError"), description: t("auth.networkError"), variant: "destructive" })
        } finally {
            setResetting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                {/* Header bar */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <img src="/logo.png" alt="Connect Pro Logo" className="h-20 w-20" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">
                            {step === 3 ? t("auth.passwordResetSuccess") : t("auth.forgotPasswordTitle")}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {step === 1 && t("auth.forgotPasswordSubtitle")}
                            {step === 2 && t("auth.enterCodeAndNewPassword")}
                            {step === 3 && t("auth.passwordResetSuccessDesc")}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* ── Step 3: Success ── */}
                        {step === 3 && (
                            <div className="flex flex-col items-center gap-6 py-4">
                                <CheckCircle2 className="w-16 h-16 text-green-500" />
                                <Button className="w-full" onClick={() => router.push("/")}>
                                    {t("auth.goToLogin")}
                                </Button>
                            </div>
                        )}

                        {/* ── Step 1: Identifier ── */}
                        {step === 1 && (
                            <form onSubmit={handleSendCode} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="identifier">{t("auth.identifier")}</Label>
                                    <Input
                                        id="identifier"
                                        type="text"
                                        placeholder={t("auth.identifierPlaceholder")}
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                        autoComplete="username"
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={sendingCode}>
                                    {sendingCode ? t("auth.sendingCode") : t("auth.sendResetCode")}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => router.push("/")}
                                >
                                    <ArrowLeft className="mr-2 w-4 h-4" />
                                    {t("auth.backToLogin")}
                                </Button>
                            </form>
                        )}

                        {/* ── Step 2: Code + New Password ── */}
                        {step === 2 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">{t("auth.resetCode")}</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder={t("auth.resetCodePlaceholder")}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        required
                                        autoComplete="one-time-code"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                                    <div className="relative">
                                        <Input
                                            id="new-password"
                                            type={showNew ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowNew((v) => !v)}
                                            tabIndex={-1}
                                            aria-label={showNew ? "Hide password" : "Show password"}
                                        >
                                            {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">{t("auth.confirmNewPassword")}</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirm-password"
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            tabIndex={-1}
                                            aria-label={showConfirm ? "Hide password" : "Show password"}
                                        >
                                            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={resetting}>
                                    {resetting ? t("auth.resettingPassword") : t("auth.resetPassword")}
                                </Button>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setStep(1)}
                                >
                                    <ArrowLeft className="mr-2 w-4 h-4" />
                                    {t("auth.backToLogin")}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
