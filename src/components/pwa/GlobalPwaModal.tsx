"use client";

import React, { useState, useEffect } from "react";
import { PwaInstallModal } from "@/components/landing/PwaInstallModal";

export function GlobalPwaModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-pwa-install", handleOpen);
    return () => window.removeEventListener("open-pwa-install", handleOpen);
  }, []);

  return <PwaInstallModal isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
