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

/** A realistic sample visit for demos and first-run exploration. */
export function sampleVisit() {
  const v = blankVisit();
  v.patient = { name: "Rahim Uddin", age: "58", sex: "Male", phone: "", location: "Guwahati", mrn: "NC-1042" };
  v.history = { ...v.history, diabetes: true, diabetesYears: "12", hypertension: true, hypertensionYears: "8", nsaid: true };
  v.symptoms = { ...v.symptoms, edema: true, fatigue: true };
  v.vitals = { sbp: "158", dbp: "94", weight: "78", height: "168", volumeStatus: "Hypervolaemic (fluid overload)" };
  v.labs = { ...v.labs, creatinine: "2.1", urea: "68", potassium: "5.6", sodium: "138", calcium: "8.7", phosphate: "5.1", bicarbonate: "19", hemoglobin: "10.2", albumin: "3.4", pth: "142", hba1c: "8.4" };
  v.urine = { dipProtein: "3+", dipBlood: "Trace", acr: "420", pcr: "", protein24: "" };
  v.imaging = { ...v.imaging, kidneySize: "Normal", echogenicity: "Mildly increased", parenchyma: "Normal", hydronephrosis: "None", stones: "None", cysts: "None" };
  v.assessment.doctorNotes = "Diabetic kidney disease, G3b A3, with hyperkalaemia and metabolic acidosis. Hold NSAIDs. Start SGLT2 inhibitor, continue ARB with potassium review in 1 week, oral bicarbonate, phosphate restriction. Iron studies before ESA.";
  v.prescription = {
    items: [
      { name: "Dapagliflozin", composition: "Dapagliflozin 10mg", type: "SGLT2 Inhibitor", dose: "1 tab", frequency: "once daily", duration: "30 days", instructions: "morning" },
      { name: "Telmisartan", composition: "Telmisartan 40mg", type: "ARB", dose: "1 tab", frequency: "once daily", duration: "30 days", instructions: "recheck potassium in 7 days" },
      { name: "Sodium Bicarbonate", composition: "500mg", type: "Alkali Therapy", dose: "1 tab", frequency: "twice daily", duration: "30 days", instructions: "after food" },
      { name: "Sevelamer Carbonate", composition: "800mg", type: "Phosphate Binder", dose: "1 tab", frequency: "three times daily", duration: "30 days", instructions: "with meals" },
    ],
    advice: "Low salt (<5 g/day), limit potassium-rich foods, avoid painkillers such as ibuprofen and diclofenac, 1.5 L fluid per day while swollen.",
    followUp: "Creatinine, potassium and bicarbonate in 7 days. ACR and HbA1c in 3 months. Review in 4 weeks.",
  };
  v.visited = { history: true, vitals: true, labs: true, imaging: true, assessment: true };
  return v;
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

  loadSample() {
    this.visit = sampleVisit();
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
