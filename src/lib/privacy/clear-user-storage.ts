// src/lib/privacy/clear-user-storage.ts

/**
 * 🛡️ LGPD & AppSec (Proteção em Dispositivos Compartilhados):
 * Remove integralmente do localStorage, sessionStorage e IndexedDB todos os rascunhos,
 * anotações pessoais, filas de sincronização offline, históricos da Sala de Foco
 * e comandos recentes do usuário ao encerrar a sessão ou excluir a conta.
 *
 * Preserva apenas preferências visuais anônimas do navegador (tema claro/escuro,
 * mudo de áudio e banner de aviso de cookies).
 */
const PRESERVED_BROWSER_KEYS = new Set([
  "synapse-theme",
  "theme",
  "synapse_audio_muted",
  "synapse_lgpd_consent_v1",
]);

const EXPLICIT_SENSITIVE_KEYS = [
  "synapse_demo_active",
  "synapse-demo-session",
  "auth_token",
  "synapse_offline_sync_queue_v1",
  "synapse_offline_reviews_queue",
  "synapse_quick_scratchpad",
  "synapse_recent_commands",
  "synapse_study_room_notes",
  "synapse_study_room_tasks",
  "synapse_study_room_history",
  "synapse_error_notebook",
  "synapse_error_notes",
  "synapse_essay_draft",
  "synapse_pomodoro_state",
  "synapse_sidebar_collapsed_groups",
];

export function clearSensitiveUserStorage(): void {
  if (typeof window === "undefined") return;

  try {
    for (const key of EXPLICIT_SENSITIVE_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }

    // Varre quaisquer outras chaves dinâmicas do ecossistema Synapse (ex: rascunhos ou decks por ID)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        !PRESERVED_BROWSER_KEYS.has(k) &&
        (k.startsWith("synapse_") || k.startsWith("synapse-"))
      ) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      localStorage.removeItem(k);
    }

    sessionStorage.clear();

    // Limpa também o banco IndexedDB de sincronização offline (decks e revisões)
    if (window.indexedDB && typeof window.indexedDB.deleteDatabase === "function") {
      try {
        window.indexedDB.deleteDatabase("synapse_offline_db");
      } catch {
        // Ignora se IndexedDB estiver bloqueado no navegador
      }
    }
  } catch (err) {
    console.warn("[Privacy] Aviso ao higienizar storage local:", err);
  }
}
