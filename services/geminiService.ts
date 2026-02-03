
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
      contents: `Transforme os dados abaixo em uma mensagem de WhatsApp para orçamentos de oficina. 

      DADOS:
      - Empresa: ${supplierName}
      - Prefixo: ${prefix || '---'}
      - Nº Orçamento Peças: ${partsNumber || '---'}
      - Nº Orçamento Serviços: ${servicesNumber || '---'}
      - Observações: ${observations}

      ESTILO OBRIGATÓRIO (NÃO ADICIONE NADA ALÉM DISSO):
      ORCAMENTO *VOLUS* ${typeLabel}
      EMPRESA: *${supplierName.toUpperCase()}*

      PREFIXO: *${prefix || '---'}*
      ORC. VOLUS PEÇAS: *${partsNumber || '---'}*
      ORC. VOLUS SERVIÇOS: *${servicesNumber || '---'}*

      OBS: *${observations.toUpperCase()}*

      REGRAS CRÍTICAS:
      - Use apenas asteriscos para negrito.
      - Retorne APENAS o texto puro da mensagem.
      - PROIBIDO usar blocos de código markdown (como \`\`\`).
      - NÃO adicione saudações ou explicações.`,
    });

    // Sanitização agressiva para remover qualquer markdown ou caracteres de controle indesejados
    let text = response.text || "";
    text = text.replace(/```[a-z]*\n?/gi, ''); // Remove aberturas de bloco de código
    text = text.replace(/```/g, '');           // Remove fechamentos de bloco de código
    text = text.replace(/`([^`]+)`/g, '$1');   // Remove crases individuais mantendo o texto interno
    
    return text.trim() || `ORCAMENTO *VOLUS* ${typeLabel}\nEMPRESA: *${supplierName.toUpperCase()}*\n\nPREFIXO: *${prefix || '---'}*\nORC. VOLUS PEÇAS: *${partsNumber || '---'}*\nORC. VOLUS SERVIÇOS: *${servicesNumber || '---'}*\n\nOBS: *${observations.toUpperCase()}*`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `ERRO NA FORMATAÇÃO.`;
  }
}
