export interface AggregatorUserStats {
    total_aggregators: number;
    active_aggregators: number;
    inactive_aggregators: number;
    active_today: number;
    active_last_7_days: number;
}

export interface AggregatorTransactionStats {
    total_count: number;
    pending_count: number;
    processing_count: number;
    success_count: number;
    failed_count: number;
    cancelled_count: number;
    success_rate: number;
}

export interface AggregatorFinancialStats {
    total_count: number;
    success_count: number;
    total_amount: number;
    total_user_fees: number;
    total_network_fees: number;
    total_platform_profit: number;
}

export interface AggregatorPeriodStats {
    total_count: number;
    success_count: number;
    total_amount: number;
    total_platform_profit: number;
}

export interface NetworkStat {
    network_name: string;
    total_count: number;
    success_count: number;
    total_amount: number;
    total_profit: number;
}

export interface AggregatorDashboard {
    users: AggregatorUserStats;
    transactions: AggregatorTransactionStats;
    payin: AggregatorFinancialStats;
    payout: AggregatorFinancialStats;
    today: AggregatorPeriodStats;
    last_7_days: AggregatorPeriodStats;
    last_30_days: AggregatorPeriodStats;
    top_aggregators: any[]; // Adjust if specific structure is known
    network_stats: NetworkStat[];
    meta: {
        generated_at: string;
    };
}

export interface AggregatorUser {
    uid: string;
    email: string;
    phone: string | null;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_staff: boolean;
    email_verified: boolean;
    phone_verified: boolean;
    display_name: string;
    contact_method: string;
    created_at: string;
    last_login_at: string;
    is_partner: boolean;
    can_process_ussd_transaction: boolean;
    is_aggregator: boolean;
    webhook_url: string | null;
    account_balance: number;
    account_currency: string;
}

export interface AggregatorListResponse {
    aggregators: AggregatorUser[];
    pagination: {
        total_count: number;
        total_pages: number;
        current_page: number;
        page_size: number;
        has_next: boolean;
        has_previous: boolean;
        next_page: number | null;
        previous_page: number | null;
        start_index: number;
        end_index: number;
    };
}

export interface AggregatorIndividualStats {
    uid: string;
    display_name: string;
    email: string;
    phone: string | null;
    is_active: boolean;
    webhook_url: string | null;
    account_info: {
        balance: number;
        currency: string;
        is_frozen: boolean;
        is_active: boolean;
    };
    payin_stats: {
        total_count: number;
        success_count: number;
        failed_count: number;
        total_amount: number;
        total_fees: number;
        last_transaction_at: string | null;
    };
    payout_stats: {
        total_count: number;
        success_count: number;
        failed_count: number;
        total_amount: number;
        total_fees: number;
        last_transaction_at: string | null;
    };
    network_authorizations: any[];
    security_stats: {
        pending_reset_codes: number;
        total_reset_attempts: number;
    };
    meta: {
        generated_at: string;
    };
}

export interface AggregatorTransaction {
    uid: string;
    reference: string;
    transaction_type: string;
    status: string;
    amount: string;
    underlying_amount: string;
    user_fee_percent: string;
    user_fee_amount: string;
    network_fee_percent: string;
    network_fee_amount: string;
    platform_profit: string;
    net_amount: string;
    recipient_phone: string;
    external_id: string | null;
    objet: string;
    commentaire: string;
    payment_url: string | null;
    payment_ussd: string | null;
    payment_comment: string | null;
    processor_type: string;
    network_name: string;
    user_email: string;
    user_phone: string | null;
    user_display_name: string;
    payment_transaction_ref: {
        uid: string;
        reference: string;
        status: string;
    };
    wave_transaction_ref: any | null;
    momo_transaction_ref: any | null;
    webhook_sent: boolean;
    webhook_sent_at: string | null;
    webhook_response_code: any | null;
    error_message: string | null;
    created_at: string;
    completed_at: string | null;
}

export interface AggregatorNetworkMapping {
    uid: string;
    network: string;
    network_name: string;
    network_code: string;
    network_payin_fee_percent: string;
    network_payout_fee_percent: string;
    enable_payin: boolean;
    enable_payout: boolean;
    payin_processor: string;
    payout_processor: string;
    payin_url: string;
    payout_url: string;
    payin_ussd: string;
    payout_ussd: string;
    payin_comment: string;
    payout_comment: string;
    min_amount: string;
    max_amount: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AggregatorAuthorization {
    uid: string;
    user: string;
    user_email: string;
    user_display_name: string;
    network: string;
    network_name: string;
    user_payin_fee_percent: string;
    user_payout_fee_percent: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
