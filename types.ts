export enum QuoteType {
  REQUEST = 'PEDIDO DE ORÇAMENTO',
  APPROVAL = 'APROVAÇÃO DE ORÇAMENTO'
}

export type UserRole = 'ADMIN' | 'PROTOCOLO' | 'OFICINA' | 'TV';

export interface SystemUser {
  email: string;
  role: UserRole;
  addedAt: number;
}

export interface AttachedFile {
  name: string;
  data: string; // Base64
  type: string; // MIME type
}

export interface Quote {
  id: string;
  type: QuoteType;
  supplierName: string;
  supplierPhone: string;
  prefix?: string; 
  quoteNumberParts: string; 
  quoteNumberServices: string; 
  photo: string | null;
  files?: AttachedFile[];
  observations: string;
  createdAt: string;
  sent?: boolean;
  userId?: string;
}

export interface BatchItem {
  id: string;
  supplierName: string;
  supplierPhone: string;
  prefix: string;
  quoteNumberParts: string;
  quoteNumberServices: string;
}

export interface ReportRecord {
  id: string;
  dataRecebido: string;
  prefixo: string;
  secretaria: string;
  descricao: string;
  numPedidoOficina: string;
  oficinaTipo: 'PROPRIA' | 'TERCERIZADA';
  dataLancamentoVolus: string;
  numOrcVolusPecas: string;
  numOrcVolusServ: string;
  dataAprovacaoVolus: string;
  numOrcAprovado: string;
  valorTotal: string;
  notaFiscal: string;
  fornecedor: string;
  responsavel: string;
  status: string;
  entregueRelatorio: string;
  observacao: string;
  createdAt: string;
  userId?: string;
}

export interface ReportListItem {
  id: string;
  category: 'secretaria' | 'fornecedor' | 'status' | 'entrega';
  value: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
}

export interface SystemSettings {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  subtitle: string;
  users?: SystemUser[]; 
}
