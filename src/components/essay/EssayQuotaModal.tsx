"use client";

import React from "react";
import { FreeQuotaModal } from "@/components/quota/FreeQuotaModal";

interface EssayQuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineCount?: number;
  wordCount?: number;
  onRewardClaimed?: () => void;
}

export function EssayQuotaModal({
  isOpen,
  onClose,
  lineCount = 0,
  wordCount = 0,
  onRewardClaimed,
}: EssayQuotaModalProps) {
  const contextMessage = `Seu rascunho com ${
    lineCount > 0 ? `${lineCount} linhas` : "seu texto"
  }${wordCount > 0 ? ` (${wordCount} palavras)` : ""} está 100% salvo e seguro!`;

  return (
    <FreeQuotaModal
      isOpen={isOpen}
      onClose={onClose}
      feature="ESSAY"
      onRewardClaimed={onRewardClaimed}
      contextMessage={contextMessage}
    />
  );
}

