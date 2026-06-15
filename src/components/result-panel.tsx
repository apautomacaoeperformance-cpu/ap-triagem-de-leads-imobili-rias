import { type CalcResult, tierLabel, type Tier } from "@/lib/calculator";
import { BRL, PCT } from "@/lib/format";

function tierBadgeClasses(t: Tier) {
  if (t === "APTO")
    return "bg-brand-primary-soft text-brand-primary border-brand-primary/20";
  if (t === "RESSALVA")
    return "bg-brand-warning-soft text-brand-warning border-brand-warning/20";
  return "bg-brand-danger-soft text-brand-danger border-brand-danger/20";
}

function dotColor(level: "ok" | "warn" | "bad") {
  return level === "ok"
    ? "bg-brand-primary"
    : level === "warn"
      ? "bg-brand-warning"
      : "bg-brand-danger";
}

function commitLevel(v: number, max: number): "ok" | "warn" | "bad" {
  if (v <= max) return "ok";
  if (v <= max + 0.05) return "warn";
  return "bad";
}

function ltvLevel(v: number | null): "ok" | "warn" | "bad" {
  if (v == null) return "ok";
  if (v <= 0.8) return "ok";
  if (v <= 0.9) return "warn";
  return "bad";
}

function coverageLevel(v: number | null): "ok" | "warn" | "bad" {
  if (v == null) return "ok";
  if (v >= 1) return "ok";
  if (v >= 0.7) return "warn";
  return "bad";
}

export interface ResultPanelProps {
  result: CalcResult;
  maxCommitment: number;
  /** ações no rodapé (Salvar / Voltar / etc.) */
  footer?: React.ReactNode;
}

export function ResultPanel({ result, maxCommitment, footer }: ResultPanelProps) {
  const r = result;
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
      <div className="p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tierBadgeClasses(
                r.tier,
              )}`}
            >
              {tierLabel(r.tier)}
            </span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Análise de capacidade
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Enquadramento
            </p>
            <p className="text-lg font-semibold">
              {r.framework} ·{" "}
              <span className="text-muted-foreground">
                {Math.round(r.effectiveTermMonths)} m
              </span>
            </p>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-12">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Parcela máxima</p>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">
              {BRL.format(r.maxInstallment)}
            </p>
            <p className="text-xs text-muted-foreground">
              {PCT.format(maxCommitment)} de comprometimento da renda
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Imóvel máximo</p>
            <p className="text-4xl font-semibold tracking-tight tabular-nums">
              {BRL.format(r.maxPropertyValue)}
            </p>
            <p className="text-xs text-muted-foreground">
              Financiamento até {BRL.format(r.maxFinancing)}
            </p>
          </div>
        </div>

        <div className="mb-10 space-y-4">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Indicadores de risco
          </span>
          <div className="grid grid-cols-3 gap-4">
            <Indicator
              label="Compromet."
              value={PCT.format(r.postCommitment)}
              level={commitLevel(r.postCommitment, maxCommitment)}
            />
            <Indicator
              label="LTV alvo"
              value={r.targetLtv != null ? PCT.format(r.targetLtv) : "—"}
              level={ltvLevel(r.targetLtv)}
            />
            <Indicator
              label="Cobertura entrada"
              value={r.entryCoverage != null ? `${r.entryCoverage.toFixed(2)}x` : "—"}
              level={coverageLevel(r.entryCoverage)}
            />
          </div>
        </div>

        {r.targetEntryNeeded != null && (
          <div className="mb-10 grid grid-cols-2 gap-12 border-t border-border pt-6">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Entrada necessária no alvo
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {BRL.format(r.targetEntryNeeded)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Recursos disponíveis
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {BRL.format(r.totalResources)}
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-border pt-8">
          <h4 className="mb-4 text-sm font-semibold">Plano de ação sugerido</h4>
          {r.actions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum ponto crítico identificado. Encaminhe ao banco para análise formal.
            </p>
          ) : (
            <ul className="space-y-3">
              {r.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div
                    className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full ${
                      a.severity === "danger"
                        ? "bg-brand-danger-soft text-brand-danger"
                        : a.severity === "warn"
                          ? "bg-brand-warning-soft text-brand-warning"
                          : "bg-brand-primary-soft text-brand-primary"
                    }`}
                  >
                    <div className="size-1.5 rounded-full bg-current" />
                  </div>
                  <p className="max-w-[60ch]">
                    <span className="font-medium text-foreground">{a.title}: </span>
                    {a.detail}{" "}
                    <span className="text-xs text-muted-foreground">
                      · horizonte {a.horizon.toLowerCase()}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 bg-surface px-6 py-4">
        <p className="max-w-[40ch] text-xs italic text-muted-foreground">
          Simulação baseada nos parâmetros configurados. Não constitui aprovação
          bancária.
        </p>
        {footer}
      </div>
    </div>
  );
}

function Indicator({
  label,
  value,
  level,
}: {
  label: string;
  value: string;
  level: "ok" | "warn" | "bad";
}) {
  return (
    <div className="rounded-lg bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium">{label}</span>
        <div className={`size-2 rounded-full ${dotColor(level)}`} />
      </div>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
