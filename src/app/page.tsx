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

  // Se não está autenticado, renderiza a Landing Page pública de alta conversão
  return <LandingPageView />;
}
