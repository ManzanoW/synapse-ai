// src/app/(dashboard)/mapas-mentais/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MapasMentaisClient } from "./mapas-client";

export const metadata = {
  title: "Hub de Mapas Mentais & Mnemônicos | Synapse AI",
  description: "Esquematizações conceituais e mnemônicos de alto impacto para fixação rápida em concursos públicos.",
};

export default async function MapasMentaisPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <MapasMentaisClient />;
}
