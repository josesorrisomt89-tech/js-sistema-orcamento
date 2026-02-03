
export enum QuoteType {
  REQUEST = 'PEDIDO DE ORÇAMENTO',
  APPROVAL = 'APROVAÇÃO DE ORÇAMENTO'
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
  createdAt: number;
  sent?: boolean;
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
  createdAt: number;
}

export interface BatchItem {
  id: string;
  supplierName: string;
  supplierPhone: string;
  prefix?: string;
  quoteNumberParts: string;
  quoteNumberServices: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  category?: string;
}
