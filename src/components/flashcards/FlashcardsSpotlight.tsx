"use client";

import React from "react";
import {
  PageSpotlightBanner,
  SpotlightTriggerButton,
  useSpotlight,
} from "@/components/onboarding/PageSpotlightBanner";
import { Clock, Headphones, Sparkles } from "lucide-react";

export function FlashcardsSpotlight() {
  const spotlight = useSpotlight("synapse_spotlight_flashcards");

  return (
    <div className="space-y-3">
      {/* Botão sutil quando fechado */}
      {!spotlight.isOpen && spotlight.isLoaded && (
        <div className="flex justify-end">
          <SpotlightTriggerButton
            accentColor="indigo"
            onClick={spotlight.open}
            label="Como funciona a Repetição Espaçada?"
          />
        </div>
      )}

      {/* Banner expansível */}
      <PageSpotlightBanner
        storageKey="synapse_spotlight_flashcards"
        externalIsOpen={spotlight.isOpen}
        onClose={spotlight.dismiss}
        badgeText="🧠 Como Funciona a Repetição Espaçada"
        title="Memorize Matérias Extensas Sem Esquecer no Dia da Prova"
        description="O algoritmo de repetição espaçada (SM-2) calcula o momento ideal para revisar cada conceito antes que ele saia da sua memória de longo prazo."
        accentColor="indigo"
        primaryActionLabel="Entendi, pronto para memorizar!"
        steps={[
          {
            icon: <Clock size={18} />,
            title: "1. Poucos Cards Todo Dia",
            description:
              "Revisar apenas 10 a 20 cards por dia garante mais de 90% de retenção na prova sem acumular matéria.",
            tag: "Algoritmo SM-2",
          },
          {
            icon: <Headphones size={18} />,
            title: "2. Estudo em Áudio Natural",
            description:
              "Revise no trânsito ou em caminhadas: ative o 'Estudo em Áudio' com vozes neurais e escute perguntas e respostas em sequência.",
            tag: "Vozes Neurais",
          },
          {
            icon: <Sparkles size={18} />,
            title: "3. Criação com PDF ou IA",
            description:
              "Importe seus PDFs de cursinho ou edital para a IA extrair na hora os cartões com os tópicos mais cobrados pela sua banca.",
            tag: "Extração com IA",
          },
        ]}
      />
    </div>
  );
}
