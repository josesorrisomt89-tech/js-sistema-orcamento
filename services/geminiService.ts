
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

      ESTILO OBRIGATÓRIO:
      ORCAMENTO *VOLUS* ${typeLabel}
      EMPRESA: *${supplierName.toUpperCase()}*

      PREFIXO: *${prefix || '---'}*
      ORC. VOLUS PEÇAS: *${partsNumber || '---'}*
      ORC. VOLUS SERVIÇOS: *${servicesNumber || '---'}*

      OBS: *${observations.toUpperCase()}*

      REGRAS:
      - Use asteriscos para negrito.
      - Retorne APENAS o texto da mensagem.
      - NÃO use blocos de código markdown (como \`\`\`).`,
    });

    // Sanitização rigorosa para remover qualquer markdown retornado pela IA
    let text = response.text || "";
    text = text.replace(/```[a-z]*\n?/gi, ''); // Remove ```whatsapp ou ```
    text = text.replace(/```/g, ''); 
    
    return text.trim() || `ORCAMENTO *VOLUS* ${typeLabel}\nEMPRESA: *${supplierName.toUpperCase()}*\n\nPREFIXO: *${prefix || '---'}*\nORC. VOLUS PEÇAS: *${partsNumber || '---'}*\nORC. VOLUS SERVIÇOS: *${servicesNumber || '---'}*\n\nOBS: *${observations.toUpperCase()}*`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `ERRO NA FORMATAÇÃO.`;
  }
}
