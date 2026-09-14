import "dotenv/config";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

interface SeedAlternative {
  letra: string;
  texto: string;
  id?: string;
}

interface SeedQuestion {
  numeroQuestao: number;
  disciplina: string;
  topico: string;
  enunciado: string;
  tipo: "CERTO_ERRADO" | "MULTIPLA_ESCOLHA";
  alternativas: SeedAlternative[];
  gabarito: string;
  justificativa: string;
  difficultyEstimate?: number;
}

interface SeedExam {
  banca: string;
  orgao: string;
  cargo: string;
  ano: number;
  editalUrl?: string;
  questions: SeedQuestion[];
}

const EXAMS_DATA: SeedExam[] = [
  {
    banca: "CEBRASPE",
    orgao: "Polícia Federal",
    cargo: "Agente de Polícia Federal",
    ano: 2024,
    editalUrl: "https://www.cebraspe.org.br/concursos/pf_2024",
    questions: [
      {
        numeroQuestao: 1,
        disciplina: "Língua Portuguesa",
        topico: "Compreensão e tipologia textual",
        enunciado:
          "Texto de referência:\n\n'A expansão acelerada dos crimes cibernéticos impôs uma profunda reformulação das metodologias clássicas de investigação policial. Se outrora os vestígios materiais eram primordialmente tangíveis — impressões papiloscópicas, estojos de munição e documentos físicos —, na era dos sistemas distribuídos a prova penal reside em fluxos criptografados de dados, logs voláteis de servidores e dispersão transnacional de ativos digitais. Esse novo cenário não dispensa a persecução penal tradicional, mas exige do agente da lei uma competência interdisciplinar em que a hermenêutica jurídica e a perícia telemática se entrelacem de modo indissociável.'\n\nDepreende-se dos sentidos do texto que a investigação de crimes cibernéticos tornou obsoletas as técnicas tradicionais da persecução penal policial, substituindo-as integralmente pela perícia de dados em ambientes digitais.",
        tipo: "CERTO_ERRADO",
        alternativas: [
          { letra: "C", texto: "Certo" },
          { letra: "E", texto: "Errado" },
        ],
        gabarito: "ERRADO",
        justificativa:
          "ERRADO. O texto afirma expressamente o oposto ao asseverar que 'Esse novo cenário não dispensa a persecução penal tradicional, mas exige do agente da lei uma competência interdisciplinar...'. Logo, não há substituição integral ou obsolescência das práticas tradicionais, mas sim uma convivência e integração metodológica complementar entre os meios clássicos e as técnicas telemáticas.",
        difficultyEstimate: 2.5,
      },
      {
        numeroQuestao: 2,
        disciplina: "Língua Portuguesa",
        topico: "Sintaxe do período e pontuação",
        enunciado:
          "No fragmento 'Se outrora os vestígios materiais eram primordialmente tangíveis, na era dos sistemas distribuídos a prova reside em fluxos criptografados de dados', o emprego da vírgula logo após o vocábulo 'tangíveis' justifica-se por isolar uma oração subordinada adverbial condicional anteposta à oração principal.",
        tipo: "CERTO_ERRADO",
        alternativas: [
          { letra: "C", texto: "Certo" },
          { letra: "E", texto: "Errado" },
        ],
        gabarito: "CERTO",
        justificativa:
          "CERTO. A oração 'Se outrora os vestígios materiais eram primordialmente tangíveis' introduzida pela conjunção subordinativa condicional 'Se' é sintaticamente classificada como oração subordinada adverbial condicional. Por estar anteposta (deslocada) em relação à oração principal subsequente ('a prova reside em...'), a vírgula é de uso obrigatório segundo as normas gramaticais de regência e pontuação do padrão culto.",
        difficultyEstimate: 2.8,
      },
      {
        numeroQuestao: 3,
        disciplina: "Direito Constitucional",
        topico: "Inviolabilidade domiciliar (Art. 5º, XI, CF/88)",
        enunciado:
          "Determinada equipe de agentes da Polícia Federal, em patrulhamento preventivo durante o período noturno, recebeu denúncia anônima informando sobre a prática de tráfico de entorpecentes no interior de certa residência. Desprovidos de mandado judicial e sem a realização prévia de diligências investigativas para constatação de movimentação externa suspeita, os policiais adentraram o imóvel e apreenderam expressiva quantidade de drogas ilícitas. Nessa situação, segundo a jurisprudência consolidada do Supremo Tribunal Federal (Tema 280 da Repercussão Geral), a entrada forçada em domicílio é válida, visto que o tráfico de drogas é crime de natureza permanente e a apreensão das substâncias convalida a justa causa a posteriori.",
        tipo: "CERTO_ERRADO",
        alternativas: [
          { letra: "C", texto: "Certo" },
          { letra: "E", texto: "Errado" },
        ],
        gabarito: "ERRADO",
        justificativa:
          "ERRADO. Conforme tese fixada pelo STF no Tema 280 da Repercussão Geral (RE 603.616/RO), a entrada forçada em domicílio sem mandado judicial, mesmo em crimes permanentes como o tráfico de drogas, só é lícita se amparada em fundadas razões (justa causa), devidamente justificadas pelas circunstâncias do caso concreto prévias à incursão. A mera denúncia anônima desacompanhada de investigações preliminares não autoriza o ingresso domiciliar forçado, e o sucesso da apreensão posterior não retroage para convalidar uma invasão ilícita (art. 5º, XI, CF/88).",
        difficultyEstimate: 3.8,
      },
      {
        numeroQuestao: 4,
        disciplina: "Direito Constitucional",
        topico: "Sigilo de comunicações e reserva de jurisdição (Art. 5º, XII, CF/88)",
        enunciado:
          "De acordo com a disciplina constitucional do sigilo das comunicações (art. 5º, XII, da CF/88) e a legislação de regência (Lei nº 9.296/1996), a interceptação de comunicações telefônicas e telemáticas submete-se ao princípio da reserva absoluta de jurisdição, sendo vedada a sua decretação ex officio pelo magistrado durante a fase preliminar do inquérito policial.",
        tipo: "CERTO_ERRADO",
        alternativas: [
          { letra: "C", texto: "Certo" },
          { letra: "E", texto: "Errado" },
        ],
        gabarito: "CERTO",
        justificativa:
          "CERTO. Com as alterações introduzidas pelo Pacote Anticrime (Lei nº 13.964/2019) e em observância ao princípio acusatório que veda a iniciativa probatória inquisitiva do juiz na fase pré-processual, o art. 3º, I, da Lei 9.296/1996 determina que a interceptação na fase de inquérito policial depende estritamente de requerimento do Ministério Público ou de representação da autoridade policial. É defeso ao juiz decretá-la de ofício no inquérito, preservando-se sua imparcialidade.",
        difficultyEstimate: 3.2,
      },
      {
        numeroQuestao: 5,
        disciplina: "Tecnologia da Informação",
        topico: "Redes de Computadores / Protocolos de transporte",
        enunciado:
          "No modelo de referência da arquitetura TCP/IP, o protocolo TCP (Transmission Control Protocol) provê comunicação orientada a conexão, controle de fluxo e garantia de entrega ordenada dos segmentos mediante confirmações (ACK) e janela deslizante, ao passo que o protocolo UDP (User Datagram Protocol), por ser não orientado a conexão e não implementar controle de congestionamento nativo, é prioritariamente adotado em transmissões de áudio e vídeo em tempo real (VoIP e streaming), nas quais a baixa latência prepondera sobre a eventual tolerância a perdas pontuais de pacotes.",
        tipo: "CERTO_ERRADO",
        alternativas: [
          { letra: "C", texto: "Certo" },
          { letra: "E", texto: "Errado" },
        ],
        gabarito: "CERTO",
        justificativa:
          "CERTO. O TCP opera de forma confiável (handshake tripartite SYN / SYN-ACK / ACK, controle de fluxo e retransmissões), gerando maior sobrecarga (overhead de 20 bytes no cabeçalho). Em contrapartida, o UDP é connectionless, não retransmite pacotes perdidos e possui cabeçalho leve (8 bytes), o que minimiza atrasos (jitter e latência), tornando-o o protocolo padrão para serviços de streaming, chamadas de voz sobre IP e consultas DNS.",
        difficultyEstimate: 2.6,
      },
      {
        numeroQuestao: 6,
        disciplina: "Tecnologia da Informação",
        topico: "Banco de Dados / Propriedades ACID",
        enunciado:
          "Em um Sistema de Gerenciamento de Banco de Dados Relacional (SGBD-R), a propriedade da Atomicidade do modelo ACID estabelece que, havendo concorrência de múltiplas transações simultâneas no banco de dados, os efeitos intermediários gerados por uma transação antes da sua efetivação (commit) devem permanecer imediatamente visíveis às demais transações ativas, assegurando o máximo throughput operacional do sistema.",
        tipo: "CERTO_ERRADO",
        alternativas: [
          { letra: "C", texto: "Certo" },
          { letra: "E", texto: "Errado" },
        ],
        gabarito: "ERRADO",
        justificativa:
          "ERRADO. O item descreve de forma equivocada o conceito de Isolamento (Isolation) e não de Atomicidade. A Atomicidade ('tudo ou nada') garante que todas as instruções de uma transação sejam consumadas conjuntamente ou, em caso de erro, revertidas em sua totalidade (rollback). Por sua vez, o Isolamento é a propriedade responsável por assegurar que transações concorrentes não interfiram entre si nem leiam dados parciais/sujos (dirty reads) antes do commit formal.",
        difficultyEstimate: 3.0,
      },
      {
        numeroQuestao: 7,
        disciplina: "Língua Portuguesa",
        topico: "Sintaxe de concordância verbal com pronome 'se'",
        enunciado:
          "No trecho 'Apuraram-se com rigor técnico as evidências periciais extraídas dos dispositivos apreendidos', a concordância verbal no plural atende às prescrições da norma-padrão gramatical, uma vez que a expressão 'as evidências periciais' desempenha a função de sujeito paciente da oração, e a partícula 'se' atua como pronome apassivador.",
        tipo: "CERTO_ERRADO",
        alternativas: [
          { letra: "C", texto: "Certo" },
          { letra: "E", texto: "Errado" },
        ],
        gabarito: "CERTO",
        justificativa:
          "CERTO. Na voz passiva sintética (verbo transitivo direto acompanhado do pronome apassivador 'se'), o termo que seria objeto direto na voz ativa passa a exercer a função sintática de sujeito paciente. Assim, 'as evidências periciais...' é o sujeito paciente plural (equivalente a: 'As evidências periciais foram apuradas'), exigindo a concordância do verbo no plural ('Apuraram-se').",
        difficultyEstimate: 3.1,
      },
      {
        numeroQuestao: 8,
        disciplina: "Tecnologia da Informação",
        topico: "Segurança da Informação / Criptografia assimétrica",
        enunciado:
          "Na assinatura digital de documentos eletrônicos sob os padrões da Infraestrutura de Chaves Públicas (ICP-Brasil), o remetente utiliza a chave pública do destinatário para cifrar o hash (resumo criptográfico) da mensagem original, garantindo a autenticidade, a integridade e o não repúdio do documento assinado.",
        tipo: "CERTO_ERRADO",
        alternativas: [
          { letra: "C", texto: "Certo" },
          { letra: "E", texto: "Errado" },
        ],
        gabarito: "ERRADO",
        justificativa:
          "ERRADO. Na assinatura digital, o emissor utiliza a sua PRÓPRIA CHAVE PRIVADA (secreta) para encriptar o hash gerado a partir do conteúdo do documento. O destinatário ou qualquer terceiro verificador utiliza a chave PÚBLICA do remetente para decifrar o hash e atestar a autoria e integridade. A chave pública do destinatário é empregada para cifrar mensagens visando confidencialidade (sigilo), e não para confecção de assinatura digital pelo emissor.",
        difficultyEstimate: 3.4,
      },
    ],
  },
  {
    banca: "FGV",
    orgao: "Receita Federal",
    cargo: "Auditor-Fiscal da Receita Federal",
    ano: 2023,
    editalUrl: "https://conhecimento.fgv.br/concursos/rfb22",
    questions: [
      {
        numeroQuestao: 1,
        disciplina: "Direito Tributário",
        topico: "Princípio da anterioridade anual e nonagesimal",
        enunciado:
          "Em 15 de novembro de determinado exercício financeiro, foi publicada Medida Provisória que majorou simultaneamente as alíquotas da Contribuição Social sobre o Lucro Líquido (CSLL), do Imposto sobre Produtos Industrializados (IPI) e do Imposto sobre a Renda das Pessoas Jurídicas (IRPJ). Considerando as limitações constitucionais ao poder de tributar vigentes no ordenamento brasileiro, assinale a afirmativa correta quanto ao início da produção de efeitos das referidas majorações:",
        tipo: "MULTIPLA_ESCOLHA",
        alternativas: [
          {
            letra: "A",
            texto:
              "A majoração do IPI sujeita-se à anterioridade anual de exercício e à anterioridade nonagesimal cumulativas, produzindo efeitos tão somente no exercício seguinte após 90 dias.",
          },
          {
            letra: "B",
            texto:
              "A majoração da CSLL constitui exceção à anterioridade de exercício (anual), submetendo-se estritamente à anterioridade nonagesimal de 90 dias a contar da publicação da norma.",
          },
          {
            letra: "C",
            texto:
              "A majoração do IRPJ consubstancia exceção expressa à anterioridade anual e à nonagesimal, gerando eficácia fiscal imediata no próprio dia da publicação da medida provisória.",
          },
          {
            letra: "D",
            texto:
              "Tanto a CSLL quanto o IRPJ submetem-se cumulativamente à anterioridade anual de exercício e à anterioridade mitigada nonagesimal de 90 dias.",
          },
          {
            letra: "E",
            texto:
              "O IPI e a CSLL são tributos regulatórios extrafiscais imunes a qualquer modalidade de anterioridade temporal, aplicando-se de imediato aos fatos geradores pendentes.",
          },
        ],
        gabarito: "B",
        justificativa:
          "Gabarito: B. Nos termos do art. 195, § 6º da CF/88, as contribuições sociais destinadas à seguridade social (incluindo a CSLL) só poderão ser exigidas após decorridos 90 dias da data da publicação da lei que as houver instituído ou modificado, não se lhes aplicando a anterioridade anual do art. 150, III, 'b'. Já o IPI é exceção à anterioridade anual, mas submete-se à noventena (art. 150, § 1º). O IRPJ submete-se à anterioridade anual de exercício, porém constitui expressa exceção à noventena constitucional (art. 150, § 1º in fine).",
        difficultyEstimate: 3.7,
      },
      {
        numeroQuestao: 2,
        disciplina: "Direito Tributário",
        topico: "Suspensão do Crédito Tributário (Art. 151 do CTN)",
        enunciado:
          "Determinada sociedade empresária do setor industrial foi autuada pela Secretaria da Receita Federal do Brasil por suposta falta de recolhimento de tributos federais e aduaneiros. Visando salvaguardar sua regularidade fiscal e obter Certidão Positiva com Efeitos de Negativa (CPEN), a empresa consultou sua assessoria jurídica sobre as providências adequadas. À luz das disposições expressas do Código Tributário Nacional (CTN), assinale a opção que congrega exclusivamente causas de suspensão da exigibilidade do crédito tributário:",
        tipo: "MULTIPLA_ESCOLHA",
        alternativas: [
          {
            letra: "A",
            texto:
              "O depósito do montante integral, a moratória formalmente concedida e a concessão de medida liminar em mandado de segurança.",
          },
          {
            letra: "B",
            texto:
              "A compensação tributária homologada, a remissão parcial da dívida e o parcelamento deferido.",
          },
          {
            letra: "C",
            texto:
              "A dação em pagamento em bens imóveis, a prescrição consumada do direito de cobrança e a anistia fiscal de infrações.",
          },
          {
            letra: "D",
            texto:
              "A transação tributária terminativa, a consignação em pagamento julgada procedente e a interposição de recurso administrativo intempestivo.",
          },
          {
            letra: "E",
            texto:
              "A isenção concedida em caráter geral, a decadência do direito de lançar e a conversão definitiva do depósito em renda.",
          },
        ],
        gabarito: "A",
        justificativa:
          "Gabarito: A. Conforme o rol taxativo do art. 151 do CTN, suspendem a exigibilidade do crédito tributário: I - moratória; II - o depósito do seu montante integral; III - as reclamações e os recursos tempestivos no processo administrativo tributário; IV - a concessão de medida liminar em mandado de segurança; V - a concessão de medida liminar ou tutela antecipada em outras ações judiciais; VI - o parcelamento. As demais opções citam causas de extinção (art. 156 do CTN, ex: compensação, remissão, prescrição, conversão em renda) ou causas de exclusão do crédito (art. 175 do CTN, ex: isenção e anistia).",
        difficultyEstimate: 2.9,
      },
      {
        numeroQuestao: 3,
        disciplina: "Tecnologia da Informação",
        topico: "Ciência de Dados / Avaliação de modelos de Machine Learning",
        enunciado:
          "A equipe de auditoria e ciência de dados da Receita Federal desenvolveu um modelo de aprendizado supervisionado para classificar declarações de imposto de renda e notas fiscais com suspeita de fraude aduaneira e sonegação. Em virtude do extremo desbalanceamento da base histórica (em que as transações fraudulentas representam menos de 0,3% do volume total), a equipe foi incumbida de definir a métrica primária para otimização do classificador, priorizando a detecção do maior número possível de fraudes reais (minimização de falsos negativos) sem desconsiderar a precisão das diligências fiscais. Assinale a alternativa que indica a métrica e a justificativa técnica mais apropriadas:",
        tipo: "MULTIPLA_ESCOLHA",
        alternativas: [
          {
            letra: "A",
            texto:
              "Acurácia global simples, haja vista que reflete a proporção total de predições corretas e não sofre distorções estatísticas em distribuições de classes raras.",
          },
          {
            letra: "B",
            texto:
              "F1-Score ou F-Beta (com beta > 1), pois calcula a média harmônica ponderada entre Precisão e Recall, priorizando o Recall para capturar as fraudes sem ser iludido pela predominância de registros normais.",
          },
          {
            letra: "C",
            texto:
              "Coeficiente de Determinação Linear (R²), por mensurar a variância residual direta em matrizes de confusão binárias discretas.",
          },
          {
            letra: "D",
            texto:
              "Erro Médio Absoluto (MAE) ponderado pela Especificidade, já que anula a necessidade de ajuste fino do threshold de probabilidade da função sigmoide.",
          },
          {
            letra: "E",
            texto:
              "Coeficiente de Pearson entre a classe real e o faturamento nominal bruto, determinando relação de causalidade direta sem custo computacional de validação cruzada.",
          },
        ],
        gabarito: "B",
        justificativa:
          "Gabarito: B. Em cenários de classes severamente desbalanceadas (como detecção de fraudes financeiras e fiscais), a Acurácia simples é uma métrica falaciosa (um classificador ingênuo que rotulasse 100% dos dados como 'não fraude' atingiria 99,7% de acurácia, deixando escapar todas as fraudes). O Recall mede a sensibilidade de capturar os verdadeiros positivos (evitando fraudes despercebidas), e o F1-Score (ou F-Beta com ênfase em Recall) calibra harmonicamente Precisão e Sensibilidade, sendo a métrica consagrada para modelagem fiscal.",
        difficultyEstimate: 3.6,
      },
      {
        numeroQuestao: 4,
        disciplina: "Tecnologia da Informação",
        topico: "Modelagem Dimensional e Data Warehouse",
        enunciado:
          "Na estruturação do Data Warehouse analítico da administração tributária federal voltado ao cruzamento massivo de informações fiscais, a equipe técnica adotou a metodologia de modelagem dimensional de Ralph Kimball. A respeito das características de tabelas Fato, tabelas Dimensão e da arquitetura do Star Schema (esquema estrela) em contraste com o Snowflake Schema (esquema floco de neve), assinale a afirmativa correta:",
        tipo: "MULTIPLA_ESCOLHA",
        alternativas: [
          {
            letra: "A",
            texto:
              "No Star Schema, todas as tabelas de dimensão encontram-se rigorosamente normalizadas na 3ª Forma Normal (3FN), gerando encadeamentos extensos de tabelas auxiliares.",
          },
          {
            letra: "B",
            texto:
              "A tabela Fato é composta primordialmente por chaves estrangeiras que referenciam as chaves substitutas (surrogate keys) das dimensões e por atributos numéricos aditivos ou semiaditivos que representam as medidas quantificáveis do negócio fiscal.",
          },
          {
            letra: "C",
            texto:
              "O Snowflake Schema é desenhado expressamente para desnormalizar as dimensões em tabelas únicas de grande porte, com o escopo de suprimir completamente operações de JOIN em consultas SQL analíticas.",
          },
          {
            letra: "D",
            texto:
              "A operação OLAP de Roll-up consiste na navegação descendente dos níveis mais sintetizados e agregados para os dados de granularidade atômica e detalhada.",
          },
          {
            letra: "E",
            texto:
              "As tabelas de dimensão concentram o maior volume em gigabytes do Data Warehouse, superando em cardinalidade e frequência de atualização as tabelas fato.",
          },
        ],
        gabarito: "B",
        justificativa:
          "Gabarito: B. Na modelagem dimensional, a Tabela Fato armazena os eventos mensuráveis de interesse analítico (ex: valor da arrecadação, imposto apurado, volume de transações) na forma de métricas/medidas numéricas, acompanhadas de chaves estrangeiras que a vinculam às dimensões de contexto (tempo, contribuinte, tributo, localidade). A alternativa A inverte os conceitos (o Snowflake é que normaliza dimensões; o Star schema adota dimensões desnormalizadas para rapidez). A alternativa D descreve o Drill-down (Roll-up é a agregação ascendente).",
        difficultyEstimate: 3.3,
      },
      {
        numeroQuestao: 5,
        disciplina: "Língua Portuguesa",
        topico: "Compreensão e hermenêutica inferencial (Estilo FGV)",
        enunciado:
          "Leia com atenção o excerto a seguir:\n\n'A autoridade da norma fiscal não emana da sua fria literalidade tipográfica, mas da convicção social de que o arbítrio foi contido pela equidade. Quando a fiscalização tributária se transfigura em mero cálculo persecutório despido de razoabilidade, o Estado não arrecada riqueza legítima: tributa a confiança do contribuinte, corroendo a própria base sobre a qual repousa a solidariedade do pacto fiscal.'\n\nCom base na estruturação argumentativa do autor e nas inferências possíveis do texto, assinale a opção que expressa o pressuposto basilar da tese defendida:",
        tipo: "MULTIPLA_ESCOLHA",
        alternativas: [
          {
            letra: "A",
            texto:
              "A eficácia legítima da imposição tributária depende indissociavelmente do sentimento coletivo de justiça e da contenção da voracidade fiscal pelo princípio da proporcionalidade.",
          },
          {
            letra: "B",
            texto:
              "A literalidade do texto legal deve ser sistematicamente ignorada pelas autoridades fiscais em proveito de dispensas discricionárias benevolentes.",
          },
          {
            letra: "C",
            texto:
              "O pacto fiscal moderno preconiza o desmantelamento gradual dos órgãos arrecadadores estatais em prol da doação espontânea e benevolente dos cidadãos.",
          },
          {
            letra: "D",
            texto:
              "O sucesso financeiro da arrecadação pública mede-se com rigor matemático pela quantidade de autos de infração e penalidades sancionatórias impostas aos contribuintes.",
          },
          {
            letra: "E",
            texto:
              "O princípio da razoabilidade constitui elemento subsidiário e dispensável quando colocado em confronto com a imperatividade da receita orçamentária compulsória.",
          },
        ],
        gabarito: "A",
        justificativa:
          "Gabarito: A. A questão explora a hermenêutica textual e os pressupostos lógicos típicos da banca FGV. O autor contrapõe a fria literalidade da lei à legitimidade derivada da 'equidade' e 'razoabilidade', argumentando que a fiscalização desmedida compromete a própria base social do pacto fiscal ('tributa a confiança'). Logo, o pressuposto basilar é que a autoridade e legitimidade da tributação repousam no sentimento de justiça e na contenção do excesso estatal.",
        difficultyEstimate: 3.5,
      },
      {
        numeroQuestao: 6,
        disciplina: "Língua Portuguesa",
        topico: "Paralelismo sintático e regência verbal culta (Estilo FGV)",
        enunciado:
          "Assinale a frase em que o emprego dos pronomes relativos, a regência verbal e o paralelismo sintático estão em perfeita conformidade com o padrão culto da língua portuguesa:",
        tipo: "MULTIPLA_ESCOLHA",
        alternativas: [
          {
            letra: "A",
            texto:
              "O processo administrativo fiscal a que o auditor se referiu contempla tanto a revisão das alíquotas aplicadas quanto a anulação das multas indevidas.",
          },
          {
            letra: "B",
            texto:
              "Este é o regulamento aduaneiro onde constam os procedimentos que todos os contribuintes importadores devem obedecer com rigor irrestrito.",
          },
          {
            letra: "C",
            texto:
              "O relatório da fiscalização visava a apuração dos créditos prescritos e indicar medidas cautelares cabíveis contra os sonegadores.",
          },
          {
            letra: "D",
            texto:
              "A legislação em cuja interpretação discordamos estabelece critérios objetivos com os quais os peritos judiciais não compactuam dos mesmos.",
          },
          {
            letra: "E",
            texto:
              "O colegiado de julgamento preferia mais lavrar novo auto de infração complementar do que homologar a transação sem garantias reais.",
          },
        ],
        gabarito: "A",
        justificativa:
          "Gabarito: A. Análise detalhada das alternativas: A está escorreita: 'referir-se' é verbo pronominal que rege a preposição 'a' ('referiu-se a que'), e a correlação 'tanto... quanto' preserva rigoroso paralelismo morfossintático ('a revisão...' / 'a anulação...'). Em B, o relativo 'onde' é de uso exclusivo para lugares físicos espaciais, e 'obedecer' exige regência transitiva indireta ('a que todos devem obedecer'). Em C, ocorre quebra de paralelismo entre substantivo ('a apuração') e oração reduzida de infinitivo ('e indicar'). Em D, há erro de regência ('de cuja interpretação discordamos') e pleonasmo vicioso ('não compactuam dos mesmos'). Em E, a regência culta do verbo 'preferir' repele expressões de intensidade como 'mais' e a correlação 'do que' (o correto é: 'preferia lavrar... a homologar...').",
        difficultyEstimate: 3.8,
      },
      {
        numeroQuestao: 7,
        disciplina: "Direito Tributário",
        topico: "Responsabilidade Tributária de Sócios e Administradores (Art. 135 do CTN)",
        enunciado:
          "A respeito da responsabilidade tributária pessoal atribuível aos sócios-gerentes, diretores e administradores de pessoas jurídicas de direito privado pelas obrigações tributárias societárias, em consonância com o art. 135, III, do CTN e com a jurisprudência sumulada do Superior Tribunal de Justiça (STJ), assinale a afirmativa correta:",
        tipo: "MULTIPLA_ESCOLHA",
        alternativas: [
          {
            letra: "A",
            texto:
              "O mero inadimplemento da obrigação tributária societária é causa autônoma e suficiente para caracterizar infração de lei e justificar o redirecionamento automático da execução fiscal contra os bens particulares do administrador.",
          },
          {
            letra: "B",
            texto:
              "O redirecionamento da execução fiscal contra o sócio com poderes de administração condiciona-se à prática de atos com excesso de poderes ou infração à lei, ao contrato ou estatuto, presumindo-se legítimo no caso de dissolução irregular da sociedade (Súmula 435/STJ).",
          },
          {
            letra: "C",
            texto:
              "A responsabilidade tributária solidária do art. 135 do CTN recai indistintamente sobre todos os sócios quotistas, independentemente de terem exercido poderes de gestão ou assinado atos societários.",
          },
          {
            letra: "D",
            texto:
              "A dissolução irregular da pessoa jurídica obsta em definitivo a cobrança do crédito tributário, cabendo à Fazenda Pública promover a declaração de remissão extintiva do débito.",
          },
          {
            letra: "E",
            texto:
              "A certidão de dívida ativa (CDA) que contenha o nome do sócio-gerente desonera a Fazenda Pública do ônus da prova, operando presunção juris et de jure de fraude que não admite prova em contrário.",
          },
        ],
        gabarito: "B",
        justificativa:
          "Gabarito: B. A Súmula 430 do STJ pacificou que 'O simples inadimplemento da obrigação tributária não gera, por si só, a responsabilidade pessoal do sócio-administrador'. É mister a comprovação de atos com dolo, excesso de poderes ou infração de lei (art. 135, III, do CTN). Por outro lado, a Súmula 435 do STJ estabelece que se presume dissolvida irregularmente a empresa que deixar de funcionar no seu domicílio fiscal sem comunicação aos órgãos competentes, legitimando o redirecionamento da execução fiscal para o sócio-gerente.",
        difficultyEstimate: 3.4,
      },
      {
        numeroQuestao: 8,
        disciplina: "Tecnologia da Informação",
        topico: "Ciência de Dados e Sistemas Distribuídos / Teorema CAP",
        enunciado:
          "Para garantir o cruzamento em tempo real de dezenas de milhões de documentos fiscais eletrônicos distribuídos geograficamente, os arquitetos de dados da Receita Federal avaliaram as propriedades do Teorema CAP (Consistência, Disponibilidade e Tolerância ao Particionamento de Rede). À luz das premissas fundamentais estabelecidas por Eric Brewer para sistemas distribuídos de banco de dados, assinale a afirmativa correta:",
        tipo: "MULTIPLA_ESCOLHA",
        alternativas: [
          {
            letra: "A",
            texto:
              "O Teorema CAP demonstra ser perfeitamente viável conceber um sistema distribuído de dados em larga escala que assegure de forma plena e simultânea Consistência estrita (C), Disponibilidade total (A) e Tolerância a Particionamentos (P) durante eventos de falha de conexão física entre os nós.",
          },
          {
            letra: "B",
            texto:
              "Diante da ocorrência fática e inevitável de partições de rede (P) em sistemas distribuídos geograficamente, o arquiteto de software deve obrigatoriamente optar entre garantir consistência estrita (sistema CP) ou assegurar disponibilidade contínua das réplicas (sistema AP).",
          },
          {
            letra: "C",
            texto:
              "Os bancos de dados NoSQL da família colunar (Wide-Column) e de documentos obedecem invariavelmente às propriedades ACID tradicionais, descartando qualquer forma de consistência eventual (BASE).",
          },
          {
            letra: "D",
            texto:
              "A Tolerância a Particionamento (P) pode ser desativada sem qualquer risco em servidores hospedados na nuvem pública por meio de diretivas simples de balanceamento de carga DNS.",
          },
          {
            letra: "E",
            texto:
              "Em um sistema com garantia de Consistência e Tolerância a Partição (CP), o cluster sempre responde a todas as requisições de escrita mesmo quando as mensagens não conseguem ser propagadas para os demais nós.",
          },
        ],
        gabarito: "B",
        justificativa:
          "Gabarito: B. O Teorema CAP enuncia que, em qualquer sistema de armazenamento de dados distribuído, é tecnicamente impossível prover simultaneamente mais de duas das três garantias: Consistência (todos os nós enxergam o mesmo dado simultaneamente), Disponibilidade (toda requisição recebe uma resposta não errônea) e Tolerância a Partições (o sistema continua funcionando apesar de perdas ou atrasos na comunicação de rede). Como as redes de computadores estão sujeitas a partições inevitáveis (P), resta aos engenheiros escolher entre consistência rígida à custa da disponibilidade (CP) ou disponibilidade ininterrupta adotando consistência eventual (AP).",
        difficultyEstimate: 3.6,
      },
    ],
  },
];

