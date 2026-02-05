
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
  data_recebido: string;
  prefixo: string;
  secretaria: string;
  descricao: string;
  num_pedido_oficina: string;
  oficina_tipo: 'PROPRIA' | 'TERCERIZADA';
  data_lancamento_volus: string;
  num_orc_volus_pecas: string;
  num_orc_volus_serv: string;
  data_aprovacao_volus: string;
  num_orc_aprovado: string;
  valor_total: string;
  nota_fiscal: string;
  fornecedor: string;
  responsavel: string;
  status: string;
  entregue_relatorio: string;
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
