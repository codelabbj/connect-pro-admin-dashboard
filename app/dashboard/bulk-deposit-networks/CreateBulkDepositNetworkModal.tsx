"use client"

import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/components/providers/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useApi } from "@/lib/useApi"
import { Loader2, Search } from "lucide-react"
import { useBulkDepositNetworkApi } from "@/lib/bulk-deposit-network-api"

interface CreateBulkDepositNetworkModalProps {
    isOpen: boolean
    onClose: () => void
    onCreated: () => void
}

export function CreateBulkDepositNetworkModal({
    isOpen,
    onClose,
    onCreated,
}: CreateBulkDepositNetworkModalProps) {
    const { t } = useLanguage()
    const apiFetch = useApi()
    const { toast } = useToast()
    const { createBulkDepositNetwork } = useBulkDepositNetworkApi()

    const [submitting, setSubmitting] = useState(false)

    // Network selection state
    const [networks, setNetworks] = useState<any[]>([])
    const [networksLoading, setNetworksLoading] = useState(false)
    const [selectedNetwork, setSelectedNetwork] = useState<string>("")

    // User combobox state
    const [searchTerm, setSearchTerm] = useState("")
    const [users, setUsers] = useState<any[]>([])
    const [usersLoading, setUsersLoading] = useState(false)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""

    // Fetch networks only once when modal opens
    useEffect(() => {
        if (!isOpen) return
        const fetchNetworks = async () => {
            setNetworksLoading(true)
            try {
                const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/networks/?page=1&page_size=100`)
                setNetworks(Array.isArray(data) ? data : data.results || [])
            } catch (err) {
                console.error("Failed to fetch networks:", err)
            } finally {
                setNetworksLoading(false)
            }
        }
        fetchNetworks()
    }, [isOpen, baseUrl, apiFetch])

    // Debounced user search
    useEffect(() => {
        if (!searchTerm) {
            setUsers([])
            return
        }

        const delayDebounceFn = setTimeout(async () => {
            setUsersLoading(true)
            try {
                const data = await apiFetch(`${baseUrl.replace(/\/$/, "")}/api/auth/admin/users/?search=${encodeURIComponent(searchTerm)}&page=1&page_size=10`)
                setUsers(data.users || [])
            } catch (err) {
                console.error("Failed to fetch users:", err)
            } finally {
                setUsersLoading(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm, baseUrl, apiFetch])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelectUser = (user: any) => {
        setSelectedUser(user)
        setSearchTerm(user.display_name || user.email || user.uid)
        setIsDropdownOpen(false)
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        if (selectedUser && e.target.value !== (selectedUser.display_name || selectedUser.email || selectedUser.uid)) {
            setSelectedUser(null)
        }
        if (!isDropdownOpen) setIsDropdownOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser) {
            toast({
                title: t("bulkDepositNetworks.modal.validationError"),
                description: t("bulkDepositNetworks.modal.selectBoth"),
                variant: "destructive",
            })
            return
        }
        if (!selectedNetwork) {
            toast({
                title: t("bulkDepositNetworks.modal.validationError"),
                description: t("bulkDepositNetworks.modal.selectBoth"),
                variant: "destructive",
            })
            return
        }

        setSubmitting(true)
        try {
            await createBulkDepositNetwork({
                user: selectedUser.uid,
                network: selectedNetwork,
            })
            toast({
                title: t("bulkDepositNetworks.success"),
                description: t("bulkDepositNetworks.modal.createSuccess"),
            })
            onCreated()
            handleClose()
        } catch (err: any) {
            console.error(err)
            toast({
                title: t("bulkDepositNetworks.error"),
                description: t("bulkDepositNetworks.modal.createFailed"),
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        setSearchTerm("")
        setSelectedUser(null)
        setSelectedNetwork("")
        setIsDropdownOpen(false)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("bulkDepositNetworks.modal.createTitle")}</DialogTitle>
                    <DialogDescription>
                        {t("bulkDepositNetworks.modal.description")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2 flex flex-col items-start" ref={wrapperRef}>
                        <Label htmlFor="user-search" className="text-left w-full">{t("bulkDepositNetworks.user")}</Label>
                        <div className="relative w-full">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="user-search"
                                autoComplete="off"
                                placeholder={t("bulkDepositNetworks.modal.searchUserPlaceholder")}
                                className="pl-9 w-full"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                onFocus={() => {
                                    if (searchTerm) setIsDropdownOpen(true)
                                }}
                            />
                            {usersLoading && (
                                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                        {isDropdownOpen && users.length > 0 && !selectedUser && (
                            <div className="absolute z-50 w-[375px] max-h-60 mt-20 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-none">
                                {users.map((user) => (
                                    <div
                                        key={user.uid}
                                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                                        onClick={() => handleSelectUser(user)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.display_name || user.email}</span>
                                            <span className="text-xs text-muted-foreground">{user.email} | {user.uid}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {isDropdownOpen && searchTerm && !usersLoading && users.length === 0 && !selectedUser && (
                            <div className="absolute z-50 w-[375px] mt-20 p-4 rounded-md border bg-popover text-sm text-center text-muted-foreground shadow-md">
                                {t("bulkDepositNetworks.modal.noUsersFound")}
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 flex flex-col items-start">
                        <Label htmlFor="network-select" className="text-left w-full">{t("bulkDepositNetworks.network")}</Label>
                        <Select
                            value={selectedNetwork}
                            onValueChange={setSelectedNetwork}
                            disabled={networksLoading}
                        >
                            <SelectTrigger id="network-select" className="w-full">
                                <SelectValue placeholder={networksLoading ? t("bulkDepositNetworks.loadingNetworks") : t("bulkDepositNetworks.modal.selectNetwork")} />
                            </SelectTrigger>
                            <SelectContent>
                                {networks.map((net) => (
                                    <SelectItem key={net.uid} value={net.uid}>
                                        {net.nom || net.code || net.network}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                            {t("bulkDepositNetworks.modal.cancel")}
                        </Button>
                        <Button type="submit" disabled={submitting || !selectedUser || !selectedNetwork}>
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("bulkDepositNetworks.modal.createButton")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
