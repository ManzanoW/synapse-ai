import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, Download, Trash2, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade • Synapse AI (LGPD)",
  description: "Como o Synapse AI protege e trata seus dados de estudo em total conformidade com a LGPD (Lei 13.709/2018).",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navegação Voltar */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Voltar para a página inicial</span>
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="border-b border-slate-800 pb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <Shield size={14} />
            <span>Privacidade & Proteção de Dados (LGPD)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Política de Privacidade
          </h1>
          <p className="text-sm text-slate-400">
            Última atualização: Outubro de 2026 • Em rigorosa conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              1. Nosso Compromisso com a sua Privacidade
            </h2>
            <p>
              No <strong>Synapse AI</strong>, acreditamos que sua rotina e histórico de estudos são dados pessoais valiosos e confidenciais. Esta Política de Privacidade explica de forma clara e transparente quais informações coletamos, por que precisamos delas e como as mantemos protegidas.
            </p>
            <p>
              <strong>Nós nunca vendemos seus dados para corretores de dados, empresas de marketing ou terceiros.</strong> Seus dados são utilizados única e exclusivamente para potencializar sua taxa de memorização e entregar a melhor experiência de aprendizagem.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              2. Dados que Coletamos
            </h2>
            <p>Coletamos apenas o estritamente necessário para o funcionamento da plataforma:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li><strong>Dados de Identificação:</strong> Nome, endereço de e-mail e foto de perfil fornecidos por você ao efetuar login com Google ou e-mail.</li>
              <li><strong>Dados Cognitivos e de Estudo:</strong> Tópicos de edital cadastrados, flashcards criados, notas atribuídas nas revisões espaçadas (FSRS), redações submetidas para correção e cadernos de erros.</li>
              <li><strong>Dados Técnicos e de Sessão:</strong> Endereço IP (utilizado estritamente para segurança e proteção contra ataques de negação de serviço e abuso), cookies de sessão autenticada e registros de data/hora de estudos.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              3. Finalidade do Tratamento de Dados
            </h2>
            <p>Seus dados são tratados com base nas seguintes hipóteses legais da LGPD (Art. 7º):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-indigo-400" />
                  Execução de Contrato
                </h3>
                <p className="text-xs text-slate-400">
                  Cálculo dos intervalos de repetição espaçada (FSRS), emissão de simulados, sincronização da grade semanal e gestão de planos Pro.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-indigo-400" />
                  Legítimo Interesse & Segurança
                </h3>
                <p className="text-xs text-slate-400">
                  Proteção contra acessos indevidos (IDOR), prevenção a bots, controle de cotas de IA e aprimoramento contínuo dos recursos do sistema.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              4. Uso de Inteligência Artificial e Modelos de Linguagem
            </h2>
            <p>
              Para funcionalidades como avaliação de redação discursiva, geração de flashcards e resolução comentada de questões, utilizamos a API corporativa do Google Gemini.
            </p>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 space-y-1">
              <p className="font-semibold text-white">Privacidade de IA Garantida:</p>
              <p className="text-xs text-slate-400">
                Os dados enviados para as APIs de processamento em nuvem trafegam via canal criptografado HTTPS/TLS e <strong>não são utilizados pelo Google ou por qualquer provedor para treinamento de modelos de inteligência artificial públicos</strong>.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              5. Seus Direitos como Titular de Dados (LGPD)
            </h2>
            <p>
              Você possui total controle sobre seus dados pessoais, podendo exercer a qualquer momento:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Direito de Acesso e Confirmação:</strong> Saber exatamente quais dados mantemos sobre você.</li>
              <li><strong>Direito de Portabilidade / Exportação:</strong> Você pode exportar um arquivo JSON completo com seus dados e mapas mentais direto na aba do seu Perfil.</li>
              <li><strong>Direito de Retificação:</strong> Corrigir dados incompletos ou inexatos a qualquer momento.</li>
              <li><strong>Direito de Eliminação:</strong> Solicitar a exclusão definitiva da sua conta e de todos os registros cognitivos associados.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              6. Segurança da Informação
            </h2>
            <p>
              Adotamos medidas técnicas de padrão bancário para blindar seus dados, incluindo:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Criptografia de ponta a ponta em trânsito (TLS 1.3 / HTTPS com HSTS estrito).</li>
              <li>Isolamento de banco de dados em infraestrutura segura com controle rigoroso de acesso.</li>
              <li>Proteção contra vulnerabilidades OWASP (IDOR, Clickjacking, MIME Sniffing e Cross-Site Scripting).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              7. Contato com o Encarregado de Dados (DPO)
            </h2>
            <p>
              Para exercer qualquer direito previsto na LGPD, tirar dúvidas ou solicitar a exclusão de seus dados, entre em contato diretamente com nossa equipe de privacidade pelo e-mail:
            </p>
            <p className="font-mono text-indigo-400 text-sm">
              privacidade@synapseconcursos.com.br
            </p>
          </section>
        </div>

        {/* Rodapé */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Synapse AI. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-indigo-400 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/pricing" className="hover:text-indigo-400 transition-colors">
              Planos e Preços
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