async function seedExams() {
  console.log("===============================================================");
  console.log("🚀 SYNAPSE AI - SCRIPT DE INGESTÃO DE PROVAS & QUESTÕES REAIS");
  console.log("===============================================================\n");

  let totalExamsInsertedOrUpdated = 0;
  let totalQuestionsInserted = 0;

  for (const examData of EXAMS_DATA) {
    console.log(
      `🏛️ Processando caderno: [${examData.banca}] ${examData.orgao} - ${examData.cargo} (${examData.ano})...`
    );

    // 1. Localiza se o caderno de prova já foi cadastrado para garantir idempotência
    let exam = await prisma.bankExam.findFirst({
      where: {
        banca: examData.banca,
        orgao: examData.orgao,
        cargo: examData.cargo,
        ano: examData.ano,
      },
    });

    if (!exam) {
      exam = await prisma.bankExam.create({
        data: {
          banca: examData.banca,
          orgao: examData.orgao,
          cargo: examData.cargo,
          ano: examData.ano,
          editalUrl: examData.editalUrl,
          isProcessed: true,
        },
      });
      console.log(`   ✨ Novo caderno criado com ID: ${exam.id}`);
    } else {
      exam = await prisma.bankExam.update({
        where: { id: exam.id },
        data: {
          editalUrl: examData.editalUrl,
          isProcessed: true,
        },
      });
      console.log(`   ♻️ Caderno existente encontrado (ID: ${exam.id}). Atualizando dados...`);

      // Limpeza seletiva das questões anteriores deste caderno para evitar duplicações em múltiplas execuções
      const deleted = await prisma.bankQuestion.deleteMany({
        where: { examId: exam.id },
      });
      console.log(`   🧹 ${deleted.count} questões legadas removidas para reinserção limpa.`);
    }

    // 2. Inserção das questões estruturadas do caderno
    for (const q of examData.questions) {
      await prisma.bankQuestion.create({
        data: {
          examId: exam.id,
          numeroQuestao: q.numeroQuestao,
          disciplina: q.disciplina,
          topico: q.topico,
          enunciado: q.enunciado,
          tipo: q.tipo,
          alternativas: q.alternativas as unknown as Prisma.InputJsonValue,
          gabarito: q.gabarito,
          justificativa: q.justificativa,
          anulada: false,
          desatualizada: false,
          difficultyEstimate: q.difficultyEstimate ?? 3.0,
        },
      });
    }

    console.log(
      `   ✅ ${examData.questions.length} questões cadastradas com sucesso para ${examData.banca} (${examData.ano}).\n`
    );

    totalExamsInsertedOrUpdated++;
    totalQuestionsInserted += examData.questions.length;
  }

  console.log("===============================================================");
  console.log("🎉 INGESTÃO CONCLUÍDA COM SUCESSO!");
  console.log("===============================================================");
  console.log(`📚 Cadernos de Provas Processados: ${totalExamsInsertedOrUpdated}`);
  console.log(`📝 Total de Questões Reais Inseridas: ${totalQuestionsInserted}`);

  // Detalhamento estatístico por disciplina e banca
  const disciplinasSummary = await prisma.bankQuestion.groupBy({
    by: ["disciplina"],
    _count: {
      id: true,
    },
    orderBy: {
      disciplina: "asc",
    },
  });

  console.log("\n📊 Distribuição Geral no Banco de Dados por Disciplina:");
  for (const disc of disciplinasSummary) {
    console.log(`   • ${disc.disciplina.padEnd(28)} : ${disc._count.id} questões`);
  }
  console.log("===============================================================\n");
}

seedExams()
  .catch((err) => {
    console.error("❌ Erro fatal ao executar seed de provas:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
