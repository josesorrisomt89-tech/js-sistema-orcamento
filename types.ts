
export enum QuoteType {
  REQUEST = 'PEDIDO DE ORÇAMENTO',
  APPROVAL = 'APROVAÇÃO DE ORÇAMENTO'
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
  observations: string;
  createdAt: number;
  sent?: boolean;
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
