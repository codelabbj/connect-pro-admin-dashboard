import { useApi } from "@/lib/useApi";
import { useCallback } from "react";

export interface BulkDepositNetwork {
    uid: string;
    user: string;
    network: string;
    is_active: boolean;
    created_at: string;
    // Extra fields that could be populated from backend
    user_email?: string;
    user_display_name?: string;
    network_name?: string;
}

export interface BulkDepositNetworkListResponse {
    results: BulkDepositNetwork[];
    count: number;
    next: string | null;
    previous: string | null;
}

export const useBulkDepositNetworkApi = () => {
    const apiFetch = useApi();
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

    const getBulkDepositNetworks = useCallback(async (params?: {
        page?: number;
        page_size?: number;
        user?: string;
        network?: string;
        is_active?: boolean;
    }): Promise<BulkDepositNetworkListResponse> => {
        let url = `${baseUrl.replace(/\/$/, "")}/api/payments/admin/bulk-deposit-networks/`;
        const queryParams = new URLSearchParams();

        if (params) {
            if (params.page) queryParams.append("page", params.page.toString());
            if (params.page_size) queryParams.append("page_size", params.page_size.toString());
            if (params.user) queryParams.append("user", params.user);
            if (params.network) queryParams.append("network", params.network);
            if (params.is_active !== undefined) queryParams.append("is_active", params.is_active.toString());
        }

        const queryString = queryParams.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        return apiFetch(url);
    }, [apiFetch, baseUrl]);

    const createBulkDepositNetwork = useCallback(async (data: {
        user: string;
        network: string;
    }): Promise<BulkDepositNetwork> => {
        return apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/admin/bulk-deposit-networks/`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    }, [apiFetch, baseUrl]);

    const toggleBulkDepositNetworkStatus = useCallback(async (uid: string, is_active: boolean): Promise<BulkDepositNetwork> => {
        return apiFetch(`${baseUrl.replace(/\/$/, "")}/api/payments/admin/bulk-deposit-networks/${uid}/`, {
            method: "PATCH",
            body: JSON.stringify({ is_active }),
        });
    }, [apiFetch, baseUrl]);

    return {
        getBulkDepositNetworks,
        createBulkDepositNetwork,
        toggleBulkDepositNetworkStatus
    };
};
