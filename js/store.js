// Persistent state: current visit, saved visits and settings (localStorage).
import { DEFAULT_RULES, defaultRanges } from "./clinical.js";

const KEYS = { visit: "ncp.visit", visits: "ncp.visits", settings: "ncp.settings" };

export function blankVisit() {
  return {
    id: null,
    createdAt: null,
    updatedAt: null,
    patient: { name: "", age: "", sex: "", phone: "", location: "", mrn: "" },
    history: { diabetes: false, diabetesYears: "", hypertension: false, hypertensionYears: "", nsaid: false, stones: false, familyCkd: false, tb: false, hiv: false, hepatitis: false, notes: "" },
    symptoms: { edema: false, fatigue: false, nausea: false, vomiting: false, breathlessness: false, oliguria: false, flankPain: false, hematuria: false, notes: "" },
    vitals: { sbp: "", dbp: "", weight: "", height: "", volumeStatus: "" },
    labs: { creatinine: "", egfrManual: "", egfr: "", urea: "", potassium: "", sodium: "", calcium: "", phosphate: "", bicarbonate: "", hemoglobin: "", albumin: "", pth: "", hba1c: "" },
    urine: { dipProtein: "", dipBlood: "", acr: "", pcr: "", protein24: "" },
    imaging: { kidneySize: "", echogenicity: "", parenchyma: "", hydronephrosis: "", stones: "", cysts: "", other: [], notes: "" },
    assessment: { doctorNotes: "", patientExplanation: "", suggestions: [] },
    prescription: { items: [], advice: "", followUp: "" },
    visited: {},
  };
}

export function defaultSettings() {
  return {
    clinic: { doctor: "", qualifications: "", clinic: "", address: "", phone: "", regNo: "" },
    ranges: defaultRanges(),
    rules: DEFAULT_RULES.map((r) => ({ ...r })),
  };
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function deepMerge(base, extra) {
  if (Array.isArray(base)) return Array.isArray(extra) ? extra : base;
  if (typeof base !== "object" || base === null) return extra === undefined ? base : extra;
  const out = { ...base };
  for (const k of Object.keys(extra || {})) out[k] = k in base ? deepMerge(base[k], extra[k]) : extra[k];
  return out;
}

export const store = {
  visit: deepMerge(blankVisit(), read(KEYS.visit, {})),
  visits: read(KEYS.visits, []),
  settings: deepMerge(defaultSettings(), read(KEYS.settings, {})),

  persistVisit() { write(KEYS.visit, this.visit); },
  persistSettings() { write(KEYS.settings, this.settings); },
  persistVisits() { write(KEYS.visits, this.visits); },

  set(path, value) {
    const parts = path.split(".");
    let obj = this.visit;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
    this.persistVisit();
  },
  get(path) {
    return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), this.visit);
  },

  newVisit() {
    this.visit = blankVisit();
    this.persistVisit();
  },

  /** Save current visit as a record (upsert). Returns the record. */
  saveVisit(snapshot) {
    const now = new Date().toISOString();
    if (!this.visit.id) {
      const d = new Date();
      const stamp = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      const n = this.visits.filter((v) => v.id?.startsWith(stamp)).length + 1;
      this.visit.id = `${stamp}-${String(n).padStart(3, "0")}`;
      this.visit.createdAt = now;
    }
    this.visit.updatedAt = now;
    this.visit.assessment.suggestions = snapshot.suggestions;
    this.visit.summary = snapshot.summary;
    const copy = JSON.parse(JSON.stringify(this.visit));
    const i = this.visits.findIndex((v) => v.id === copy.id);
    if (i >= 0) this.visits[i] = copy; else this.visits.unshift(copy);
    this.persistVisits();
    this.persistVisit();
    return copy;
  },

  openVisit(id) {
    const v = this.visits.find((x) => x.id === id);
    if (!v) return false;
    this.visit = deepMerge(blankVisit(), JSON.parse(JSON.stringify(v)));
    this.persistVisit();
    return true;
  },

  deleteVisit(id) {
    this.visits = this.visits.filter((v) => v.id !== id);
    this.persistVisits();
    if (this.visit.id === id) this.newVisit();
  },

  resetSettings(part) {
    const d = defaultSettings();
    if (part) this.settings[part] = d[part]; else this.settings = d;
    this.persistSettings();
  },

  clearAll() {
    for (const k of Object.values(KEYS)) localStorage.removeItem(k);
    this.visit = blankVisit();
    this.visits = [];
    this.settings = defaultSettings();
  },
};
