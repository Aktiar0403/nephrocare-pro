// Controller: routing, event delegation, live assessment.
import { store } from "./store.js";
import { STEPS, renderPatient, renderHistory, renderVitals, renderLabs, renderImaging, renderAssessment, renderPrescription, renderRecords, renderSettings, renderAside, renderPrintSheet, labTile, esc } from "./views.js";
import { ALL_MEASURES, effectiveEgfr, gfrCategory, albuminuriaCategory, KDIGO_GRID, flags, matchedSuggestions, patientExplanation, status, statusLabel } from "./clinical.js";

const $ = (s, el = document) => el.querySelector(s);
const main = $("#main"), aside = $("#aside"), rail = $("#rail"), toast = $("#toast"), strip = $("#patient-strip"), sheet = $("#print-sheet");

let route = location.hash.replace("#", "") || "patient";
let openRecord = null;
let medicines = [];

fetch("data/medicines.json").then((r) => r.json()).then((d) => { medicines = d; if (route === "prescription") renderMain(); }).catch(() => {});

/* ---------- Derived context ---------- */
function context() {
  const v = store.visit, s = store.settings;
  const egfr = effectiveEgfr(v);
  const evalVisit = { ...v, labs: { ...v.labs, egfr: egfr.value ?? "" } };
  const g = gfrCategory(egfr.value);
  const a = albuminuriaCategory(v.urine.acr);
  const risk = g && a ? KDIGO_GRID[g.row][a.col] : null;
  const flagsList = flags(evalVisit, s.ranges);
  const suggestions = matchedSuggestions(s.rules, evalVisit);
  const explanation = patientExplanation(evalVisit, s.ranges, suggestions);
  return { egfr, g, a, risk, flagsList, suggestions, explanation, evalVisit,
    summary: { egfr: egfr.value, stage: g ? `${g.code}${a ? " " + a.code : ""}` : null, risk, flags: flagsList.length },
    suggestedMeds: suggestedMedicines(evalVisit, suggestions, flagsList), medicineCount: medicines.length };
}

function suggestedMedicines(v, suggestions, flagsList) {
  const ind = new Set();
  const has = (id) => suggestions.some((s) => s.id === id);
  if (["ckd-g3", "ckd-g4", "ckd-g5", "proteinuric-ckd", "diabetic-nephropathy", "htn-nephrosclerosis"].some(has)) ind.add("CKD");
  if (has("microalb") || has("nephrotic") || has("proteinuric-ckd")) ind.add("Proteinuria");
  if (v.history.hypertension || Number(v.vitals.sbp) > 140 || Number(v.vitals.dbp) > 90) ind.add("Hypertension");
  if (v.history.diabetes) ind.add("Diabetes");
  if (v.symptoms.edema || /Hypervol/.test(v.vitals.volumeStatus)) ind.add("Edema");
  if (has("acidosis")) ind.add("Metabolic Acidosis");
  if (has("hyperphos")) ind.add("Hyperphosphatemia");
  if (has("shpt")) ind.add("Secondary Hyperparathyroidism");
  if (has("anaemia")) ind.add("CKD Anemia");
  if (flagsList.some((f) => f.measure.key === "potassium" && f.label === "Low")) ind.add("Hypokalemia");
  const out = {};
  for (const i of ind) {
    const list = medicines.filter((m) => m.indications.includes(i)).slice(0, 5);
    if (list.length) out[i] = list;
  }
  return out;
}

/* ---------- Rendering ---------- */
function renderRail() {
  const v = store.visit;
  const ctx = context();
  const flagBy = { vitals: ctx.flagsList.filter((f) => f.section === "vitals").length, labs: ctx.flagsList.filter((f) => f.section !== "vitals").length };
  const done = {
    patient: !!(v.patient.name && v.patient.age && v.patient.sex),
    history: !!v.visited.history, vitals: !!v.visited.vitals, labs: !!v.visited.labs, imaging: !!v.visited.imaging,
    assessment: !!v.visited.assessment, prescription: v.prescription.items.length > 0,
  };
  rail.innerHTML = `<div class="rail-label">Visit workflow</div>
    ${STEPS.map((s) => `<button data-go="${s.id}" class="${route === s.id ? "active" : ""} ${done[s.id] ? "done" : ""}"><span class="step-no">${done[s.id] ? "✓" : s.n}</span><span>${esc(s.title)}</span>${flagBy[s.id] ? `<span class="flag">${flagBy[s.id]} ▲</span>` : ""}</button>`).join("")}
    <div class="rail-label" style="margin-top:12px">Library</div>
    <button data-go="records" class="${route === "records" ? "active" : ""}"><span class="step-no">≡</span><span>Records</span><span class="flag" style="color:var(--ink-3)">${store.visits.length}</span></button>
    <button data-go="settings" class="${route === "settings" ? "active" : ""}"><span class="step-no">⚙</span><span>Settings</span></button>
    <div class="spacer"></div><div class="rail-foot">Decision support only. Clinical judgement remains with the treating doctor.</div>`;
}

