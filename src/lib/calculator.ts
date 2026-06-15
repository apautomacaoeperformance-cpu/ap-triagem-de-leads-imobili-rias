// Motor de pré-qualificação — puro, sem dependências externas.
// Todos os parâmetros são configuráveis. Resultado auditável.

export interface EngineParams {
  /** % máximo de comprometimento da renda (ex.: 0.30 = 30%) */
  maxCommitment: number;
  /** Peso da renda informal (ex.: 0.5 = 50%) */
  informalIncomeWeight: number;
  /** Prazo máximo do financiamento, em meses */
  maxTermMonths: number;
  /** Idade-limite ao fim do contrato (ex.: 80.5) */
  maxAgeAtEnd: number;
  /** LTV máximo no SFH (ex.: 0.80) */
  maxLtvSfh: number;
  /** LTV máximo no SFI (ex.: 0.70) */
  maxLtvSfi: number;
  /** Teto do imóvel para enquadrar no SFH (R$) */
  sfhCap: number;
  /** Taxa de juros nominal anual (ex.: 0.105 = 10,5%) */
  annualRate: number;
  /** Sistema de amortização */
  amortization: "SAC" | "PRICE";
}

export const DEFAULT_PARAMS: EngineParams = {
  maxCommitment: 0.3,
  informalIncomeWeight: 0.5,
  maxTermMonths: 420,
  maxAgeAtEnd: 80.5,
  maxLtvSfh: 0.8,
  maxLtvSfi: 0.7,
  sfhCap: 1_500_000,
  annualRate: 0.105,
  amortization: "SAC",
};

export interface CalcInput {
  /** Idade do proponente mais velho (anos, pode ter decimal). */
  oldestAge: number;
  /** Renda mensal comprovada (R$) — total do grupo (titular + co). */
  formalIncome: number;
  /** Renda mensal informal (R$). */
  informalIncome: number;
  /** Soma das parcelas de dívidas atuais (R$/mês). */
  currentDebts: number;
  /** Recursos próprios para entrada (R$). */
  downPayment: number;
  /** Saldo de FGTS elegível (R$). */
  fgts: number;
  /** Valor do imóvel desejado (R$). 0 = não informado. */
  targetPropertyValue: number;
  /** Restrição declarada (Serasa/SPC). */
  hasRestriction: boolean;
}

export type Tier = "APTO" | "RESSALVA" | "INAPTO";
export type Framework = "SFH" | "SFI";

export interface CalcResult {
  consideredIncome: number;
  maxInstallment: number;
  effectiveTermMonths: number;
  monthlyRate: number;
  maxFinancing: number;
  totalResources: number;
  maxPropertyValue: number;
  framework: Framework;
  ltvUsed: number;
  // Para o alvo, se informado
  targetEntryNeeded: number | null;
  targetCommitment: number | null;
  targetLtv: number | null;
  // Indicadores
  currentCommitment: number;
  postCommitment: number; // usando o maxInstallment
  entryCoverage: number | null; // entrada disponível / entrada necessária no alvo
  termSlack: number; // prazo efetivo / prazo máximo
  // Pré-qualificação
  tier: Tier;
  alerts: string[];
  actions: ActionItem[];
}

export interface ActionItem {
  title: string;
  detail: string;
  horizon: "Curto" | "Médio" | "Longo";
  severity: "info" | "warn" | "danger";
}

/**
 * Valor presente de uma série SAC dado primeira parcela máxima P1 = R + i*PV,
 * onde R = PV/n. Resolvendo para PV: PV = P1 / (1/n + i).
 */
function pvSAC(firstInstallment: number, monthlyRate: number, n: number): number {
  if (n <= 0) return 0;
  const denom = 1 / n + monthlyRate;
  if (denom <= 0) return 0;
  return firstInstallment / denom;
}

/** Valor presente Price: PV = PMT * (1 - (1+i)^-n) / i */
function pvPrice(installment: number, monthlyRate: number, n: number): number {
  if (n <= 0) return 0;
  if (monthlyRate === 0) return installment * n;
  return (installment * (1 - Math.pow(1 + monthlyRate, -n))) / monthlyRate;
}

