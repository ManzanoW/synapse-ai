import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface MentorRequest {
  question: string;
  context?: string;
}

// Respostas de contingência pedagógicas de alta precisão para dúvidas clássicas
const CURATED_MENTOR_ANSWERS: Record<string, string> = {
  desconcentracao: `### 🎯 Desconcentração vs. Descentralização

**1. Desconcentração (Criação de Órgãos):**
Ocorre **dentro da mesma pessoa jurídica**. É uma divisão meramente interna de competências para otimizar o trabalho. Há hierarquia e subordinação!
* *Exemplo:* Ministério da Fazenda criando uma Delegacia da Receita Federal.
* *Macete:* **DesCONcentração** = com **O** de **Órgão** (dentro da mesma pessoa).

**2. Descentralização (Criação de Novas Entidades):**
Ocorre quando o Estado transfere competências para **outra pessoa jurídica** (Administração Indireta ou particulares). Não há subordinação, apenas controle finalístico/tutela!
* *Exemplo:* A União criando o INSS (Autarquia) ou concedendo rodovias para uma concessionária.
* *Macete:* **DesCENtralização** = com **E** de **Entidade** (outra pessoa jurídica).

⚠️ **Pegadinha de Banca:** A banca vai afirmar que 'na descentralização existe relação de hierarquia entre a União e o INSS'. **ERRADO!** Não há hierarquia na descentralização, apenas tutela/vinculação.`,

  limpe: `### 🏛️ Princípios Expressos da Administração Pública (Art. 37, caput, CF/88)

O mnemônico clássico e indispensável é o **L.I.M.P.E.**:

* **L - Legalidade:** O particular pode fazer tudo o que a lei não proíbe; o Administrador Público só pode agir se a lei autorizar expressamente.
* **I - Impessoalidade:** A atuação estatal não visa beneficiar amigos nem prejudicar inimigos. Proíbe promoção pessoal de autoridades em publicidades ou obras estatais (§ 1º).
* **M - Moralidade:** Não basta ser legal, precisa ser ético, probo e de boa-fé. Pode ser combatida via Ação Popular.
* **P - Publicidade:** Os atos oficiais são públicos como regra. Exceções: segurança nacional ou intimidade/interesse social.
* **E - Eficiência:** Busca por resultados com celeridade e economia. Foi adicionado pela Emenda Constitucional 19/1998 (não estava no texto originário de 1988!).

⚠️ **Pegadinha de Banca:** Cuidado! Proporcionalidade, Razoabilidade e Supremacia do Interesse Público são princípios **implícitos**, não constam expressamente no art. 37.`,

  crase: `### ✍️ Regras de Ouro da Crase (Para Nunca Mais Errar)

A crase é a fusão da preposição **A** com o artigo feminino **A** (A + A = À).

**🚫 Quando a crase é ESTRITAMENTE PROIBIDA:**
1. **Antes de palavras masculinas:** *"Andou a pé"*, *"Andou a cavalo"*. (Salvo se subentendida a expressão 'à moda de').
2. **Antes de verbos:** *"Começou a estudar"*, *"Disposto a lutar"*.
3. **Antes de pronomes pessoais e de tratamento:** *"Disse a ela"*, *"Entregue a Vossa Excelência"*. (Exceções: senhora, senhorita e dona admitem crase!).
4. **Entre palavras repetidas:** *"Dia a dia"*, *"Frente a frente"*, *"Passo a passo"*.
5. **No 'A' no singular diante de palavra no plural:** *"Refiro-me a pessoas sinceras"* (sem crase; se fosse *"às pessoas"*, teria).

**💡 O Teste do Troca:**
Troque a palavra feminina por uma masculina. Se virar **"AO"**, tem crase!
* *"Fui à feira"* -> *"Fui AO mercado"* (Virou AO = tem crase!).`,
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MentorRequest;
    const question = body.question?.trim();

    if (!question || question.length < 3) {
      return NextResponse.json(
        { success: false, error: "Pergunta inválida ou muito curta." },
        { status: 400 }
      );
    }

    const lower = question.toLowerCase();

    // 1. Tenta resposta curada imediata se for dúvida clássica
    for (const [key, answer] of Object.entries(CURATED_MENTOR_ANSWERS)) {
      if (lower.includes(key)) {
        return NextResponse.json({
          success: true,
          answer,
          source: "curated_mentor",
        });
      }
    }

    // 2. Tenta resposta gerada via Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `Você é o Professor Sináptico do Synapse AI, mentor de concurseiros de elite.
Sua missão é responder à dúvida do aluno com alta didática, foco na prova e formatação clara em Markdown.
Estruture sua resposta obrigatoriamente assim:
### 🎯 Resumo Direto
(Explique em 1 a 2 parágrafos simples e diretos, sem enrolação)

### 💡 Mnemônico / Regra de Ouro
(Dê um macete ou mnemônico para nunca mais esquecer)

### ⚠️ Pegadinha Clássica da Banca
(Como as bancas costumam tentar induzir o candidato ao erro nesse assunto)`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            { role: "system", parts: [{ text: systemPrompt }] },
            { role: "user", parts: [{ text: `Dúvida do aluno: ${question}` }] },
          ],
        });

        const text = response.text?.trim();
        if (text) {
          return NextResponse.json({
            success: true,
            answer: text,
            source: "gemini",
          });
        }
      } catch (geminiError) {
        console.warn("Aviso ao consultar Gemini no Professor IA:", geminiError);
      }
    }

    // 3. Fallback inteligente estruturado
    const fallbackAnswer = `### 🎯 Conceito Chave: "${question}"

Ao estudar este tópico para concursos públicos, concentre-se na literalidade da lei e na jurisprudência pacificada dos tribunais superiores (STF e STJ).

### 💡 Dica Sináptica de Fixação
* Identifique a palavra-chave central e crie uma analogia com situações práticas do dia a dia.
* Resolva ao menos 5 questões recentes da sua banca específica para mapear como o tema é cobrado em provas.

### ⚠️ Ponto de Atenção na Prova
As bancas adoram trocar termos semelhantes ou colocar exceções como se fossem regras gerais. Fique sempre atento a palavras restritivas como *"sempre"*, *"nunca"* ou *"em qualquer hipótese"*.`;

    return NextResponse.json({
      success: true,
      answer: fallbackAnswer,
      source: "fallback_structured",
    });
  } catch (err) {
    console.error("Erro na rota /api/ai/ask-mentor:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar resposta do mentor." },
      { status: 500 }
    );
  }
}
