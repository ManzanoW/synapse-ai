import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Termos de Uso • Synapse AI",
  description: "Termos e condições de uso da plataforma Synapse AI para estudantes de concursos públicos.",
};

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
            <FileText size={14} />
            <span>Documento Legal Oficial</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Termos de Uso do Synapse AI
          </h1>
          <p className="text-sm text-slate-400">
            Última atualização: Outubro de 2026 • Em conformidade com a legislação brasileira (Marco Civil da Internet e CDC).
          </p>
        </div>

        {/* Conteúdo dos Termos */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              1. Visão Geral e Aceite dos Termos
            </h2>
            <p>
              Bem-vindo ao <strong>Synapse AI</strong> (&quot;Plataforma&quot;, &quot;nós&quot; ou &quot;nosso&quot;). Ao criar uma conta, navegar em nosso site ou utilizar qualquer uma de nossas funcionalidades (motor FSRS, flashcards em áudio, correção de redação discursiva por IA, simulados e mapas mentais), você concorda expressamente com estes Termos de Uso e com nossa Política de Privacidade.
            </p>
            <p>
              Caso você não concorde com qualquer disposição aqui presente, recomendamos interromper imediatamente a utilização da plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              2. Objeto e Natureza Pedagógica do Serviço
            </h2>
            <p>
              O Synapse AI é uma plataforma de tecnologia educacional e inteligência cognitiva voltada a auxiliar estudantes no planejamento, retenção de longo prazo e resolução ativa de questões para concursos públicos, exames da OAB e provas de alto rendimento.
            </p>
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200">
              <strong>Aviso Pedagógico Importante:</strong> Nossas ferramentas de inteligência artificial (avaliação de discursivas, simulados e explicações) são assistentes cognitivos de alto padrão. No entanto, para fins de aprovação ou recurso formal em concursos públicos, os editais, gabaritos definitivos e bancas examinadoras oficiais sempre prevalecem como autoridade final soberana.
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              3. Cadastro, Segurança de Conta e Acesso
            </h2>
            <p>
              Para acessar os recursos personalizados, o usuário deve autenticar-se por meio de credenciais válidas (como Google OAuth ou login por e-mail). O usuário é o único responsável pela guarda e confidencialidade de sua sessão de acesso. Qualquer atividade conduzida sob a sua conta é de sua inteira responsabilidade.
            </p>
            <p>
              É expressamente proibido compartilhar credenciais de acesso, revender contas ou tentar contornar nossos sistemas de rate-limit e controle de cotas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              4. Planos, Assinaturas e Cancelamentos
            </h2>
            <p>
              Oferecemos modalidades de uso gratuito (Plano Gratuito) e planos por assinatura com recursos estendidos (Synapse Pro).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Cobrança:</strong> As assinaturas pagas são renovadas periodicamente (mensal ou anual) conforme contratado no momento do checkout.</li>
              <li><strong>Cancelamento:</strong> O usuário pode cancelar a renovação automática a qualquer momento diretamente pelo seu painel de perfil. O acesso Pro continuará ativo até o encerramento do ciclo já pago.</li>
              <li><strong>Direito de Arrependimento:</strong> Conforme o Código de Defesa do Consumidor (Art. 49), o usuário tem direito de solicitar o reembolso integral em até 7 (sete) dias após a primeira contratação.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              5. Propriedade Intelectual e Seus Dados
            </h2>
            <p>
              Todos os direitos relativos à marca Synapse AI, interface visual, código-fonte, modelos e algoritmos de cálculo de curva de esquecimento FSRS pertencem exclusivamente aos desenvolvedores do Synapse AI.
            </p>
            <p>
              Os dados e conteúdos inseridos por você (suas redações originais, anotações e baralhos particulares) permanecem de sua propriedade. Concedemos a você uma licença pessoal, revogável e intransferível para utilizar os materiais gerados para seu estudo pessoal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              6. Legislação Aplicável e Foro
            </h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Quaisquer disputas serão submetidas ao foro do domicílio do consumidor, conforme preconizado pela legislação pátria.
            </p>
          </section>
        </div>

        {/* Rodapé da Página */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Synapse AI. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-indigo-400 transition-colors">
              Política de Privacidade (LGPD)
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
