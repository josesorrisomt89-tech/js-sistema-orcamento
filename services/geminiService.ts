
import { GoogleGenAI } from "@google/genai";
import { QuoteType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function formatQuoteMessage(
  type: QuoteType, 
  observations: string, 
  supplierName: string, 
  prefix?: string,
  partsNumber?: string,
  servicesNumber?: string
): Promise<string> {
  try {
    const isApproval = type === QuoteType.APPROVAL;
    const typeLabel = isApproval ? 'APROVADO' : 'SOLICITADO';

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transforme os dados abaixo em uma mensagem de WhatsApp seguindo EXATAMENTE o layout das imagens de referência. 

      DADOS:
      - Empresa: ${supplierName}
      - Prefixo: ${prefix || '---'}
      - Nº Orçamento Peças: ${partsNumber || '---'}
      - Nº Orçamento Serviços: ${servicesNumber || '---'}
      - Observações: ${observations}

      ESTILO OBRIGATÓRIO (Siga exatamente este visual):
      ORCAMENTO *VOLUS* ${typeLabel}
      EMPRESA: *${supplierName.toUpperCase()}*

      PREFIXO: *${prefix || '---'}*
      ORC. VOLUS PEÇAS: *${partsNumber || '---'}*
      ORC. VOLUS SERVIÇOS: *${servicesNumber || '---'}*

      OBS: *${observations.toUpperCase()}*

      REGRAS:
      1. Use asteriscos (*) apenas para o negrito.
      2. Mantenha as quebras de linha duplas entre os blocos como no print.
      3. Não adicione saudações ou textos extras (sem "Olá", sem "Segue orçamento"). 
      4. Retorne APENAS o texto puro formatado conforme o modelo acima.`,
    });

    return (response.text || "").trim() || `ORCAMENTO *VOLUS* ${typeLabel}\nEMPRESA: *${supplierName.toUpperCase()}*\n\nPREFIXO: *${prefix || '---'}*\nORC. VOLUS PEÇAS: *${partsNumber || '---'}*\nORC. VOLUS SERVIÇOS: *${servicesNumber || '---'}*\n\nOBS: *${observations.toUpperCase()}*`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `ERRO NA FORMATAÇÃO.`;
  }
}
