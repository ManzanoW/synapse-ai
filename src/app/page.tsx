import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LandingPageView } from "@/components/landing/LandingPageView";

export const metadata = {
  title: "Synapse AI • O Primeiro Copiloto de Estudos para Concursos Públicos",
  description:
    "A sua aprovação não depende de sorte. Depende de método. Repetição inteligente, correção de redação discursiva no rigor da banca e resumos em áudio.",
  openGraph: {
    title: "Synapse AI • O Primeiro Copiloto de Estudos para Concursos Públicos",
    description:
      "A sua aprovação não depende de sorte. Depende de método. Repetição inteligente, correção de redação discursiva no rigor da banca e resumos em áudio.",
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
          "O primeiro copiloto de estudos para concursos públicos. Repetição inteligente, correção de redação discursiva no rigor da banca e resumos em áudio.",
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
            "name": "Como a repetição inteligente do Synapse difere de métodos antigos de flashcards?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Métodos tradicionais de flashcards usam fórmulas antigas dos anos 80, que aplicam intervalos fixos e geram um acúmulo descontrolado de centenas de cartões se você passar alguns dias sem abrir o app. A repetição inteligente do Synapse é calibrada pelo momento exato em que seu cérebro começaria a esquecer o conteúdo, reduzindo em até 65% as revisões acumuladas e mantendo mais de 90% de retenção no dia da prova.",
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
