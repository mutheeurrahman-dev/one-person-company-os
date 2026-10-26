// Types mirror backend/app/schemas/*.py exactly. Keep field names identical.

// ---------- Auth ----------
export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
}

export interface BusinessResponse {
  id: string;
  name: string;
  industry: string;
  currency: string;
}

export interface MeResponse {
  user: UserResponse;
  business: BusinessResponse | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

// ---------- Dashboard ----------
export interface DashboardResponse {
  today_revenue: number;
  total_orders: number;
  pending_tasks: number;
  active_agents: string[];
  low_stock_count: number;
  pending_approvals: number;
  recent_customer_activity: string[];
}

// ---------- Agents / Workflows ----------
export interface AgentTaskResponse {
  id: string;
  workflow_id: string;
  assigned_agent: string;
  action: string;
  status: string;
  result: Record<string, unknown> | null;
  error: string | null;
  retry_count: number;
  created_at: string;
}

export interface WorkflowResponse {
  id: string;
  user_request: string;
  status: string;
  result_summary: string | null;
  created_at: string;
  tasks: AgentTaskResponse[];
}

export interface AgentExecutionResponse {
  id: string;
  workflow_id: string;
  agent: string;
  status: string;
  message: string;
  created_at: string;
}

export interface CommandResult {
  workflow_id: string;
  status: string;
  results?: Array<{ agent: string; action: string; result: Record<string, unknown> }>;
  summary?: string;
}

// ---------- Approvals ----------
export interface ApprovalResponse {
  id: string;
  workflow_id: string;
  requesting_agent: string;
  action_title: string;
  description: string | null;
  estimated_cost: number;
  reason: string | null;
  status: string;
  created_at: string;
}

// ---------- Insights ----------
export interface InsightResponse {
  id: string;
  category: string;
  title: string;
  detail: string;
  severity: string;
  created_at: string;
}

// ---------- Business: Products / Inventory ----------
export interface ProductCreate {
  name: string;
  sku?: string | null;
  price?: number;
  cost?: number;
  initial_quantity?: number;
  low_stock_threshold?: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost: number;
  quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
}

export interface InventoryAdjust {
  quantity_delta: number;
  reason?: string | null;
}

// ---------- Customers ----------
export interface CustomerCreate {
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  is_vip?: boolean;
}

export interface CustomerResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_vip: boolean;
  has_unresolved_issue: boolean;
  created_at: string;
}

// ---------- Orders ----------
export interface OrderResponse {
  id: string;
  product_id: string;
  customer_id: string | null;
  quantity: number;
  total_amount: number;
  status: string;
  workflow_id: string | null;
  created_at: string;
}

// ---------- Finance ----------
export interface TransactionCreate {
  type: 'revenue' | 'expense';
  amount: number;
  category?: string;
  description?: string | null;
}

export interface TransactionResponse {
  id: string;
  type: string;
  amount: number;
  category: string;
  description: string | null;
  is_flagged_unusual: boolean;
  created_at: string;
}

export interface FinanceSummaryResponse {
  total_revenue: number;
  total_expenses: number;
  profit: number;
  today_revenue: number;
  transaction_count: number;
}
