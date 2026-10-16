import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LandingPageView } from "@/components/landing/LandingPageView";

export const metadata = {
  title: "Synapse AI • O Primeiro Copiloto Cognitivo para Concursos Públicos",
  description:
    "A sua aprovação não depende de sorte. Depende de neurociência. Motor FSRS, correção de redação discursiva no rigor da banca e flashcards em áudio neural humanizado.",
  openGraph: {
    title: "Synapse AI • O Primeiro Copiloto Cognitivo para Concursos Públicos",
    description:
      "A sua aprovação não depende de sorte. Depende de neurociência. Motor FSRS, correção de redação discursiva no rigor da banca e flashcards em áudio neural humanizado.",
    type: "website",
  },
};

export default async function RootPage() {
  const session = await auth();

  // Se o usuário está logado, vai direto para o dashboard
  if (session) {
    redirect("/dashboard");
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "Synapse AI",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web, Android, iOS (PWA)",
        "description":
          "O primeiro copiloto cognitivo para concursos públicos. Motor FSRS preditivo, correção de redação discursiva no rigor da banca e flashcards em áudio neural humanizado.",
        "offers": {
          "@type": "Offer",
          "price": "29.90",
          "priceCurrency": "BRL",
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "1480",
          "bestRating": "5",
        },
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Como o motor FSRS difere do algoritmo tradicional do Anki?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "O Anki tradicional utiliza o algoritmo SM-2 criado nos anos 80, que aplica intervalos de revisão fixos e gera acúmulo descontrolado de centenas de cards caso você falte alguns dias. O motor FSRS do Synapse AI é baseado em modelagem matemática preditiva de memória, calculando a probabilidade de esquecimento exata e reduzindo a carga diária de revisões em até 65% com a mesma retenção de 90%+ no dia da prova.",
            },
          },
          {
            "@type": "Question",
            "name": "Como funciona o áudio neural hands-free com a tela do celular bloqueada?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "O Synapse integra a API nativa MediaSession do navegador do seu smartphone. Você pode colocar os fones Bluetooth, dar o play e bloquear a tela no bolso. O app reproduzirá a pergunta com voz neural de estúdio, manterá uma pausa reflexiva inteligente (configurável de 3 a 8 segundos) para seu cérebro fazer a recuperação ativa mental, e em seguida pronunciará o gabarito oficial com o macete.",
            },
          },
          {
            "@type": "Question",
            "name": "A correção de redação discursiva segue realmente o critério das bancas?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Sim. Nossos prompts e critérios foram calibrados com os espelhos oficiais das maiores bancas do país (Cebraspe, FGV, FCC, Vunesp). O sistema aplica as fórmulas matemáticas reais de desconto, analisa a Macroestrutura e a Microestrutura linha a linha, e ainda sugere a 'Versão Ouro' reescrita no padrão nota 10.",
            },
          },
          {
            "@type": "Question",
            "name": "Posso tirar foto da minha redação escrita à mão na folha de prova?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Com certeza! Usamos modelo multimodal para OCR avançado de manuscrito. Basta fotografar a folha de resposta padrão com o celular ou webcam. O sistema digitaliza o texto preservando a numeração de linhas e avalia o conteúdo imediatamente.",
            },
          },
          {
            "@type": "Question",
            "name": "O Synapse funciona em celulares Android e iPhone?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Sim! A plataforma é uma Progressive Web App (PWA) de última geração com design mobile-first responsivo. Você pode usá-la no Chrome ou Safari ou adicioná-la à tela de início com 1 clique para uma experiência de app nativo com áudio em segundo plano.",
            },
          },
        ],
      },
    ],
  };

  // Se não está autenticado, renderiza a Landing Page pública com dados estruturados
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageView />
    </>
  );
}
