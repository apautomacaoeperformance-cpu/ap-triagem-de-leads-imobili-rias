import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useLeads } from "@/lib/store";
import { BRL } from "@/lib/format";
import { tierLabel, type Tier } from "@/lib/calculator";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — QualifiMob" },
      {
        name: "description",
        content:
          "Funil de leads por faixa de qualificação de crédito imobiliário: aptos, ressalvas, inaptos.",
      },
    ],
  }),
  component: Dashboard,
});

function tierClasses(t: Tier) {
  if (t === "APTO")
    return "bg-brand-primary-soft text-brand-primary border-brand-primary/20";
  if (t === "RESSALVA")
    return "bg-brand-warning-soft text-brand-warning border-brand-warning/20";
  return "bg-brand-danger-soft text-brand-danger border-brand-danger/20";
}

function Dashboard() {
  const leads = useLeads();

  const stats = useMemo(() => {
    const total = leads.length;
    const apt = leads.filter((l) => l.tier === "APTO").length;
    const ress = leads.filter((l) => l.tier === "RESSALVA").length;
    const inapt = leads.filter((l) => l.tier === "INAPTO").length;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return { total, apt, ress, inapt, aptPct: pct(apt), ressPct: pct(ress), inaptPct: pct(inapt) };
  }, [leads]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Acompanhe o funil de pré-qualificação e priorize compradores com
            capacidade real de financiamento.
          </p>
        </div>
        <Link
          to="/leads/new"
          className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2.5 text-sm font-medium text-background"
        >
          + Nova triagem
        </Link>
      </div>

      <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatCard label="Total do funil" value={`${stats.total} leads`} />
        <StatCard
          label="Aptos"
          value={String(stats.apt)}
          accent="brand-primary"
          hint={`${stats.aptPct}%`}
        />
        <StatCard
          label="Ressalvas"
          value={String(stats.ress)}
          accent="brand-warning"
          hint={`${stats.ressPct}%`}
        />
        <StatCard
          label="Não aptos"
          value={String(stats.inapt)}
          accent="brand-danger"
          hint={`${stats.inaptPct}%`}
        />
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Leads recentes</h2>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {leads.length} no total
          </span>
        </div>

        {leads.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Proponente</th>
                  <th className="px-5 py-3 font-medium">Enquadramento</th>
                  <th className="px-5 py-3 font-medium">Parcela máx.</th>
                  <th className="px-5 py-3 font-medium">Financiamento</th>
                  <th className="px-5 py-3 font-medium">Imóvel máx.</th>
                  <th className="px-5 py-3 font-medium">Faixa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-surface/60">
                    <td className="px-5 py-4">
                      <Link
                        to="/leads/$id"
                        params={{ id: l.id }}
                        className="block font-medium hover:underline"
                      >
                        {l.name || "Sem nome"}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {l.city ? `${l.city} · ` : ""}
                        {new Date(l.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{l.framework}</td>
                    <td className="px-5 py-4 font-medium tabular-nums">
                      {BRL.format(l.maxInstallment)}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {BRL.format(l.maxFinancing)}
                    </td>
                    <td className="px-5 py-4 tabular-nums">
                      {BRL.format(l.maxPropertyValue)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tierClasses(
                          l.tier,
                        )}`}
                      >
                        {tierLabel(l.tier)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "brand-primary" | "brand-warning" | "brand-danger";
}) {
  const valueColor =
    accent === "brand-primary"
      ? "text-brand-primary"
      : accent === "brand-warning"
        ? "text-brand-warning"
        : accent === "brand-danger"
          ? "text-brand-danger"
          : "text-foreground";
  return (
    <div className="rounded-xl bg-surface p-5 ring-1 ring-border">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-2xl font-semibold ${valueColor}`}>{value}</h3>
        {hint && <span className={`text-xs font-medium ${valueColor}`}>{hint}</span>}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/60 p-12 text-center">
      <h3 className="text-base font-semibold">Nenhum lead ainda</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Comece uma triagem com poucos dados financeiros e descubra em segundos a
        capacidade de financiamento do comprador.
      </p>
      <Link
        to="/leads/new"
        className="mt-5 inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Iniciar primeira triagem
      </Link>
    </div>
  );
}
