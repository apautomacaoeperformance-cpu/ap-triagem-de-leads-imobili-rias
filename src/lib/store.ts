import { useEffect, useState } from "react";
import { DEFAULT_PARAMS, type CalcInput, type EngineParams, type Tier } from "./calculator";

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  cpf: string;
  phone: string;
  city: string;
  job: string;
  bond: string; // CLT / autônomo / etc.
  input: CalcInput;
  // snapshot do resultado quando salvo
  tier: Tier;
  maxFinancing: number;
  maxPropertyValue: number;
  maxInstallment: number;
  framework: "SFH" | "SFI";
}

const LEADS_KEY = "qualifimob.leads.v1";
const PARAMS_KEY = "qualifimob.params.v1";
const EVT = "qualifimob.changed";

function isBrowser() {
  return typeof window !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { key } }));
}

export function loadLeads(): Lead[] {
  return read<Lead[]>(LEADS_KEY, []);
}

export function saveLead(lead: Lead): void {
  const all = loadLeads();
  const idx = all.findIndex((l) => l.id === lead.id);
  if (idx >= 0) all[idx] = lead;
  else all.unshift(lead);
  write(LEADS_KEY, all);
}

export function deleteLead(id: string): void {
  const all = loadLeads().filter((l) => l.id !== id);
  write(LEADS_KEY, all);
}

export function getLead(id: string): Lead | undefined {
  return loadLeads().find((l) => l.id === id);
}

export function loadParams(): EngineParams {
  return read<EngineParams>(PARAMS_KEY, DEFAULT_PARAMS);
}

export function saveParams(p: EngineParams): void {
  write(PARAMS_KEY, p);
}

export function resetParams(): void {
  write(PARAMS_KEY, DEFAULT_PARAMS);
}

/** Hook reactivo simples — re-lê do storage quando algo muda. */
export function useLeads(): Lead[] {
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads());
  useEffect(() => {
    const handler = () => setLeads(loadLeads());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return leads;
}

export function useParams(): [EngineParams, (p: EngineParams) => void] {
  const [params, setParams] = useState<EngineParams>(() => loadParams());
  useEffect(() => {
    const handler = () => setParams(loadParams());
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return [params, (p) => saveParams(p)];
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
