import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar esta página. Tente novamente ou volte ao dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-brand-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "QualifiMob — Pré-qualificação de crédito imobiliário" },
      {
        name: "description",
        content:
          "Triagem de leads para imobiliárias: capacidade de financiamento, imóvel máximo e plano de ação em minutos.",
      },
      { property: "og:title", content: "QualifiMob — Pré-qualificação de crédito imobiliário" },
      { name: "twitter:title", content: "QualifiMob — Pré-qualificação de crédito imobiliário" },
      { name: "description", content: "App for real estate agencies to pre-qualify buyer credit for financing." },
      { property: "og:description", content: "App for real estate agencies to pre-qualify buyer credit for financing." },
      { name: "twitter:description", content: "App for real estate agencies to pre-qualify buyer credit for financing." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b26df01c-85e2-443d-a713-2f1aa34ef408/id-preview-019daf0f--b2d6fd78-2771-412d-829d-0b347f44636d.lovable.app-1781549535354.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b26df01c-85e2-443d-a713-2f1aa34ef408/id-preview-019daf0f--b2d6fd78-2771-412d-829d-0b347f44636d.lovable.app-1781549535354.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AppSidebar() {
  const navLink =
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground [&.active]:bg-brand-primary-soft [&.active]:text-brand-primary";
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-background/80 backdrop-blur md:flex">
      <div className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-sm bg-brand-primary" />
          <span className="font-semibold tracking-tight text-brand-primary">
            QualifiMob
          </span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        <Link to="/" activeOptions={{ exact: true }} className={navLink}>
          <span className="inline-block size-1.5 rounded-full bg-current opacity-60" />
          Dashboard
        </Link>
        <Link to="/leads/new" className={navLink}>
          <span className="inline-block size-1.5 rounded-full bg-current opacity-60" />
          Nova triagem
        </Link>
        <Link to="/settings" className={navLink}>
          <span className="inline-block size-1.5 rounded-full bg-current opacity-60" />
          Configurações
        </Link>
      </nav>
      <div className="p-3">
        <Link
          to="/leads/new"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-primary-foreground ring-1 ring-brand-primary transition-opacity hover:opacity-90"
        >
          <span className="inline-block size-2 rounded-full bg-primary-foreground/70" />
          Novo lead
        </Link>
      </div>
    </aside>
  );
}

function MobileTopbar() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:hidden">
      <Link to="/" className="flex items-center gap-2">
        <span className="inline-block size-2.5 rounded-sm bg-brand-primary" />
        <span className="font-semibold tracking-tight text-brand-primary">QualifiMob</span>
      </Link>
      <nav className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <Link to="/" activeOptions={{ exact: true }} className="[&.active]:text-foreground">Dashboard</Link>
        <Link to="/leads/new" className="[&.active]:text-foreground">Nova</Link>
        <Link to="/settings" className="[&.active]:text-foreground">Config</Link>
      </nav>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-background py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 md:flex-row">
        <div className="max-w-md space-y-3">
          <span className="font-semibold tracking-tight text-muted-foreground">
            QualifiMob · Analítica de crédito
          </span>
          <p className="text-xs text-muted-foreground">
            Ferramenta de uso interno para pré-qualificação imobiliária. Os valores são
            estimativas de apoio comercial e <strong>não representam aprovação, promessa
            ou concessão de crédito</strong>. A análise final cabe à instituição financeira.
            Dados tratados conforme a LGPD.
          </p>
        </div>
        <div className="flex gap-12">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Produto
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link to="/leads/new">Nova triagem</Link>
              </li>
              <li>
                <Link to="/settings">Política de crédito</Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Legal
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>LGPD</li>
              <li>Aviso institucional</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTopbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <AppFooter />
        </div>
      </div>
    </QueryClientProvider>
  );
}