function renderStrip() {
  const p = store.visit.patient;
  strip.innerHTML = p.name
    ? `<span class="name">${esc(p.name)}</span><span class="meta">${esc(p.age ? p.age + " y" : "")} ${esc(p.sex || "")} ${store.visit.id ? "· " + esc(store.visit.id) : "· unsaved visit"}</span>`
    : `<span class="name muted">New visit</span><span class="meta">No patient yet</span>`;
}

function renderAsidePanel() { aside.innerHTML = renderAside(context()); }

function renderMain() {
  const v = store.visit, s = store.settings;
  const ctx = context();
  const views = {
    patient: () => renderPatient(v),
    history: () => renderHistory(v),
    vitals: () => renderVitals(v, s.ranges),
    labs: () => renderLabs(v, s.ranges),
    imaging: () => renderImaging(v),
    assessment: () => renderAssessment(v, ctx),
    prescription: () => renderPrescription(v, ctx),
    records: () => renderRecords(store.visits, openRecord),
    settings: () => renderSettings(s),
  };
  main.innerHTML = (views[route] || views.patient)();
  if (STEPS.some((st) => st.id === route) && route !== "patient" && !v.visited[route]) { v.visited[route] = true; store.persistVisit(); }
  window.scrollTo({ top: 0 });
}

function renderAll() { renderRail(); renderStrip(); renderMain(); renderAsidePanel(); }

function go(r) { route = r; location.hash = r; renderAll(); }

function notify(msg) { toast.textContent = msg; toast.classList.add("show"); clearTimeout(notify.t); notify.t = setTimeout(() => toast.classList.remove("show"), 2200); }

/* ---------- Live updates without full re-render ---------- */
function updateTile(input) {
  const key = input.dataset.measure, section = input.dataset.section;
  const m = ALL_MEASURES.find((x) => x.key === key);
  if (!m) return;
  const tile = input.closest(".lab");
  const range = store.settings.ranges[key];
  const s = status(input.value, range, m);
  tile.className = `lab ${s ? "is-" + s : ""}`;
  tile.querySelector(".status-slot").innerHTML = s ? `<span class="pill ${s}">${statusLabel(s, input.value, range)}</span>` : "";
  const lo = range.min, hi = range.max, span = Math.max(hi - lo, 1e-9);
  const dMin = lo - span * 0.6, dMax = hi + span * 0.6;
  const marker = tile.querySelector(".marker");
  if (input.value !== "" && !isNaN(input.value)) { marker.classList.add("show"); marker.style.left = `${Math.max(0, Math.min(100, ((Number(input.value) - dMin) / (dMax - dMin)) * 100))}%`; }
  else marker.classList.remove("show");
}

function refreshEgfrTile() {
  const input = $('[data-bind="labs.egfrManual"]');
  if (!input) return;
  const eg = effectiveEgfr(store.visit);
  if (eg.source === "CKD-EPI 2021") { input.value = eg.value; input.classList.add("computed"); }
  else if (!eg.source) { input.value = ""; input.classList.remove("computed"); }
  else input.classList.remove("computed");
  updateTile(input);
}

