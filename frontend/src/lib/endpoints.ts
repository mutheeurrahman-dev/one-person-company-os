import { api } from './api';
import type {
  MeResponse,
  TokenResponse,
  DashboardResponse,
  WorkflowResponse,
  AgentExecutionResponse,
  CommandResult,
  ApprovalResponse,
  InsightResponse,
  ProductResponse,
  ProductCreate,
  InventoryAdjust,
  CustomerResponse,
  CustomerCreate,
  OrderResponse,
  TransactionResponse,
  TransactionCreate,
  FinanceSummaryResponse,
} from '../types';

// ---------- Auth ----------
export const authApi = {
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    business_name: string;
    industry?: string;
  }) => api.post<TokenResponse>('/api/auth/register', payload).then((r) => r.data),

  login: (payload: { email: string; password: string }) =>
    api.post<TokenResponse>('/api/auth/login', payload).then((r) => r.data),

  me: () => api.get<MeResponse>('/api/auth/me').then((r) => r.data),
};

// ---------- Dashboard ----------
export const dashboardApi = {
  get: () => api.get<DashboardResponse>('/api/dashboard').then((r) => r.data),
};

// ---------- Command (AI Command Box) ----------
export const commandApi = {
  submit: (text: string) => api.post<CommandResult>('/api/command', { text }).then((r) => r.data),
};

// ---------- Agents / Workflows ----------
export const agentsApi = {
  listWorkflows: () => api.get<WorkflowResponse[]>('/api/agents/workflows').then((r) => r.data),
  getWorkflow: (id: string) => api.get<WorkflowResponse>(`/api/agents/workflows/${id}`).then((r) => r.data),
  recentActivity: () => api.get<AgentExecutionResponse[]>('/api/agents/activity').then((r) => r.data),
};

// ---------- Approvals ----------
export const approvalsApi = {
  list: (statusFilter?: string) =>
    api
      .get<ApprovalResponse[]>('/api/approvals', { params: statusFilter ? { status_filter: statusFilter } : {} })
      .then((r) => r.data),
  decide: (id: string, approve: boolean) =>
    api.post<ApprovalResponse>(`/api/approvals/${id}/decision`, { approve }).then((r) => r.data),
};

// ---------- Insights ----------
export const insightsApi = {
  list: () => api.get<InsightResponse[]>('/api/insights').then((r) => r.data),
  refresh: () => api.post<InsightResponse[]>('/api/insights/refresh').then((r) => r.data),
};

// ---------- Inventory ----------
export const inventoryApi = {
  listProducts: () => api.get<ProductResponse[]>('/api/inventory/products').then((r) => r.data),
  createProduct: (payload: ProductCreate) =>
    api.post<ProductResponse>('/api/inventory/products', payload).then((r) => r.data),
  adjust: (productId: string, payload: InventoryAdjust) =>
    api.patch<ProductResponse>(`/api/inventory/products/${productId}/adjust`, payload).then((r) => r.data),
  lowStock: () => api.get('/api/inventory/low-stock').then((r) => r.data),
};

// ---------- Customers ----------
export const customersApi = {
  list: () => api.get<CustomerResponse[]>('/api/customers').then((r) => r.data),
  create: (payload: CustomerCreate) => api.post<CustomerResponse>('/api/customers', payload).then((r) => r.data),
  get: (id: string) => api.get<CustomerResponse>(`/api/customers/${id}`).then((r) => r.data),
};

// ---------- Orders ----------
export const ordersApi = {
  list: () => api.get<OrderResponse[]>('/api/orders').then((r) => r.data),
  get: (id: string) => api.get<OrderResponse>(`/api/orders/${id}`).then((r) => r.data),
};

// ---------- Finance ----------
export const financeApi = {
  listTransactions: () => api.get<TransactionResponse[]>('/api/finance/transactions').then((r) => r.data),
  createTransaction: (payload: TransactionCreate) =>
    api.post<TransactionResponse>('/api/finance/transactions', payload).then((r) => r.data),
  summary: () => api.get<FinanceSummaryResponse>('/api/finance/summary').then((r) => r.data),
};
