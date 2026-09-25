export interface EditalTemplateTopic {
  name: string;
}

export interface EditalTemplateSubject {
  name: string;
  color: string;
  weight: number;
  topics: EditalTemplateTopic[];
}

export interface EditalTemplate {
  id: string;
  title: string;
  shortDescription: string;
  icon: string; // emoji or identifier
  badge: string;
  category: "ti" | "policial" | "fiscal_controle" | "administrativo" | "juridica" | "geral" | "saude_educacao";
  materias: EditalTemplateSubject[];
}

export const STARTER_EDITAL_TEMPLATES: Record<string, EditalTemplate> = {
  ti: {
    id: "ti",
    title: "Tecnologia da Informação & Dados (BACEN, Caixa TI, BNDES, CNU Bloco 2)",
    shortDescription: "Banco de dados, engenharia de software, segurança, programação e ciência de dados.",
    icon: "💻",
    badge: "Em Alta 🔥",
    category: "ti",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 7.0,
        topics: [
          { name: "Compreensão e Interpretação de Textos Técnicos" },
          { name: "Coesão, Coerência e Redação Oficial" },
          { name: "Sintaxe, Concordância e Regência" },
          { name: "Pontuação e Emprego do Sinal de Crase" },
        ],
      },
      {
        name: "Banco de Dados & SQL",
        color: "#06B6D4",
        weight: 9.0,
        topics: [
          { name: "Modelagem Entidade-Relacionamento e Normalização (1FN a 3FN)" },
          { name: "SQL ANSI (DML, DDL, DCL, Subqueries, Joins e Views)" },
          { name: "Transações ACID, Índices e Otimização de Consultas" },
          { name: "Bancos NoSQL (Documento, Chave-Valor, Grafo e Colunar)" },
          { name: "Data Warehouse, Data Lake, ETL e Modelagem Dimensional" },
        ],
      },
      {
        name: "Engenharia de Software & Métodos Ágeis",
        color: "#8B5CF6",
        weight: 8.5,
        topics: [
          { name: "Ciclo de Vida do Software e Requisitos de Software" },
          { name: "Metodologias Ágeis (Scrum, Kanban, XP e TDD)" },
          { name: "Arquitetura de Software: Monólitos, Microsserviços e APIs RESTful" },
          { name: "Padrões de Projeto (Design Patterns GoF)" },
          { name: "DevOps, Integração e Entrega Contínua (CI/CD) e Git" },
        ],
      },
      {
        name: "Segurança da Informação & Redes",
        color: "#EF4444",
        weight: 8.5,
        topics: [
          { name: "Criptografia Simétrica, Assimétrica e Assinatura Digital" },
          { name: "Ataques e Vulnerabilidades (OWASP Top 10, Malwares, Phishing e DDoS)" },
          { name: "Gestão de Segurança e Normas ISO/IEC 27001 e 27002" },
          { name: "Redes: Modelo OSI, TCP/IP, DNS, HTTPS, VPN e Firewalls" },
          { name: "Privacidade e Lei Geral de Proteção de Dados (LGPD)" },
        ],
      },
      {
        name: "Programação & Estruturas de Dados",
        color: "#10B981",
        weight: 8.0,
        topics: [
          { name: "Algoritmos e Estruturas de Dados (Vetores, Listas, Pilhas, Filas e Árvores)" },
          { name: "Complexidade de Algoritmos (Notação Big-O)" },
          { name: "Programação Orientada a Objetos (POO): Classes, Herança e Polimorfismo" },
          { name: "Conceitos de Linguagens Modernas (Python, Java ou JavaScript/TypeScript)" },
        ],
      },
      {
        name: "Inteligência Artificial & Ciência de Dados",
        color: "#F59E0B",
        weight: 7.5,
        topics: [
          { name: "Fundamentos de Machine Learning e Aprendizado Supervisionado/Não Supervisionado" },
          { name: "Processamento de Linguagem Natural (NLP) e LLMs" },
          { name: "Data Analytics, Dashboards e Business Intelligence (Power BI/Metabase)" },
          { name: "Conceitos de Big Data e Computação em Nuvem (AWS, Azure ou GCP)" },
        ],
      },
    ],
  },
  ti_dev: {
    id: "ti_dev",
    title: "TI: Desenvolvimento de Software & Engenharia (BACEN, Caixa, BNDES, SERPRO)",
    shortDescription: "Programação, arquitetura limpa, microsserviços, APIs RESTful, DevOps, Git e testes.",
    icon: "⚡",
    badge: "Dev & Backend 🚀",
    category: "ti",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 7.0,
        topics: [
          { name: "Interpretação e Compreensão de Textos" },
          { name: "Sintaxe, Concordância e Regência" },
          { name: "Pontuação, Crase e Coesão Textual" },
        ],
      },
      {
        name: "Engenharia de Software & Arquitetura",
        color: "#8B5CF6",
        weight: 9.5,
        topics: [
          { name: "Padrões de Projeto (Design Patterns GoF: Factory, Singleton, Strategy, Observer)" },
          { name: "Arquitetura Hexagonal, Clean Architecture e DDD (Domain-Driven Design)" },
          { name: "Arquitetura de Microsserviços, API Gateway, Service Mesh e Mensageria (Kafka/RabbitMQ)" },
          { name: "Testes Automatizados (Unitários, Integração, Mocking, TDD e BDD)" },
          { name: "Refatoração, Código Limpo (Clean Code) e Princípios SOLID" },
        ],
      },
      {
        name: "Linguagens & Paradigmas de Programação",
        color: "#10B981",
        weight: 9.0,
        topics: [
          { name: "Programação Orientada a Objetos (POO Avançada: Polimorfismo, Generics e Exceções)" },
          { name: "Estruturas de Dados e Algoritmos de Busca/Ordenação (Notação Big-O)" },
          { name: "Ecossistema Java / Spring Boot ou Python / FastAPI" },
          { name: "Ecossistema TypeScript / JavaScript / Node.js" },
          { name: "Programação Funcional, Concorrência e Threads/Assincronismo" },
        ],
      },
      {
        name: "Banco de Dados & Persistência",
        color: "#06B6D4",
        weight: 8.5,
        topics: [
          { name: "Modelagem Relacional e Normalização (1FN a BCNF)" },
          { name: "SQL Avançado (Subconsultas, Window Functions, Triggers e Stored Procedures)" },
          { name: "Transações ACID, Isolamento e Otimização de Queries (EXPLAIN e Índices)" },
          { name: "Bancos NoSQL (MongoDB, Redis, Cassandra)" },
          { name: "ORMs e Estratégias de Caching" },
        ],
      },
      {
        name: "DevOps, CI/CD & Computação em Nuvem",
        color: "#EC4899",
        weight: 8.0,
        topics: [
          { name: "Controle de Versão com Git (Gitflow, Rebase, Cherry-pick e Merge Strategies)" },
          { name: "Contêineres com Docker (Dockerfiles, Multi-stage builds e Docker Compose)" },
          { name: "Orquestração com Kubernetes (Pods, Deployments, Services e Ingress)" },
          { name: "Pipelines de CI/CD (GitHub Actions, GitLab CI ou Jenkins)" },
          { name: "Conceitos de Nuvem (AWS / GCP / Azure: IaaS, PaaS, Serverless)" },
        ],
      },
      {
        name: "Segurança de Aplicações (AppSec)",
        color: "#EF4444",
        weight: 8.0,
        topics: [
          { name: "OWASP Top 10 (SQL Injection, XSS, CSRF, SSRF, Broken Auth)" },
          { name: "Autenticação e Autorização (OAuth 2.0, OpenID Connect, JWT e RBAC)" },
          { name: "Criptografia de Dados em Trânsito (TLS/HTTPS) e em Repouso" },
          { name: "Práticas de DevSecOps e Análise Estática/Dinâmica (SAST e DAST)" },
        ],
      },
    ],
  },
  ti_dados: {
    id: "ti_dados",
    title: "TI: Ciência de Dados, IA & Analytics (BNDES, BACEN, Receita Federal TI)",
    shortDescription: "Machine Learning, LLMs, pipelines de dados, estatística, SQL avançado e visualização.",
    icon: "🧠",
    badge: "IA & Dados 📊",
    category: "ti",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 7.0,
        topics: [
          { name: "Interpretação e Compreensão de Textos Técnicos" },
          { name: "Sintaxe, Concordância, Regência e Crase" },
        ],
      },
      {
        name: "Inteligência Artificial & Machine Learning",
        color: "#8B5CF6",
        weight: 9.5,
        topics: [
          { name: "Aprendizado Supervisionado: Regressão, Árvores de Decisão, Random Forest e SVM" },
          { name: "Aprendizado Não Supervisionado: K-Means, DBSCAN e PCA (Redução de Dimensionalidade)" },
          { name: "Deep Learning: Redes Neurais Artificiais, CNNs e RNNs/LSTMs" },
          { name: "Modelos de Linguagem (LLMs), Transformers, RAG e Embeddings" },
          { name: "Métricas de Avaliação: Matriz de Confusão, Acurácia, Precisão, Recall, F1-Score e Curva ROC-AUC" },
        ],
      },
      {
        name: "Engenharia de Dados & Big Data",
        color: "#06B6D4",
        weight: 9.0,
        topics: [
          { name: "Arquitetura de Dados: Data Warehouse, Data Lake, Lakehouse e Data Mesh" },
          { name: "Pipelines de ETL / ELT (Apache Airflow, dbt)" },
          { name: "Processamento Distribuído: Apache Spark, Hadoop e PySpark" },
          { name: "Streaming de Dados: Apache Kafka e RabbitMQ" },
          { name: "Bancos de Dados NoSQL e Vetoriais (Pinecone, Chroma, Milvus)" },
        ],
      },
      {
        name: "Banco de Dados & Modelagem Dimensional",
        color: "#10B981",
        weight: 8.5,
        topics: [
          { name: "Modelagem Multidimensional (Esquema Estrela e Floco de Neve)" },
          { name: "Tabelas Fato e Dimensões (SCD - Slowly Changing Dimensions)" },
          { name: "SQL Analítico: Window Functions (RANK, DENSE_RANK, ROW_NUMBER, LAG, LEAD)" },
          { name: "Tuning e Índices para Consultas Analíticas (OLAP vs OLTP)" },
        ],
      },
      {
        name: "Probabilidade & Estatística Aplicada a Dados",
        color: "#F59E0B",
        weight: 8.5,
        topics: [
          { name: "Estatística Descritiva: Média, Mediana, Moda, Variância e Desvio-Padrão" },
          { name: "Distribuições de Probabilidade: Normal, Binomial, Poisson e T-Student" },
          { name: "Inferência Estatística, Testes de Hipótese (P-valor, Erros Tipo I e II)" },
          { name: "Regressão Linear Múltipla e Logística" },
          { name: "Testes A/B e Significância Estatística" },
        ],
      },
      {
        name: "Visualização de Dados & Storytelling",
        color: "#EC4899",
        weight: 7.5,
        topics: [
          { name: "Ferramentas de BI (Power BI, Tableau, Metabase): DAX e Dashboards" },
          { name: "Bibliotecas Python de Visualização (Matplotlib, Seaborn, Plotly)" },
          { name: "Design de Dashboards, KPIs e Tomada de Decisão Baseada em Dados" },
        ],
      },
    ],
  },
  ti_infra_sec: {
    id: "ti_infra_sec",
    title: "TI: Redes, Cibersegurança & Nuvem (PF Perito TI, Tribunais, ABIN)",
    shortDescription: "Segurança defensiva, redes TCP/IP, Linux, perícia forense digital, cloud e normas ISO.",
    icon: "🛡️",
    badge: "Cibersegurança 🔒",
    category: "ti",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 7.0,
        topics: [
          { name: "Interpretação Textual e Redação Oficial" },
          { name: "Gramática Normativa e Regência" },
        ],
      },
      {
        name: "Cibersegurança & Defesa Cibernética",
        color: "#EF4444",
        weight: 9.5,
        topics: [
          { name: "Criptografia Simétrica (AES), Assimétrica (RSA, ECC), Hash (SHA-2/3) e Assinatura Digital" },
          { name: "Infraestrutura de Chaves Públicas (ICP-Brasil e Certificados Digitais X.509)" },
          { name: "Ataques e Ameaças: Ransomware, Phishing, Man-in-the-Middle, DDoS e Exploits" },
          { name: "Segurança de Redes: Firewalls (Next-Gen), IDS/IPS, WAF, DMZ e VPN" },
          { name: "Gestão de Vulnerabilidades, Pentest e Análise de Riscos" },
          { name: "Normas e Frameworks: ISO/IEC 27001, 27002, 27005, NIST Cybersecurity Framework" },
        ],
      },
      {
        name: "Redes de Computadores & Protocolos",
        color: "#06B6D4",
        weight: 9.0,
        topics: [
          { name: "Arquitetura de Redes: Modelo OSI (7 camadas) e Pilha TCP/IP" },
          { name: "Endereçamento IPv4, Máscaras de Sub-rede (CIDR) e Fundamentos de IPv6" },
          { name: "Protocolos de Transporte e Aplicação: TCP, UDP, DNS, DHCP, HTTP/HTTPS, SSH e SNMP" },
          { name: "Roteamento e Comutação: VLANs, Spanning Tree Protocol (STP), OSPF e BGP" },
          { name: "Redes Sem Fio: Padrões IEEE 802.11 (Wi-Fi) e Protocolos WPA2/WPA3" },
        ],
      },
      {
        name: "Sistemas Operacionais & Administração de Servidores",
        color: "#8B5CF6",
        weight: 8.5,
        topics: [
          { name: "Sistemas Linux: Shell Script (Bash), Processos, Usuários e Permissões" },
          { name: "Sistemas de Arquivos Linux (ext4, XFS) e Estrutura de Diretórios" },
          { name: "Serviços de Rede em Linux (Apache, Nginx, BIND DNS, Samba e SSH Server)" },
          { name: "Windows Server: Active Directory (AD DS), Políticas de Grupo (GPO), DNS e Kerberos" },
          { name: "Virtualização: Hipervisores Tipo 1 e Tipo 2 (KVM, VMware ESXi, Hyper-V)" },
        ],
      },
      {
        name: "Computação Forense & Perícia Digital",
        color: "#F59E0B",
        weight: 8.5,
        topics: [
          { name: "Cadeia de Custódia de Evidências Digitais (Art. 158-A do CPP e ABNT NBR ISO/IEC 27037)" },
          { name: "Aquisição Forense: Imagens Físicas e Lógicas, Write-Blockers e Hashes de Integridade" },
          { name: "Análise de Memória RAM (Volatility) e Artefatos do Windows (Prefetch, MFT, Registro)" },
          { name: "Forense de Redes e Análise de Tráfego com Wireshark/Tcpdump" },
          { name: "Legislação Aplicada: Marco Civil da Internet (Lei 12.965/14) e Crimes Cibernéticos (Lei 12.737/12)" },
        ],
      },
      {
        name: "Governança de TI & Privacidade",
        color: "#10B981",
        weight: 7.5,
        topics: [
          { name: "Lei Geral de Proteção de Dados Pessoais (LGPD - Lei 13.709/18)" },
          { name: "ITIL v4: Sistema de Valor de Serviço e Práticas de Gerenciamento" },
          { name: "COBIT 2019: Princípios de Governança e Gestão de TI" },
        ],
      },
    ],
  },
  policial: {
    id: "policial",
    title: "Carreiras Policiais (PF, PRF e PC)",
    shortDescription: "Foco nas matérias mais pesadas da área de segurança pública e penal.",
    icon: "👮",
    badge: "Mais Escolhido",
    category: "policial",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 8.0,
        topics: [
          { name: "Compreensão e Interpretação de Textos" },
          { name: "Ortografia e Acentuação Gráfica" },
          { name: "Morfologia e Classes de Palavras" },
          { name: "Sintaxe do Período e Concordância" },
          { name: "Regência e Emprego do Sinal de Crase" },
          { name: "Pontuação e Coesão Textual" },
        ],
      },
      {
        name: "Direito Constitucional",
        color: "#8B5CF6",
        weight: 7.5,
        topics: [
          { name: "Direitos e Deveres Individuais e Coletivos (Art. 5º)" },
          { name: "Direitos Sociais e Nacionalidade" },
          { name: "Organização Político-Administrativa do Estado" },
          { name: "Segurança Pública (Art. 144 da CF/88)" },
          { name: "Poder Executivo e Atribuições" },
        ],
      },
      {
        name: "Direito Administrativo",
        color: "#EC4899",
        weight: 7.0,
        topics: [
          { name: "Princípios Expressos e Implícitos da Administração" },
          { name: "Atos Administrativos (Requisitos, Atributos e Espécies)" },
          { name: "Poderes Administrativos e Poder de Polícia" },
          { name: "Responsabilidade Civil do Estado" },
          { name: "Regime Jurídico dos Servidores Públicos (Lei 8.112/90)" },
        ],
      },
      {
        name: "Direito Penal & Processo Penal",
        color: "#EF4444",
        weight: 8.5,
        topics: [
          { name: "Aplicação da Lei Penal no Tempo e Espaço" },
          { name: "Teoria Geral do Crime (Fato Típico, Ilicitude e Culpabilidade)" },
          { name: "Crimes Contra a Pessoa e Contra o Patrimônio" },
          { name: "Inquérito Policial e Notitia Criminis" },
          { name: "Prisão em Flagrante, Preventiva e Temporária" },
        ],
      },
      {
        name: "Raciocínio Lógico & Matemática",
        color: "#F59E0B",
        weight: 6.5,
        topics: [
          { name: "Lógica Proposicional, Conectivos e Tabelas-Verdade" },
          { name: "Equivalências e Negações Lógicas" },
          { name: "Diagramas Lógicos e Conjuntos" },
          { name: "Análise Combinatória e Probabilidade Básica" },
        ],
      },
      {
        name: "Informática & Tecnologia",
        color: "#10B981",
        weight: 8.0,
        topics: [
          { name: "Sistemas Operacionais (Windows e Linux)" },
          { name: "Redes de Computadores e Protocolos de Internet" },
          { name: "Segurança da Informação, Malwares e Golpes Digitais" },
          { name: "Computação em Nuvem e Ferramentas Colaborativas" },
        ],
      },
    ],
  },
  fiscal: {
    id: "fiscal",
    title: "Carreiras Fiscais & Auditoria (Receita Federal, SEFAZ e ISS)",
    shortDescription: "Tributário, contabilidade avançada, auditoria e legislação fiscal.",
    icon: "💰",
    badge: "Alta Remuneração 💎",
    category: "fiscal_controle",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 7.5,
        topics: [
          { name: "Interpretação e Compreensão Textual Avançada" },
          { name: "Sintaxe, Concordância, Regência e Pontuação" },
          { name: "Redação de Documentos Oficiais" },
        ],
      },
      {
        name: "Direito Tributário",
        color: "#10B981",
        weight: 9.5,
        topics: [
          { name: "Sistema Tributário Nacional e Princípios Constitucionais Tributários" },
          { name: "Limitações ao Poder de Tributar e Imunidades" },
          { name: "Competência Tributária e Espécies de Tributos" },
          { name: "Obrigação Tributária e Fato Gerador" },
          { name: "Crédito Tributário (Lançamento, Suspensão, Extinção e Exclusão)" },
          { name: "Administração Tributária e Dívida Ativa" },
        ],
      },
      {
        name: "Contabilidade Geral & Avançada",
        color: "#6366F1",
        weight: 9.0,
        topics: [
          { name: "Estrutura Conceitual Básica e Princípios Contábeis" },
          { name: "Balanço Patrimonial e DRE (Demonstração do Resultado do Exercício)" },
          { name: "Demonstração dos Fluxos de Caixa (DFC) e DVA" },
          { name: "Operações com Mercadorias e Estoques (PEPS, Média Ponderada)" },
          { name: "Ativo Imobilizado, Intangível e Pronunciamentos CPC" },
        ],
      },
      {
        name: "Auditoria Fiscal",
        color: "#EC4899",
        weight: 8.5,
        topics: [
          { name: "Normas Brasileiras de Contabilidade Aplicadas à Auditoria" },
          { name: "Planejamento de Auditoria e Relevância/Risco" },
          { name: "Testes Substantivos e Procedimentos de Controle" },
          { name: "Evidências, Amostragem e Papéis de Trabalho" },
          { name: "Relatórios e Pareceres de Auditoria" },
        ],
      },
      {
        name: "Legislação Tributária & Aduaneira",
        color: "#F59E0B",
        weight: 8.5,
        topics: [
          { name: "Impostos de Competência da União (IR, IPI, IOF, ITR)" },
          { name: "Impostos Estaduais (ICMS, IPVA, ITCMD) e Municipais (ISS, IPTU)" },
          { name: "Processo Administrativo Tributário (Decreto 70.235/72)" },
          { name: "Regulamento Aduaneiro e Comércio Exterior" },
        ],
      },
      {
        name: "Raciocínio Lógico, Matemática Financeira & Estatística",
        color: "#8B5CF6",
        weight: 7.0,
        topics: [
          { name: "Lógica Proposicional e Equivalências" },
          { name: "Juros Simples, Compostos e Descontos" },
          { name: "Estatística Descritiva: Média, Mediana, Variância e Desvio-Padrão" },
          { name: "Distribuições de Probabilidade e Amostragem" },
        ],
      },
    ],
  },
  controle: {
    id: "controle",
    title: "Controle & Gestão Governamental (TCU, CGU e Tribunais de Contas)",
    shortDescription: "Controle externo, AFO/LRF, licitações públicas e contabilidade pública.",
    icon: "⚖️",
    badge: "Estratégico 🏛️",
    category: "fiscal_controle",
    materias: [
      {
        name: "Controle Externo & Legislação Institucional",
        color: "#3B82F6",
        weight: 9.5,
        topics: [
          { name: "Fiscalização Contábil, Financeira e Orçamentária na CF/88" },
          { name: "Competências e Jurisdição do Tribunal de Contas da União (TCU)" },
          { name: "Regimento Interno e Lei Orgânica do TCU/CGU" },
          { name: "Tomada de Contas Especial (TCE) e Julgamento de Contas" },
          { name: "Controle Interno e Transparência Pública" },
        ],
      },
      {
        name: "Administração Financeira e Orçamentária (AFO & LRF)",
        color: "#10B981",
        weight: 9.0,
        topics: [
          { name: "Orçamento Público: PPA, LDO e LOA" },
          { name: "Princípios Orçamentários e Ciclo Orçamentário" },
          { name: "Receita e Despesa Pública (Classificações e Estágios)" },
          { name: "Créditos Adicionais e Restos a Pagar" },
          { name: "Lei de Responsabilidade Fiscal (LC 101/00): Metas e Limites de Gastos" },
        ],
      },
      {
        name: "Direito Administrativo & Licitações",
        color: "#EC4899",
        weight: 8.5,
        topics: [
          { name: "Nova Lei de Licitações e Contratos (Lei 14.133/21)" },
          { name: "Modalidades de Contratação, Critérios de Julgamento e Dispensa/Inexigibilidade" },
          { name: "Contratos Administrativos: Alterações, Rescisão e Sanções" },
          { name: "Convênios e Instrumentos Congêneres" },
          { name: "Processo Administrativo Federal (Lei 9.784/99)" },
        ],
      },
      {
        name: "Contabilidade Aplicada ao Setor Público (CASP)",
        color: "#8B5CF6",
        weight: 8.0,
        topics: [
          { name: "Conceito, Objeto e Campo de Aplicação da CASP" },
          { name: "Plano de Contas Aplicado ao Setor Público (PCASP)" },
          { name: "Demonstrações Contábeis Aplicadas ao Setor Público (MCASP)" },
          { name: "Balanço Orçamentário, Financeiro e Patrimonial" },
        ],
      },
      {
        name: "Auditoria Governamental & Gestão de Riscos",
        color: "#F59E0B",
        weight: 8.0,
        topics: [
          { name: "Normas de Auditoria do Setor Público (ISSAI/NBASP)" },
          { name: "Auditoria de Conformidade e Auditoria Operacional" },
          { name: "Controles Internos (Modelo COSO) e Gestão de Riscos" },
          { name: "Governança no Setor Público e Integridade" },
        ],
      },
      {
        name: "Língua Portuguesa & Redação Oficial",
        color: "#6366F1",
        weight: 7.0,
        topics: [
          { name: "Compreensão e Interpretação de Textos" },
          { name: "Manual de Redação da Presidência da República" },
          { name: "Coesão Textual e Argumentação" },
        ],
      },
    ],
  },
  administrativo: {
    id: "administrativo",
    title: "Tribunais & Administrativo (TJ, TRT, TRF, INSS e CNU)",
    shortDescription: "Base sólida para concursos administrativos, agências e tribunais.",
    icon: "🏛️",
    badge: "Geral",
    category: "administrativo",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 8.0,
        topics: [
          { name: "Compreensão e Interpretação de Textos" },
          { name: "Ortografia e Acentuação" },
          { name: "Classes de Palavras e Concordância" },
          { name: "Regência e Sinal Indicativo de Crase" },
          { name: "Pontuação e Coerência" },
        ],
      },
      {
        name: "Direito Constitucional",
        color: "#8B5CF6",
        weight: 7.5,
        topics: [
          { name: "Princípios Fundamentais da República" },
          { name: "Direitos e Garantias Fundamentais" },
          { name: "Organização dos Poderes (Judiciário e Executivo)" },
          { name: "Funções Essenciais à Justiça" },
        ],
      },
      {
        name: "Direito Administrativo",
        color: "#EC4899",
        weight: 7.5,
        topics: [
          { name: "Conceito, Fontes e Princípios da Administração" },
          { name: "Organização Administrativa (Direta e Indireta)" },
          { name: "Atos e Processo Administrativo" },
          { name: "Licitações e Contratos Administrativos (Lei 14.133/21)" },
          { name: "Estatuto dos Servidores Públicos (Lei 8.112/90)" },
        ],
      },
      {
        name: "Administração Geral & Pública",
        color: "#6366F1",
        weight: 7.0,
        topics: [
          { name: "Funções da Administração: Planejamento, Organização, Direção e Controle" },
          { name: "Gestão por Processos e Indicadores de Desempenho" },
          { name: "Atendimento ao Cidadão e Eficiência no Setor Público" },
        ],
      },
      {
        name: "Raciocínio Lógico & Matemática",
        color: "#F59E0B",
        weight: 6.0,
        topics: [
          { name: "Estruturas Lógicas e Conectivos" },
          { name: "Razão, Proporção e Regra de Três" },
          { name: "Porcentagem e Matemática Financeira Básica" },
        ],
      },
      {
        name: "Noções de Informática",
        color: "#10B981",
        weight: 6.0,
        topics: [
          { name: "Suíte de Escritório (Word, Excel, Documentos)" },
          { name: "Navegação na Web e Segurança Básica" },
          { name: "Conceitos de Armazenamento e Nuvem" },
        ],
      },
    ],
  },
  juridica: {
    id: "juridica",
    title: "Carreiras Jurídicas & Delegado (Magistratura, MP, DPU e PC)",
    shortDescription: "Direito aprofundado: Constitucional, Administrativo, Civil, Penal e Processos.",
    icon: "⚖️",
    badge: "Carreira de Estado 📜",
    category: "juridica",
    materias: [
      {
        name: "Direito Constitucional Aprofundado",
        color: "#8B5CF6",
        weight: 9.0,
        topics: [
          { name: "Teoria da Constituição e Controle de Constitucionalidade (ADI, ADC, ADO, ADPF)" },
          { name: "Direitos Fundamentais e Jurisprudência dos Tribunais Superiores (STF/STJ)" },
          { name: "Organização do Estado e Repartição de Competências" },
          { name: "Poder Judiciário, Funções Essenciais e CNJ" },
        ],
      },
      {
        name: "Direito Administrativo Avançado",
        color: "#EC4899",
        weight: 8.5,
        topics: [
          { name: "Regime Jurídico-Administrativo e Princípios Implícitos" },
          { name: "Intervenção do Estado na Propriedade e no Domínio Econômico" },
          { name: "Improbidade Administrativa (Lei 8.429/92 com alterações da Lei 14.230/21)" },
          { name: "Serviços Públicos, Concessões e Parcerias Público-Privadas (PPP)" },
        ],
      },
      {
        name: "Direito Penal & Criminologia",
        color: "#EF4444",
        weight: 9.0,
        topics: [
          { name: "Teoria da Norma Penal e Princípios Constitucionais Penais" },
          { name: "Teoria do Crime: Tipicidade, Antijuridicidade e Culpabilidade" },
          { name: "Penas: Aplicação, Concurso de Crimes e Extinção da Punibilidade" },
          { name: "Legislação Penal Especial (Drogas, Organizações Criminosas, Armas e Maria da Penha)" },
        ],
      },
      {
        name: "Direito Processual Penal",
        color: "#F59E0B",
        weight: 8.5,
        topics: [
          { name: "Sistemas Processuais e Princípios do Processo Penal" },
          { name: "Inquérito Policial e Ação Penal" },
          { name: "Teoria Geral da Prova Penal e Cadeia de Custódia" },
          { name: "Prisões Cautelares, Liberdade Provisória e Medidas Diversas da Prisão" },
          { name: "Recursos em Processo Penal e Ações Autônomas de Impugnação (HC e Revisão)" },
        ],
      },
      {
        name: "Direito Civil & Processo Civil",
        color: "#3B82F6",
        weight: 8.0,
        topics: [
          { name: "Parte Geral do Código Civil: Pessoas, Bens e Fatos Jurídicos" },
          { name: "Direito das Obrigações, Contratos e Responsabilidade Civil" },
          { name: "Normas Fundamentais do CPC e Competência" },
          { name: "Tutelas Provisórias (Urgência e Evidência) e Procedimento Comum" },
          { name: "Teoria dos Precedentes Judiciais e Recursos Cíveis" },
        ],
      },
      {
        name: "Direito Tributário & Financeiro",
        color: "#10B981",
        weight: 7.5,
        topics: [
          { name: "Sistema Tributário Nacional e Limitações Constitucionais" },
          { name: "Crédito Tributário e Execução Fiscal" },
          { name: "Direito Financeiro: Despesas, Receitas e Lei de Responsabilidade Fiscal" },
        ],
      },
    ],
  },
  bancario: {
    id: "bancario",
    title: "Carreiras Bancárias & Financeiras (Caixa, BB e BACEN)",
    shortDescription: "Com foco em conhecimentos bancários, mercado financeiro e vendas.",
    icon: "💼",
    badge: "Alta Procura",
    category: "administrativo",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 7.5,
        topics: [
          { name: "Interpretação e Compreensão de Textos" },
          { name: "Norma Culta e Redação Oficial" },
          { name: "Sintaxe, Concordância e Regência" },
        ],
      },
      {
        name: "Conhecimentos Bancários & Mercado",
        color: "#10B981",
        weight: 9.0,
        topics: [
          { name: "Sistema Financeiro Nacional (CMN, Banco Central e CVM)" },
          { name: "Produtos e Serviços Bancários (Contas, Depósitos e Empréstimos)" },
          { name: "Mercado Financeiro, Moeda e Inflação" },
          { name: "Prevenção à Lavagem de Dinheiro (PLD/FT)" },
          { name: "Segurança Digital e Open Finance" },
        ],
      },
      {
        name: "Matemática Financeira & Raciocínio Lógico",
        color: "#F59E0B",
        weight: 8.0,
        topics: [
          { name: "Juros Simples e Compostos" },
          { name: "Taxas Equivalentes e Nominais" },
          { name: "Sistemas de Amortização (SAC e Price)" },
          { name: "Lógica Proposicional e Negações" },
        ],
      },
      {
        name: "Atendimento, Vendas & Ética",
        color: "#EC4899",
        weight: 7.5,
        topics: [
          { name: "Técnicas de Vendas e Negociação no Setor Bancário" },
          { name: "Código de Defesa do Consumidor Aplicado a Bancos" },
          { name: "Ética e Sigilo Bancário (Lei Complementar 105/01)" },
        ],
      },
      {
        name: "Tecnologia da Informação & Inovação",
        color: "#8B5CF6",
        weight: 7.0,
        topics: [
          { name: "Ferramentas Digitais e Cultura de Dados" },
          { name: "Privacidade e Proteção de Dados (LGPD)" },
          { name: "Segurança da Informação e Golpes Bancários" },
        ],
      },
    ],
  },
  saude: {
    id: "saude",
    title: "Carreiras da Saúde & SUS (Enfermagem, Farmácia, Médicos e EBSERH)",
    shortDescription: "Legislação e políticas do SUS, vigilância epidemiológica e ética em saúde.",
    icon: "🩺",
    badge: "Saúde Pública 🏥",
    category: "saude_educacao",
    materias: [
      {
        name: "Legislação do SUS (Sistema Único de Saúde)",
        color: "#10B981",
        weight: 9.5,
        topics: [
          { name: "Evolução Histórica da Saúde Pública no Brasil" },
          { name: "Princípios e Diretrizes do SUS na CF/88 (Art. 196 a 200)" },
          { name: "Lei Orgânica da Saúde (Lei 8.080/90)" },
          { name: "Participação Popular e Transferências Financeiras (Lei 8.142/90)" },
          { name: "Decreto Presidencial 7.508/11: Regiões de Saúde e Redes de Atenção" },
        ],
      },
      {
        name: "Políticas Públicas de Saúde & Vigilância",
        color: "#3B82F6",
        weight: 8.5,
        topics: [
          { name: "Atenção Primária à Saúde e Estratégia Saúde da Família (ESF)" },
          { name: "Vigilância em Saúde: Epidemiológica, Sanitária e Ambiental" },
          { name: "Doenças de Notificação Compulsória e Imunizações (PNI)" },
          { name: "Humanização no SUS (HumanizaSUS) e Bioética em Saúde" },
        ],
      },
      {
        name: "Língua Portuguesa",
        color: "#6366F1",
        weight: 7.5,
        topics: [
          { name: "Compreensão e Interpretação de Textos" },
          { name: "Ortografia, Gramática e Sintaxe da Oração" },
          { name: "Coesão Textual e Concordância" },
        ],
      },
      {
        name: "Raciocínio Lógico & Bioestatística",
        color: "#F59E0B",
        weight: 7.0,
        topics: [
          { name: "Lógica Proposicional e Argumentação" },
          { name: "Indicadores de Saúde: Mortalidade, Morbidade e Letalidade" },
          { name: "Noções de Estatística Aplicada a Estudos Epidemiológicos" },
        ],
      },
      {
        name: "Noções de Legislação e Administração Pública",
        color: "#8B5CF6",
        weight: 6.5,
        topics: [
          { name: "Princípios Constitucionais da Administração Pública" },
          { name: "Regime Jurídico dos Servidores Públicos" },
          { name: "Legislação Específica da EBSERH ou Órgão Convocante" },
        ],
      },
    ],
  },
  educacao: {
    id: "educacao",
    title: "Carreiras da Educação & Magistério (Professores, Pedagogia e IFs)",
    shortDescription: "Legislação educacional (LDB), teorias pedagógicas, didática e inclusão.",
    icon: "🎓",
    badge: "Magistério 📖",
    category: "saude_educacao",
    materias: [
      {
        name: "Legislação Educacional & LDB",
        color: "#3B82F6",
        weight: 9.5,
        topics: [
          { name: "A Educação na CF/88 (Art. 205 a 214)" },
          { name: "Lei de Diretrizes e Bases da Educação Nacional (LDB - Lei 9.394/96)" },
          { name: "Estatuto da Criança e do Adolescente (ECA - Lei 8.069/90) no Contexto Escolar" },
          { name: "Plano Nacional de Educação (PNE) e Diretrizes Curriculares Nacionais" },
          { name: "Base Nacional Comum Curricular (BNCC): Competências e Estrutura" },
        ],
      },
      {
        name: "Fundamentos da Educação & Didática",
        color: "#EC4899",
        weight: 9.0,
        topics: [
          { name: "Teorias da Aprendizagem e do Desenvolvimento (Piaget, Vygotsky, Wallon e Paulo Freire)" },
          { name: "Planejamento de Ensino: Objetivos, Conteúdos e Metodologias Ativas" },
          { name: "Avaliação Escolar: Formativa, Diagnóstica e Somativa" },
          { name: "Projeto Político-Pedagógico (PPP) e Gestão Democrática" },
        ],
      },
      {
        name: "Educação Inclusiva & Diversidade",
        color: "#10B981",
        weight: 8.5,
        topics: [
          { name: "Estatuto da Pessoa com Deficiência (Lei 13.146/15)" },
          { name: "Atendimento Educacional Especializado (AEE) e Acessibilidade" },
          { name: "Educação das Relações Étnico-Raciais (Lei 10.639/03)" },
        ],
      },
      {
        name: "Língua Portuguesa",
        color: "#6366F1",
        weight: 7.5,
        topics: [
          { name: "Interpretação e Análise Textual" },
          { name: "Morfossintaxe, Regência e Concordância Verbal/Nominal" },
          { name: "Coesão Textual e Produção Escrita" },
        ],
      },
      {
        name: "Tecnologia na Educação & Metodologias Ativas",
        color: "#8B5CF6",
        weight: 7.0,
        topics: [
          { name: "Recursos Tecnológicos e Ambientes Virtuais de Aprendizagem (AVA)" },
          { name: "Metodologias Ativas e Sala de Aula Invertida" },
          { name: "Cultura Digital e Letramento Midiático" },
        ],
      },
    ],
  },
  comum: {
    id: "comum",
    title: "Tronco Comum de Concursos (Geral)",
    shortDescription: "As 5 matérias que caem em praticamente 90% dos concursos públicos.",
    icon: "📚",
    badge: "Essencial",
    category: "geral",
    materias: [
      {
        name: "Língua Portuguesa",
        color: "#3B82F6",
        weight: 8.0,
        topics: [
          { name: "Interpretação e Compreensão Textual" },
          { name: "Ortografia, Acentuação e Morfologia" },
          { name: "Sintaxe da Oração, Concordância e Regência" },
          { name: "Crase e Pontuação" },
        ],
      },
      {
        name: "Direito Constitucional",
        color: "#8B5CF6",
        weight: 7.5,
        topics: [
          { name: "Direitos e Garantias Fundamentais (Art. 5º)" },
          { name: "Nacionalidade e Direitos Políticos" },
          { name: "Princípios da Administração Pública na CF/88" },
        ],
      },
      {
        name: "Direito Administrativo",
        color: "#EC4899",
        weight: 7.5,
        topics: [
          { name: "Princípios da Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência" },
          { name: "Poderes da Administração e Poder de Polícia" },
          { name: "Atos Administrativos e Agentes Públicos" },
        ],
      },
      {
        name: "Raciocínio Lógico & Matemática",
        color: "#F59E0B",
        weight: 6.5,
        topics: [
          { name: "Conectivos Lógicos e Tabelas-Verdade" },
          { name: "Equivalências e Negações" },
          { name: "Razão, Proporção e Porcentagem" },
        ],
      },
      {
        name: "Informática Básica",
        color: "#10B981",
        weight: 6.0,
        topics: [
          { name: "Conceitos de Internet, Navegadores e E-mail" },
          { name: "Segurança na Internet e Vírus/Malware" },
          { name: "Manipulação de Arquivos e Pastas no Windows" },
        ],
      },
    ],
  },
};