/* ---------- Events ---------- */
document.addEventListener("input", (e) => {
  const el = e.target;
  if (el.dataset.bind) {
    const value = el.type === "checkbox" ? el.checked : el.value;
    store.set(el.dataset.bind, value);
    if (el.type === "checkbox") el.closest(".check")?.classList.toggle("on", el.checked);
    if (el.dataset.measure) updateTile(el);
    if (el.dataset.bind === "labs.creatinine") refreshEgfrTile();
    if (el.dataset.bind.startsWith("patient.")) renderStrip();
    renderAsidePanel();
    renderRail();
    return;
  }
  if (el.dataset.multi) {
    const list = store.get(el.dataset.multi);
    const next = el.checked ? [...new Set([...list, el.value])] : list.filter((x) => x !== el.value);
    store.set(el.dataset.multi, next);
    el.closest(".check")?.classList.toggle("on", el.checked);
    renderAsidePanel();
    return;
  }
  if (el.dataset.rx) {
    const [i, k] = el.dataset.rx.split(".");
    store.visit.prescription.items[Number(i)][k] = el.value;
    store.persistVisit();
    return;
  }
  if (el.dataset.setting) {
    const [a, b] = el.dataset.setting.split(".");
    store.settings[a][b] = el.value;
    store.persistSettings();
    return;
  }
  if (el.dataset.range) {
    const [k, side] = el.dataset.range.split(".");
    store.settings.ranges[k][side] = Number(el.value);
    store.persistSettings();
    return;
  }
  if (el.id === "rx-search") rxSearch(el.value);
});

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go],[data-action],[data-open]");
  if (!t) { if (!e.target.closest(".rx-search")) $("#rx-results")?.classList.add("hidden"); return; }
  if (t.dataset.go) return go(t.dataset.go);
  if (t.dataset.open) { openRecord = t.dataset.open; renderMain(); $("#record-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  const a = t.dataset.action;
  const ctx = context();
  switch (a) {
    case "save": {
      if (!store.visit.patient.name) { notify("Add the patient's name before saving."); go("patient"); return; }
      if (!store.visit.assessment.patientExplanation) store.visit.assessment.patientExplanation = ctx.explanation;
      const rec = store.saveVisit(ctx);
      notify(`Visit ${rec.id} saved.`);
      renderRail(); renderStrip();
      break;
    }
    case "new": {
      if (store.visit.patient.name && !confirm("Start a new visit? Unsaved changes to the current visit will be lost.")) return;
      store.newVisit(); openRecord = null; go("patient"); break;
    }
    case "print": printSheet(store.visit, ctx); break;
    case "sample": store.loadSample(); openRecord = null; go("labs"); notify("Sample patient loaded. Nothing is saved until you press Save."); break;
    case "regen-explain": {
      store.set("assessment.patientExplanation", ctx.explanation);
      $('[data-bind="assessment.patientExplanation"]').value = ctx.explanation;
      notify("Explanation regenerated."); break;
    }
    case "rx-add": addMedicine(t.dataset.name); break;
    case "rx-remove": store.visit.prescription.items.splice(Number(t.dataset.i), 1); store.persistVisit(); renderMain(); renderRail(); break;
    case "record-open": if (store.openVisit(openRecord)) { notify("Visit loaded into the workspace."); go("patient"); } break;
    case "record-copy": {
      const r = store.visits.find((x) => x.id === openRecord);
      navigator.clipboard.writeText(recordText(r)).then(() => notify("Summary copied.")); break;
    }
    case "record-print": {
      const r = store.visits.find((x) => x.id === openRecord);
      const saved = store.visit; store.visit = r; printSheet(r, context()); store.visit = saved; break;
    }
    case "record-delete": {
      if (!confirm(`Delete visit ${openRecord}? This cannot be undone.`)) return;
      store.deleteVisit(openRecord); openRecord = null; renderAll(); notify("Visit deleted."); break;
    }
    case "reset-ranges": store.resetSettings("ranges"); renderMain(); notify("Reference ranges reset."); break;
    case "reset-rules": store.resetSettings("rules"); renderMain(); notify("Rules reset to defaults."); break;
    case "rule-delete": store.settings.rules.splice(Number(t.dataset.i), 1); store.persistSettings(); renderMain(); break;
    case "rule-add": {
      const section = $("#nr-section").value, fieldKey = $("#nr-field").value, operator = $("#nr-op").value;
      const value = $("#nr-value").value, suggestion = $("#nr-suggestion").value.trim(), reason = $("#nr-reason").value.trim();
      if (!value || !suggestion || !reason) { notify("Threshold, suggestion and reason are all required."); return; }
      store.settings.rules.push({ id: `custom-${Date.now()}`, type: "simple", section, field: fieldKey, operator, value: Number(value), suggestion, reason });
      store.persistSettings(); renderMain(); notify("Rule added."); break;
    }
    case "export-all": {
      const blob = new Blob([JSON.stringify(store.visits, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob); const link = Object.assign(document.createElement("a"), { href: url, download: "nephrocare-visits.json" });
      link.click(); URL.revokeObjectURL(url); break;
    }
    case "clear-all": if (confirm("Erase all visits, settings and the current visit from this device?")) { store.clearAll(); openRecord = null; go("patient"); notify("All data erased."); } break;
  }
});

document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#rx-results")?.classList.add("hidden"); });

function rxSearch(q) {
  const box = $("#rx-results");
  if (!box) return;
  const s = q.trim().toLowerCase();
  if (!s) { box.classList.add("hidden"); return; }
  const hits = medicines.filter((m) => [m.name, m.type, m.composition, ...(m.indications || [])].join(" ").toLowerCase().includes(s)).slice(0, 12);
  box.innerHTML = hits.length ? hits.map((m) => `<button data-action="rx-add" data-name="${esc(m.name)}"><span><b>${esc(m.name)}</b> <small>${esc(m.composition)}</small></span><small>${esc(m.type)}</small></button>`).join("") : `<div class="empty" style="margin:8px">No match. Press Enter to add "${esc(q)}" as a custom medicine.</div>`;
  box.classList.remove("hidden");
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "rx-search" && e.target.value.trim()) { e.preventDefault(); addMedicine(e.target.value.trim()); }
});

