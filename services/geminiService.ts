
import { GoogleGenAI } from "@google/genai";
import { QuoteType } from "../types";

export async function formatQuoteMessage(
  type: QuoteType, 
  observations: string, 
  supplierName: string, 
  prefix?: string,
  partsNumber?: string,
  servicesNumber?: string
): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const isApproval = type === QuoteType.APPROVAL;
    const typeLabel = isApproval ? 'APROVADO' : 'SOLICITADO';

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transforme os dados abaixo em uma mensagem para WhatsApp.

      DADOS:
      - Empresa: ${supplierName}
      - Prefixo: ${prefix || '---'}
      - Nº Orçamento Peças: ${partsNumber || '---'}
      - Nº Orçamento Serviços: ${servicesNumber || '---'}
      - Observações: ${observations}

      ESTRUTURA EXATA:
      ORCAMENTO VOLUS ${typeLabel}
      EMPRESA: ${supplierName.toUpperCase()}

      PREFIXO: ${prefix || '---'}
      ORC. VOLUS PEÇAS: ${partsNumber || '---'}
      ORC. VOLUS SERVIÇOS: ${servicesNumber || '---'}

      OBS: ${observations.toUpperCase()}

      REGRAS:
      - RETORNE APENAS O TEXTO PLANO.
      - PROIBIDO USAR QUALQUER TIPO DE FORMATAÇÃO MARKDOWN (SEM CRASES, SEM BLOCOS DE CÓDIGO).
      - NÃO USE ASTERISCOS PARA NEGRITO, QUEREMOS TEXTO PURO.
      - NÃO ADICIONE SAUDAÇÕES.`,
    });

    let text = response.text || "";
    // Sanitização final para garantir texto limpo
    text = text.replace(/```[a-z]*\n?/gi, '');
    text = text.replace(/```/g, '');
    text = text.replace(/`/g, '');
    text = text.replace(/\*/g, ''); // Remove asteriscos se a IA insistir neles
    
    return text.trim() || `ORCAMENTO VOLUS ${typeLabel}\nEMPRESA: ${supplierName.toUpperCase()}\n\nPREFIXO: ${prefix || '---'}\nORC. VOLUS PEÇAS: ${partsNumber || '---'}\nORC. VOLUS SERVIÇOS: ${servicesNumber || '---'}\n\nOBS: ${observations.toUpperCase()}`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `ERRO NA FORMATAÇÃO.`;
  }
}