export function calculate(input: CalcInput, params: EngineParams): CalcResult {
  const consideredIncome =
    Math.max(0, input.formalIncome) +
    Math.max(0, input.informalIncome) * params.informalIncomeWeight;

  const grossMargin = consideredIncome * params.maxCommitment;
  const maxInstallment = Math.max(0, grossMargin - Math.max(0, input.currentDebts));

  const ageRoom = Math.max(0, params.maxAgeAtEnd - Math.max(0, input.oldestAge));
  const effectiveTermMonths = Math.max(
    0,
    Math.min(params.maxTermMonths, Math.floor(ageRoom * 12)),
  );

  const monthlyRate = Math.pow(1 + params.annualRate, 1 / 12) - 1;

  const maxFinancing =
    params.amortization === "SAC"
      ? pvSAC(maxInstallment, monthlyRate, effectiveTermMonths)
      : pvPrice(maxInstallment, monthlyRate, effectiveTermMonths);

  const totalResources = Math.max(0, input.downPayment) + Math.max(0, input.fgts);

  // Imóvel máximo: limitado pelo LTV (assumindo SFH primeiro) e pela soma fin + recursos.
  // Tenta SFH; se ultrapassar o teto, usa SFI.
  const byLtvSfh = maxFinancing / params.maxLtvSfh;
  const byResources = maxFinancing + totalResources;
  let framework: Framework = "SFH";
  let ltvUsed = params.maxLtvSfh;
  let maxPropertyValue = Math.min(byLtvSfh, byResources);
  if (maxPropertyValue > params.sfhCap) {
    framework = "SFI";
    ltvUsed = params.maxLtvSfi;
    const byLtvSfi = maxFinancing / params.maxLtvSfi;
    maxPropertyValue = Math.min(byLtvSfi, byResources);
  }

  // Alvo
  const hasTarget = input.targetPropertyValue > 0;
  const targetEntryNeeded = hasTarget
    ? Math.max(0, input.targetPropertyValue - maxFinancing)
    : null;
  const targetLtv = hasTarget
    ? Math.min(1, maxFinancing / input.targetPropertyValue)
    : null;
  const targetCommitment =
    hasTarget && consideredIncome > 0
      ? (maxInstallment + Math.max(0, input.currentDebts)) / consideredIncome
      : null;

  const currentCommitment =
    consideredIncome > 0 ? Math.max(0, input.currentDebts) / consideredIncome : 0;
  const postCommitment =
    consideredIncome > 0
      ? (maxInstallment + Math.max(0, input.currentDebts)) / consideredIncome
      : 0;

  const entryCoverage =
    hasTarget && targetEntryNeeded && targetEntryNeeded > 0
      ? totalResources / targetEntryNeeded
      : hasTarget
        ? 1
        : null;

  const termSlack =
    params.maxTermMonths > 0 ? effectiveTermMonths / params.maxTermMonths : 0;

  // Alertas e plano de ação
  const alerts: string[] = [];
  const actions: ActionItem[] = [];

  if (input.hasRestriction) {
    alerts.push("Restrição ativa declarada (Serasa/SPC)");
    actions.push({
      title: "Regularizar restrição",
      detail: "Quitar/negociar pendências antes de dar entrada no banco.",
      horizon: "Curto",
      severity: "danger",
    });
  }
  if (currentCommitment > 0.25) {
    alerts.push("Comprometimento atual elevado");
    actions.push({
      title: "Reduzir passivos",
      detail: "Renegociar ou quitar dívidas para liberar margem de parcela.",
      horizon: "Curto",
      severity: "warn",
    });
  }
  if (input.informalIncome > 0 && params.informalIncomeWeight < 1) {
    actions.push({
      title: "Formalizar renda informal",
      detail:
        "Comprovar a renda complementar via extratos, DECORE ou IRPF para aumentar o valor considerado.",
      horizon: "Médio",
      severity: "warn",
    });
  }
  if (hasTarget && entryCoverage !== null && entryCoverage < 1) {
    alerts.push("Entrada insuficiente para o imóvel-alvo");
    actions.push({
      title: "Compor entrada",
      detail: "Somar poupança + FGTS + consórcio ou ajustar para um imóvel menor.",
      horizon: "Médio",
      severity: "warn",
    });
  }
  if (termSlack < 0.5) {
    alerts.push("Prazo curto pela idade");
    actions.push({
      title: "Incluir co-proponente mais novo",
      detail: "A composição de renda com pessoa mais nova amplia o prazo possível.",
      horizon: "Curto",
      severity: "warn",
    });
  }
  if (hasTarget && targetLtv !== null && targetLtv > params.maxLtvSfh) {
    actions.push({
      title: "Ajustar valor do imóvel",
      detail: "O financiamento estimado não cobre a parcela do alvo dentro do LTV permitido.",
      horizon: "Curto",
      severity: "danger",
    });
  }
  if (postCommitment > params.maxCommitment + 0.05) {
    alerts.push("Comprometimento pós-financiamento acima do limite");
  }

  // Faixa final
  let tier: Tier = "APTO";
  const hardFail =
    input.hasRestriction ||
    maxFinancing <= 0 ||
    (hasTarget && targetLtv !== null && targetLtv > 0.95) ||
    (hasTarget && entryCoverage !== null && entryCoverage < 0.7) ||
    postCommitment > params.maxCommitment + 0.05;

  const softIssues =
    alerts.length > 0 ||
    (hasTarget && entryCoverage !== null && entryCoverage < 1) ||
    (input.informalIncome > 0 && params.informalIncomeWeight < 1);

  if (hardFail) tier = "INAPTO";
  else if (softIssues) tier = "RESSALVA";

  return {
    consideredIncome,
    maxInstallment,
    effectiveTermMonths,
    monthlyRate,
    maxFinancing,
    totalResources,
    maxPropertyValue,
    framework,
    ltvUsed,
    targetEntryNeeded,
    targetCommitment,
    targetLtv,
    currentCommitment,
    postCommitment,
    entryCoverage,
    termSlack,
    tier,
    alerts,
    actions,
  };
}

export function tierLabel(t: Tier): string {
  return t === "APTO" ? "Apto" : t === "RESSALVA" ? "Apto com ressalvas" : "Ainda não apto";
}