function addMedicine(name) {
  const m = medicines.find((x) => x.name.toLowerCase() === name.toLowerCase()) || { name, composition: "", type: "" };
  if (store.visit.prescription.items.some((i) => i.name === m.name)) { notify(`${m.name} is already on the prescription.`); return; }
  store.visit.prescription.items.push({ name: m.name, composition: m.composition, type: m.type, dose: "", frequency: "", duration: "", instructions: "" });
  store.persistVisit(); renderMain(); renderRail();
  const last = main.querySelectorAll('input[data-rx$=".dose"]'); last[last.length - 1]?.focus();
}

function printSheet(v, ctx) {
  sheet.innerHTML = renderPrintSheet(v, store.settings, ctx);
  window.print();
}

function recordText(r) {
  const lines = [`NephroCare Pro visit ${r.id}`, `Patient: ${r.patient.name}, ${r.patient.age} y, ${r.patient.sex}`, `Date: ${new Date(r.updatedAt).toLocaleString()}`, ""];
  const sec = (title, obj) => { const rows = Object.entries(obj).filter(([, x]) => x !== "" && x !== false && x != null && !(Array.isArray(x) && !x.length)); if (rows.length) { lines.push(title.toUpperCase()); rows.forEach(([k, x]) => lines.push(`  ${k}: ${x === true ? "yes" : Array.isArray(x) ? x.join(", ") : x}`)); lines.push(""); } };
  sec("History", r.history); sec("Symptoms", r.symptoms); sec("Vitals", r.vitals); sec("Blood", { ...r.labs, egfr: r.summary?.egfr ?? "" }); sec("Urine", r.urine); sec("Ultrasound", r.imaging);
  if (r.summary?.stage) lines.push(`KDIGO: ${r.summary.stage}`, "");
  if (r.assessment.suggestions?.length) { lines.push("SUGGESTIONS"); r.assessment.suggestions.forEach((s) => lines.push(`  - ${s.suggestion}: ${s.reason}`)); lines.push(""); }
  if (r.assessment.doctorNotes) lines.push("CLINICAL NOTE", r.assessment.doctorNotes, "");
  if (r.prescription.items.length) { lines.push("PRESCRIPTION"); r.prescription.items.forEach((i, n) => lines.push(`  ${n + 1}. ${i.name} ${[i.dose, i.frequency, i.duration, i.instructions].filter(Boolean).join(", ")}`)); lines.push(""); }
  if (r.assessment.patientExplanation) lines.push("FOR THE PATIENT", r.assessment.patientExplanation);
  return lines.join("\n");
}

// ?demo=1 loads the sample patient (used for screenshots and quick demos).
if (new URLSearchParams(location.search).get("demo") === "1" && !store.visit.patient.name) store.loadSample();

window.addEventListener("hashchange", () => { const r = location.hash.replace("#", ""); if (r && r !== route) { route = r; renderAll(); } });
renderAll();
