import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { calculate } from "@/lib/calculator";
import { deleteLead, getLead, useParams, type Lead } from "@/lib/store";
import { ResultPanel } from "@/components/result-panel";
import { BRL } from "@/lib/format";

export const Route = createFileRoute("/leads/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Lead — QualifiMob" },
      { name: "description", content: "Detalhe da pré-qualificação do lead." },
    ],
  }),
  component: LeadDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-2xl font-semibold">Lead não encontrado</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Este lead pode ter sido removido ou ainda não foi salvo neste navegador.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Voltar ao dashboard
      </Link>
    </div>
  ),
});

function LeadDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [params] = useParams();
  // useState para forçar re-render se nada mudar
  const [lead, setLead] = useState<Lead | undefined>(() => getLead(id));

  useEffect(() => {
    setLead(getLead(id));
  }, [id]);

  const result = useMemo(
    () => (lead ? calculate(lead.input, params) : null),
    [lead, params],
  );

  if (!lead || !result) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-2xl font-semibold">Lead não encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Este lead pode ter sido removido ou ainda não foi salvo neste navegador.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  function handleDelete() {
    if (!confirm("Excluir este lead?")) return;
    deleteLead(id);
    navigate({ to: "/" });
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            to="/"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{lead.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.city ? `${lead.city} · ` : ""}
            {lead.job ? `${lead.job} · ` : ""}
            {lead.bond} · CPF {lead.cpf || "—"} · {lead.phone || "—"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-card px-4 py-2 text-sm font-medium ring-1 ring-border transition-colors hover:bg-surface"
          >
            Imprimir / PDF
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md bg-card px-4 py-2 text-sm font-medium text-brand-danger ring-1 ring-border transition-colors hover:bg-surface"
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="space-y-4 rounded-xl bg-surface/60 p-6 ring-1 ring-border">
            <h4 className="text-sm font-semibold">Dados utilizados</h4>
            <DL label="Renda comprovada" value={BRL.format(lead.input.formalIncome)} />
            <DL label="Renda informal" value={BRL.format(lead.input.informalIncome)} />
            <DL label="Dívidas atuais" value={BRL.format(lead.input.currentDebts)} />
            <DL label="Entrada" value={BRL.format(lead.input.downPayment)} />
            <DL label="FGTS" value={BRL.format(lead.input.fgts)} />
            <DL
              label="Imóvel desejado"
              value={
                lead.input.targetPropertyValue > 0
                  ? BRL.format(lead.input.targetPropertyValue)
                  : "—"
              }
            />
            <DL label="Idade (mais velho)" value={`${lead.input.oldestAge} anos`} />
            <DL
              label="Restrição declarada"
              value={lead.input.hasRestriction ? "Sim" : "Não"}
            />
          </div>
        </aside>
        <section className="lg:col-span-8">
          <ResultPanel result={result} maxCommitment={params.maxCommitment} />
        </section>
      </div>
    </div>
  );
}

function DL({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2 last:border-b-0 last:pb-0">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}
