import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ChangeEvent } from "react";
import { calculate, type CalcInput } from "@/lib/calculator";
import { newId, saveLead, useParams } from "@/lib/store";
import { ResultPanel } from "@/components/result-panel";
import { parseBRNumber } from "@/lib/format";

export const Route = createFileRoute("/leads/new")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova triagem — QualifiMob" },
      {
        name: "description",
        content:
          "Calcule em tempo real a parcela máxima, financiamento e imóvel-alvo do comprador.",
      },
    ],
  }),
  component: NewLeadPage,
});

interface FormState {
  // identificação
  name: string;
  cpf: string;
  phone: string;
  city: string;
  job: string;
  bond: string;
  maritalStatus: string;
  // financeiro
  oldestAge: string;
  formalIncome: string;
  informalIncome: string;
  currentDebts: string;
  downPayment: string;
  fgts: string;
  targetPropertyValue: string;
  hasRestriction: boolean;
}

const INITIAL: FormState = {
  name: "",
  cpf: "",
  phone: "",
  city: "",
  job: "",
  bond: "CLT",
  maritalStatus: "Solteiro(a)",
  oldestAge: "38",
  formalIncome: "12500",
  informalIncome: "0",
  currentDebts: "0",
  downPayment: "140000",
  fgts: "45000",
  targetPropertyValue: "0",
  hasRestriction: false,
};

function toInput(f: FormState): CalcInput {
  return {
    oldestAge: parseBRNumber(f.oldestAge),
    formalIncome: parseBRNumber(f.formalIncome),
    informalIncome: parseBRNumber(f.informalIncome),
    currentDebts: parseBRNumber(f.currentDebts),
    downPayment: parseBRNumber(f.downPayment),
    fgts: parseBRNumber(f.fgts),
    targetPropertyValue: parseBRNumber(f.targetPropertyValue),
    hasRestriction: f.hasRestriction,
  };
}

function NewLeadPage() {
  const navigate = useNavigate();
  const [params] = useParams();
  const [f, setF] = useState<FormState>(INITIAL);

  const result = useMemo(() => calculate(toInput(f), params), [f, params]);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setF((p) => ({ ...p, [k]: v }));
  }
  function onText(k: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set(k, e.target.value as FormState[typeof k]);
  }

  function handleSave() {
    const id = newId();
    const now = new Date().toISOString();
    saveLead({
      id,
      createdAt: now,
      updatedAt: now,
      name: f.name || "Lead sem nome",
      cpf: f.cpf,
      phone: f.phone,
      city: f.city,
      job: f.job,
      bond: f.bond,
      input: toInput(f),
      tier: result.tier,
      maxFinancing: result.maxFinancing,
      maxPropertyValue: result.maxPropertyValue,
      maxInstallment: result.maxInstallment,
      framework: result.framework,
    });
    navigate({ to: "/leads/$id", params: { id } });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Nova triagem</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Preencha os dados financeiros do comprador. O resultado atualiza em tempo
          real conforme a política de crédito configurada.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Form */}
        <section className="space-y-8 lg:col-span-5">
          <Card title="Identificação do comprador">
            <Field label="Nome do proponente" full>
              <Input value={f.name} onChange={onText("name")} placeholder="Nome completo" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CPF">
                <Input value={f.cpf} onChange={onText("cpf")} placeholder="000.000.000-00" />
              </Field>
              <Field label="Telefone">
                <Input
                  value={f.phone}
                  onChange={onText("phone")}
                  placeholder="(11) 9 9999-9999"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cidade/UF">
                <Input value={f.city} onChange={onText("city")} placeholder="São Paulo/SP" />
              </Field>
              <Field label="Profissão">
                <Input value={f.job} onChange={onText("job")} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vínculo">
                <Select value={f.bond} onChange={onText("bond")}>
                  <option>CLT</option>
                  <option>Autônomo</option>
                  <option>Empresário</option>
                  <option>Servidor público</option>
                  <option>Aposentado</option>
                </Select>
              </Field>
              <Field label="Estado civil">
                <Select value={f.maritalStatus} onChange={onText("maritalStatus")}>
                  <option>Solteiro(a)</option>
                  <option>Casado (composição)</option>
                  <option>União estável</option>
                  <option>Divorciado(a)</option>
                </Select>
              </Field>
            </div>
            <Field label="Idade do proponente mais velho">
              <Input
                type="number"
                value={f.oldestAge}
                onChange={onText("oldestAge")}
                placeholder="38"
              />
            </Field>
          </Card>

          <Card title="Composição financeira" subtle>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Renda comprovada">
                <MoneyInput
                  value={f.formalIncome}
                  onChange={(v) => set("formalIncome", v)}
                />
              </Field>
              <Field label="Renda informal">
                <MoneyInput
                  value={f.informalIncome}
                  onChange={(v) => set("informalIncome", v)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Dívidas/parcelas atuais (mês)">
                <MoneyInput
                  value={f.currentDebts}
                  onChange={(v) => set("currentDebts", v)}
                />
              </Field>
              <Field label="Entrada disponível">
                <MoneyInput
                  value={f.downPayment}
                  onChange={(v) => set("downPayment", v)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="FGTS elegível">
                <MoneyInput value={f.fgts} onChange={(v) => set("fgts", v)} />
              </Field>
              <Field label="Valor do imóvel desejado (opcional)">
                <MoneyInput
                  value={f.targetPropertyValue}
                  onChange={(v) => set("targetPropertyValue", v)}
                />
              </Field>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={f.hasRestriction}
                onChange={(e) => set("hasRestriction", e.target.checked)}
                className="size-4 rounded border-border accent-brand-primary"
              />
              Cliente possui restrição declarada (Serasa/SPC)
            </label>
          </Card>
        </section>

        {/* Result */}
        <section className="lg:col-span-7 lg:sticky lg:top-24">
          <ResultPanel
            result={result}
            maxCommitment={params.maxCommitment}
            footer={
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setF(INITIAL)}
                  className="rounded-md bg-card px-4 py-2 text-sm font-medium ring-1 ring-border transition-colors hover:bg-surface"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  Salvar lead
                </button>
              </div>
            }
          />
        </section>
      </div>
    </div>
  );
}

/* ---------------- form primitives ---------------- */

function Card({
  title,
  children,
  subtle,
}: {
  title: string;
  children: React.ReactNode;
  subtle?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-6 ring-1 ring-border ${
        subtle ? "bg-surface/60" : "bg-card"
      }`}
    >
      <h4 className="mb-5 text-sm font-semibold">{title}</h4>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "col-span-2" : ""}`}>
      <span className="ml-1 text-xs font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="block w-full rounded-lg border-0 bg-surface px-4 py-2.5 text-sm font-medium text-foreground ring-1 ring-border outline-none transition-shadow focus:ring-2 focus:ring-brand-primary"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="block w-full rounded-lg border-0 bg-surface px-4 py-2.5 text-sm font-medium text-foreground ring-1 ring-border outline-none transition-shadow focus:ring-2 focus:ring-brand-primary"
    />
  );
}

function MoneyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-2.5 text-xs text-muted-foreground">
        R$
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        className="block w-full rounded-lg border-0 bg-card py-2 pl-9 pr-4 text-sm font-medium tabular-nums text-foreground ring-1 ring-border outline-none transition-shadow focus:ring-2 focus:ring-brand-primary"
      />
    </div>
  );
}
