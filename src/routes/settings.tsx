import { createFileRoute } from "@tanstack/react-router";
import { useState, type ChangeEvent } from "react";
import { DEFAULT_PARAMS, type EngineParams } from "@/lib/calculator";
import { resetParams, saveParams, useParams } from "@/lib/store";
import { PCT } from "@/lib/format";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Configurações — QualifiMob" },
      {
        name: "description",
        content:
          "Política de crédito: comprometimento, LTV, prazo, taxa, sistema de amortização.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [persisted] = useParams();
  const [draft, setDraft] = useState<EngineParams>(persisted);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof EngineParams>(k: K, v: EngineParams[K]) {
    setSaved(false);
    setDraft((p) => ({ ...p, [k]: v }));
  }

  function num(e: ChangeEvent<HTMLInputElement>) {
    return Number(e.target.value);
  }

  function handleSave() {
    saveParams(draft);
    setSaved(true);
  }

  function handleReset() {
    resetParams();
    setDraft(DEFAULT_PARAMS);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Política de crédito</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Esses parâmetros definem o cálculo da pré-qualificação. Ajuste para
          refletir a política do banco com que você trabalha — todas as simulações
          passam a usar os novos valores.
        </p>
      </div>

      <div className="space-y-6">
        <Group title="Renda e comprometimento">
          <PctField
            label="Comprometimento máximo da renda"
            value={draft.maxCommitment}
            onChange={(v) => update("maxCommitment", v)}
            hint="Parcela máxima ÷ renda considerada."
          />
          <PctField
            label="Peso da renda informal"
            value={draft.informalIncomeWeight}
            onChange={(v) => update("informalIncomeWeight", v)}
            hint="Quanto da renda informal entra no cálculo."
          />
        </Group>

        <Group title="Prazo e idade">
          <NumField
            label="Prazo máximo (meses)"
            value={draft.maxTermMonths}
            onChange={(e) => update("maxTermMonths", num(e))}
            step={12}
          />
          <NumField
            label="Idade-limite ao fim do contrato"
            value={draft.maxAgeAtEnd}
            onChange={(e) => update("maxAgeAtEnd", num(e))}
            step={0.5}
          />
        </Group>

        <Group title="LTV e enquadramento">
          <PctField
            label="LTV máximo (SFH)"
            value={draft.maxLtvSfh}
            onChange={(v) => update("maxLtvSfh", v)}
          />
          <PctField
            label="LTV máximo (SFI)"
            value={draft.maxLtvSfi}
            onChange={(v) => update("maxLtvSfi", v)}
          />
          <NumField
            label="Teto do imóvel no SFH (R$)"
            value={draft.sfhCap}
            onChange={(e) => update("sfhCap", num(e))}
            step={10000}
          />
        </Group>

        <Group title="Taxa e amortização">
          <PctField
            label="Taxa de juros anual"
            value={draft.annualRate}
            onChange={(v) => update("annualRate", v)}
            step={0.001}
            hint="Taxa nominal anual usada na simulação."
          />
          <div>
            <label className="block">
              <span className="ml-1 text-xs font-medium uppercase text-muted-foreground">
                Sistema de amortização
              </span>
              <select
                value={draft.amortization}
                onChange={(e) =>
                  update("amortization", e.target.value as EngineParams["amortization"])
                }
                className="mt-1 block w-full rounded-lg border-0 bg-surface px-4 py-2.5 text-sm font-medium text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="SAC">SAC (parcela decrescente)</option>
                <option value="PRICE">Price (parcela fixa)</option>
              </select>
            </label>
          </div>
        </Group>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-xs font-medium text-brand-primary">
              Configurações atualizadas.
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md bg-card px-4 py-2 text-sm font-medium ring-1 ring-border transition-colors hover:bg-surface"
          >
            Restaurar padrão
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Salvar política
          </button>
        </div>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-card p-6 ring-1 ring-border">
      <h3 className="mb-5 text-sm font-semibold">{title}</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function NumField({
  label,
  ...rest
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="ml-1 text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <input
        type="number"
        {...rest}
        className="mt-1 block w-full rounded-lg border-0 bg-surface px-4 py-2.5 text-sm font-medium tabular-nums text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-brand-primary"
      />
    </label>
  );
}

function PctField({
  label,
  value,
  onChange,
  hint,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="ml-1 text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <div className="relative mt-1">
        <input
          type="number"
          step={step}
          min={0}
          max={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="block w-full rounded-lg border-0 bg-surface px-4 py-2.5 pr-20 text-sm font-medium tabular-nums text-foreground ring-1 ring-border outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <span className="pointer-events-none absolute right-3 top-2.5 text-xs text-muted-foreground">
          {PCT.format(value)}
        </span>
      </div>
      {hint && <p className="mt-1 ml-1 text-xs text-muted-foreground">{hint}</p>}
    </label>
  );
}
