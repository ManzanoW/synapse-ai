import { Metadata } from "next";
import { LeiSecaClient } from "./lei-seca-client";

export const metadata: Metadata = {
  title: "Lei Seca Interativa | Synapse AI",
  description: "Treine a memorização literal da lei com ocultamento gradual de prazos e palavras-chave (Active Recall).",
};

export default function LeiSecaPage() {
  return <LeiSecaClient />;
}
