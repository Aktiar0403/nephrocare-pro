// HTML renderers for each workspace step. Pure functions of state.
import { LABS, URINE, VITALS, ALL_MEASURES, status, statusLabel, effectiveEgfr, gfrCategory, albuminuriaCategory, KDIGO_GRID, KDIGO_ROWS, KDIGO_RISK } from "./clinical.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const STEPS = [
  { id: "patient", n: 1, title: "Patient", blurb: "Who is this visit for. Age and sex drive the eGFR calculation." },
  { id: "history", n: 2, title: "History & symptoms", blurb: "Risk factors and what the patient is experiencing today." },
  { id: "vitals", n: 3, title: "Vitals", blurb: "Blood pressure, weight and volume status." },
  { id: "labs", n: 4, title: "Laboratory", blurb: "Blood and urine results. eGFR is calculated from creatinine automatically." },
  { id: "imaging", n: 5, title: "Ultrasound", blurb: "Renal ultrasound findings." },
  { id: "assessment", n: 6, title: "Assessment", blurb: "Rule-based suggestions, your clinical note and a plain-language explanation for the patient." },
  { id: "prescription", n: 7, title: "Prescription", blurb: "Medicines, advice and follow-up. Print a clean sheet for the patient." },
];

function field(label, inner, unit) {
  return `<div class="field"><label>${esc(label)}${unit ? ` <span class="unit">${esc(unit)}</span>` : ""}</label>${inner}</div>`;
}
function input(bind, value, attrs = "") {
  return `<input class="control" data-bind="${bind}" value="${esc(value)}" ${attrs}>`;
}
function select(bind, value, options, attrs = "") {
  const opts = ["", ...options].map((o) => `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${o === "" ? "Select" : esc(o)}</option>`).join("");
  return `<select class="control" data-bind="${bind}" ${attrs}>${opts}</select>`;
}
function textarea(bind, value, placeholder = "") {
  return `<textarea class="control" data-bind="${bind}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`;
}
function check(bind, checked, label, extra = "") {
  return `<label class="check ${checked ? "on" : ""}"><input type="checkbox" data-bind="${bind}" ${checked ? "checked" : ""}> <span>${esc(label)}</span>${extra}</label>`;
}

export function rangeBar(m, range, value) {
  const lo = range.min, hi = range.max;
  const span = Math.max(hi - lo, 1e-9);
  const domainMin = lo - span * 0.6, domainMax = hi + span * 0.6;
  const pct = (x) => Math.max(0, Math.min(100, ((x - domainMin) / (domainMax - domainMin)) * 100));
  const has = value !== "" && value != null && !isNaN(value);
  return `<div class="range"><div class="band" style="left:${pct(lo)}%;width:${pct(hi) - pct(lo)}%"></div><div class="marker ${has ? "show" : ""}" style="left:${has ? pct(Number(value)) : 0}%"></div></div>`;
}

export function labTile(section, m, value, ranges, opts = {}) {
  const range = ranges[m.key] || { min: m.min, max: m.max };
  const s = status(value, range, m);
  const label = statusLabel(s, value, range);
  const pill = s ? `<span class="pill ${s === "ok" ? "ok" : s}">${label}</span>` : "";
  const computed = opts.computed ? "computed" : "";
  const bind = opts.bind || `${section}.${m.key}`;
  return `<div class="lab ${s ? "is-" + s : ""}" data-tile="${m.key}">
    <div class="lab-top"><label for="f-${m.key}">${esc(m.label)}</label><span class="unit">${esc(m.unit)}</span></div>
    <input id="f-${m.key}" type="number" inputmode="decimal" step="${m.step}" class="${computed}" data-bind="${bind}" data-measure="${m.key}" data-section="${section}" value="${esc(value)}" placeholder="—" ${opts.readonly ? "readonly" : ""}>
    ${rangeBar(m, range, value)}
    <div class="lab-foot"><span>ref ${range.min}–${range.max}</span><span class="status-slot">${pill}</span></div>
  </div>`;
}

export function pageHead(step, extra = "") {
  return `<div class="page-head"><div><div class="step-tag">Step ${step.n} of ${STEPS.length}</div><h1>${esc(step.title)}</h1><p>${esc(step.blurb)}</p></div>${extra}</div>`;
}

export function pageFoot(step) {
  const i = STEPS.findIndex((s) => s.id === step.id);
  const prev = STEPS[i - 1], next = STEPS[i + 1];
  return `<div class="page-foot">
    ${prev ? `<button class="btn" data-go="${prev.id}">← ${esc(prev.title)}</button>` : "<span></span>"}
    ${next ? `<button class="btn primary" data-go="${next.id}">Continue to ${esc(next.title)} →</button>` : `<button class="btn primary" data-action="save">Save visit</button>`}
  </div>`;
}

/* ---------- Steps ---------- */

export function renderPatient(v) {
  const p = v.patient;
  return `${pageHead(STEPS[0])}
  <div class="card"><div class="card-head"><h2>Identity</h2><span class="hint">Required: name, age, sex</span></div><div class="card-body grid c3">
    ${field("Full name", input("patient.name", p.name, 'placeholder="e.g. Rahim Uddin" autocomplete="off"'))}
    ${field("Age", input("patient.age", p.age, 'type="number" min="0" max="120" inputmode="numeric" placeholder="years"'), "years")}
    ${field("Sex", select("patient.sex", p.sex, ["Male", "Female", "Other"]))}
    ${field("Phone", input("patient.phone", p.phone, 'type="tel" placeholder="optional"'))}
    ${field("Location", input("patient.location", p.location, 'placeholder="town / district"'))}
    ${field("Patient ID / MRN", input("patient.mrn", p.mrn, 'placeholder="optional"'))}
  </div></div>
  ${pageFoot(STEPS[0])}`;
}

export function renderHistory(v) {
  const h = v.history, s = v.symptoms;
  const yrs = (bind, val) => `<input class="control sub" type="number" min="0" data-bind="${bind}" value="${esc(val)}" placeholder="years">`;
  return `${pageHead(STEPS[1])}
  <div class="card"><div class="card-head"><h2>Medical history</h2><span class="hint">Tick what applies</span></div><div class="card-body">
    <div class="checks">
      ${check("history.diabetes", h.diabetes, "Diabetes", yrs("history.diabetesYears", h.diabetesYears))}
      ${check("history.hypertension", h.hypertension, "Hypertension", yrs("history.hypertensionYears", h.hypertensionYears))}
      ${check("history.nsaid", h.nsaid, "Regular NSAID use")}
      ${check("history.stones", h.stones, "Past kidney stones")}
      ${check("history.familyCkd", h.familyCkd, "Family history of CKD")}
      ${check("history.tb", h.tb, "Tuberculosis")}
      ${check("history.hiv", h.hiv, "HIV")}
      ${check("history.hepatitis", h.hepatitis, "Hepatitis B / C")}
    </div>
    <div class="field" style="margin-top:14px">${field("Other history", textarea("history.notes", h.notes, "Surgeries, other conditions, current medicines…"))}</div>
  </div></div>
  <div class="card"><div class="card-head"><h2>Presenting symptoms</h2></div><div class="card-body">
    <div class="checks">
      ${check("symptoms.edema", s.edema, "Swelling (oedema)")}
      ${check("symptoms.fatigue", s.fatigue, "Fatigue")}
      ${check("symptoms.nausea", s.nausea, "Nausea")}
      ${check("symptoms.vomiting", s.vomiting, "Vomiting")}
      ${check("symptoms.breathlessness", s.breathlessness, "Breathlessness")}
      ${check("symptoms.oliguria", s.oliguria, "Decreased urine output")}
      ${check("symptoms.flankPain", s.flankPain, "Flank pain")}
      ${check("symptoms.hematuria", s.hematuria, "Blood in urine")}
    </div>
    <div class="field" style="margin-top:14px">${field("Symptom notes", textarea("symptoms.notes", s.notes, "Duration, severity, pattern…"))}</div>
  </div></div>
  ${pageFoot(STEPS[1])}`;
}

export function renderVitals(v, ranges) {
  const t = v.vitals;
  const bmi = t.weight && t.height ? (Number(t.weight) / Math.pow(Number(t.height) / 100, 2)).toFixed(1) : "";
  return `${pageHead(STEPS[2])}
  <div class="card"><div class="card-head"><h2>Measurements</h2><span class="hint">${bmi ? `BMI ${bmi} kg/m²` : ""}</span></div><div class="card-body">
    <div class="labs">${VITALS.map((m) => labTile("vitals", m, t[m.key], ranges)).join("")}</div>
    <div class="grid c2" style="margin-top:16px">
      ${field("Volume status", select("vitals.volumeStatus", t.volumeStatus, ["Euvolaemic", "Hypervolaemic (fluid overload)", "Hypovolaemic (dehydrated)"]))}
    </div>
  </div></div>
  ${pageFoot(STEPS[2])}`;
}

export function renderLabs(v, ranges) {
  const l = v.labs, u = v.urine;
  const eg = effectiveEgfr(v);
  const egfrTile = labTile("labs", LABS[1], eg.value ?? "", ranges, { computed: eg.source === "CKD-EPI 2021", bind: "labs.egfrManual" });
  const egfrHint = eg.source === "CKD-EPI 2021"
    ? `Calculated with CKD-EPI 2021 from creatinine, age ${esc(v.patient.age)} and sex. Type a value to override.`
    : eg.source === "entered" ? "Manually entered. Clear it to use the calculated value." : "Enter creatinine plus the patient's age and sex to calculate eGFR.";
  const dip = ["Nil", "Trace", "1+", "2+", "3+", "4+"];
  return `${pageHead(STEPS[3])}
  <div class="card"><div class="card-head"><h2>Blood</h2><span class="hint">${esc(egfrHint)}</span></div><div class="card-body">
    <div class="labs">${labTile("labs", LABS[0], l.creatinine, ranges)}${egfrTile}${LABS.slice(2).map((m) => labTile("labs", m, l[m.key], ranges)).join("")}</div>
  </div></div>
  <div class="card"><div class="card-head"><h2>Urine</h2><span class="hint">ACR drives the KDIGO albuminuria category</span></div><div class="card-body">
    <div class="grid c2" style="margin-bottom:14px">
      ${field("Dipstick protein", select("urine.dipProtein", u.dipProtein, dip))}
      ${field("Dipstick blood", select("urine.dipBlood", u.dipBlood, dip))}
    </div>
    <div class="labs">${URINE.map((m) => labTile("urine", m, u[m.key], ranges)).join("")}</div>
  </div></div>
  ${pageFoot(STEPS[3])}`;
}

export function renderImaging(v) {
  const i = v.imaging;
  const others = ["Cortical scarring", "Poor corticomedullary differentiation", "Perinephric collection", "Renal artery changes"];
  return `${pageHead(STEPS[4])}
  <div class="card"><div class="card-head"><h2>Renal ultrasound</h2></div><div class="card-body">
    <div class="grid c3">
      ${field("Kidney size", select("imaging.kidneySize", i.kidneySize, ["Normal", "Increased", "Decreased", "Asymmetrical"]))}
      ${field("Cortical echogenicity", select("imaging.echogenicity", i.echogenicity, ["Normal", "Mildly increased", "Markedly increased"]))}
      ${field("Parenchymal thickness", select("imaging.parenchyma", i.parenchyma, ["Normal", "Reduced"]))}
      ${field("Hydronephrosis", select("imaging.hydronephrosis", i.hydronephrosis, ["None", "Mild", "Moderate", "Severe"]))}
      ${field("Stones", select("imaging.stones", i.stones, ["None", "Single", "Multiple", "Bilateral"]))}
      ${field("Cysts", select("imaging.cysts", i.cysts, ["None", "Single", "Multiple unilateral", "Multiple bilateral"]))}
    </div>
    <div style="margin-top:16px"><label class="small muted" style="display:block;margin-bottom:6px">Other findings</label>
      <div class="checks">${others.map((o) => `<label class="check ${i.other.includes(o) ? "on" : ""}"><input type="checkbox" data-multi="imaging.other" value="${esc(o)}" ${i.other.includes(o) ? "checked" : ""}> <span>${esc(o)}</span></label>`).join("")}</div>
    </div>
    <div class="field" style="margin-top:14px">${field("Report notes", textarea("imaging.notes", i.notes, "Free-text findings"))}</div>
  </div></div>
  ${pageFoot(STEPS[4])}`;
}

export function renderAssessment(v, ctx) {
  const { suggestions, explanation, egfr, g, a } = ctx;
  const sugg = suggestions.length
    ? suggestions.map((s) => `<div class="suggestion"><div><h3>${esc(s.suggestion)}</h3><p class="why">${esc(s.reason)}</p></div><span class="pill ${s.type === "simple" ? "neutral" : "info"}">${s.type === "simple" ? "Threshold" : "Pattern"}</span><div class="evidence">${s.evidence.map((e) => `<span>${esc(e)}</span>`).join("")}</div></div>`).join("")
    : `<div class="card-body"><div class="empty">No rule has matched yet. Suggestions appear here as labs, urine, history and ultrasound are entered.</div></div>`;
  const stageLine = g ? `${g.code} · ${g.label}${a ? ` · ${a.code} ${a.label.toLowerCase()}` : ""}` : "eGFR not available yet";
  return `${pageHead(STEPS[5])}
  <div class="card"><div class="card-head"><h2>Suggested diagnoses</h2><span class="hint">${esc(stageLine)}</span></div>${sugg}</div>
  <div class="card"><div class="card-head"><h2>Clinical note</h2><span class="hint">Your own assessment and plan</span></div><div class="card-body">
    ${textarea("assessment.doctorNotes", v.assessment.doctorNotes, "Impression, differential, plan…")}
  </div></div>
  <div class="card"><div class="card-head"><h2>Explanation for the patient</h2><button class="btn sm" data-action="regen-explain">Regenerate from results</button></div><div class="card-body">
    <textarea class="control" data-bind="assessment.patientExplanation" style="min-height:160px">${esc(v.assessment.patientExplanation || explanation)}</textarea>
    <p class="small muted" style="margin-top:8px">Generated in plain language from the results. Edit freely; this text is printed on the prescription sheet.</p>
  </div></div>
  ${pageFoot(STEPS[5])}`;
}

export function renderPrescription(v, ctx) {
  const rx = v.prescription;
  const rows = rx.items.length
    ? rx.items.map((it, i) => `<tr>
        <td class="n">${i + 1}</td>
        <td class="name"><b>${esc(it.name)}</b><small>${esc(it.composition || "")}</small></td>
        <td><input class="control" data-rx="${i}.dose" value="${esc(it.dose)}" placeholder="1 tab"></td>
        <td><input class="control" data-rx="${i}.frequency" value="${esc(it.frequency)}" placeholder="once daily"></td>
        <td><input class="control" data-rx="${i}.duration" value="${esc(it.duration)}" placeholder="30 days"></td>
        <td><input class="control" data-rx="${i}.instructions" value="${esc(it.instructions)}" placeholder="after food"></td>
        <td><button class="btn sm ghost danger" data-action="rx-remove" data-i="${i}" title="Remove">✕</button></td>
      </tr>`).join("")
    : `<tr><td colspan="7"><div class="empty">No medicines added. Search above or pick from the suggestions.</div></td></tr>`;
  const groups = Object.entries(ctx.suggestedMeds);
  return `${pageHead(STEPS[6], `<button class="btn" data-action="print">Print prescription</button>`)}
  <div class="card"><div class="card-head"><h2>Add medicine</h2><span class="hint">${ctx.medicineCount} medicines in formulary</span></div><div class="card-body">
    <div class="rx-search"><input class="control" id="rx-search" placeholder="Search by name, class or composition…" autocomplete="off"><div class="rx-results hidden" id="rx-results"></div></div>
    ${groups.length ? groups.map(([ind, meds]) => `<div style="margin-top:12px"><div class="small muted" style="margin-bottom:6px">Suggested for <b>${esc(ind)}</b></div><div class="chips">${meds.map((m) => `<button class="chip" data-action="rx-add" data-name="${esc(m.name)}">${esc(m.name)} <span class="muted">· ${esc(m.type)}</span></button>`).join("")}</div></div>`).join("") : `<p class="small muted" style="margin-top:10px">Suggestions appear once the assessment identifies indications such as CKD, hypertension or diabetes.</p>`}
  </div></div>
  <div class="card"><div class="card-head"><h2>Prescription</h2></div><div class="card-body" style="padding:6px 10px 10px">
    <table class="rx"><thead><tr><th></th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th><th></th></tr></thead><tbody>${rows}</tbody></table>
  </div></div>
  <div class="card"><div class="card-head"><h2>Advice & follow-up</h2></div><div class="card-body grid c2">
    ${field("Advice", textarea("prescription.advice", rx.advice, "Diet, fluids, salt, avoid NSAIDs…"))}
    ${field("Follow-up", textarea("prescription.followUp", rx.followUp, "Repeat creatinine, ACR in 3 months; review in 4 weeks"))}
  </div></div>
  ${pageFoot(STEPS[6])}`;
}

/* ---------- Records ---------- */

export function renderRecords(visits, openId) {
  const rows = visits.length
    ? visits.map((r) => `<tr class="row" data-open="${esc(r.id)}">
        <td class="mono">${esc(r.id)}</td>
        <td><b>${esc(r.patient.name || "Unnamed")}</b><div class="small muted">${esc(r.patient.age ? r.patient.age + " y" : "")} ${esc(r.patient.sex || "")}</div></td>
        <td>${new Date(r.updatedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td>${r.summary?.stage ? `<span class="pill ${r.summary.risk === "r" ? "crit" : r.summary.risk === "o" || r.summary.risk === "y" ? "warn" : "ok"}">${esc(r.summary.stage)}</span>` : '<span class="muted">—</span>'}</td>
        <td class="mono">${r.summary?.flags ?? 0}</td>
        <td>${(r.assessment?.suggestions || []).slice(0, 2).map((s) => esc(s.suggestion)).join(", ") || '<span class="muted">—</span>'}</td>
      </tr>`).join("")
    : `<tr><td colspan="6"><div class="empty">No saved visits yet. Complete a visit and press Save.</div></td></tr>`;
  const open = visits.find((r) => r.id === openId);
  return `<div class="page-head"><div><div class="step-tag">Records</div><h1>Saved visits</h1><p>Stored on this device. Open a visit to review, edit or print it.</p></div><span class="pill neutral">${visits.length} visits</span></div>
  <div class="card"><table class="list"><thead><tr><th>Visit</th><th>Patient</th><th>Date</th><th>KDIGO</th><th>Flags</th><th>Suggestions</th></tr></thead><tbody>${rows}</tbody></table></div>
  ${open ? renderRecordDetail(open) : ""}`;
}

function dl(obj, measures) {
  const rows = [];
  for (const [k, val] of Object.entries(obj)) {
    if (val === "" || val == null || val === false || (Array.isArray(val) && !val.length)) continue;
    const m = measures?.find((x) => x.key === k);
    const label = m ? `${m.label} (${m.unit})` : k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    rows.push(`<dt>${esc(label)}</dt><dd>${val === true ? "Yes" : Array.isArray(val) ? esc(val.join(", ")) : esc(val)}</dd>`);
  }
  return rows.length ? `<dl>${rows.join("")}</dl>` : `<p class="small muted">Nothing recorded.</p>`;
}

export function renderRecordDetail(r) {
  return `<div class="card record-view" id="record-detail">
    <div class="card-head"><h2>${esc(r.patient.name || "Unnamed")} · <span class="mono">${esc(r.id)}</span></h2>
      <div style="display:flex;gap:8px"><button class="btn sm" data-action="record-open">Open in workspace</button><button class="btn sm" data-action="record-copy">Copy summary</button><button class="btn sm" data-action="record-print">Print</button><button class="btn sm danger" data-action="record-delete">Delete</button></div></div>
    <section><h3>Patient</h3>${dl(r.patient)}</section>
    <section><h3>History</h3>${dl(r.history)}</section>
    <section><h3>Symptoms</h3>${dl(r.symptoms)}</section>
    <section><h3>Vitals</h3>${dl(r.vitals, VITALS)}</section>
    <section><h3>Blood</h3>${dl({ ...r.labs, egfr: r.summary?.egfr ?? r.labs.egfrManual, egfrManual: "" }, LABS)}</section>
    <section><h3>Urine</h3>${dl(r.urine, URINE)}</section>
    <section><h3>Ultrasound</h3>${dl(r.imaging)}</section>
    <section><h3>Assessment</h3>${(r.assessment.suggestions || []).map((s) => `<span class="pill info" style="margin:0 6px 6px 0">${esc(s.suggestion)}</span>`).join("") || ""}${r.assessment.doctorNotes ? `<p style="margin-top:8px;white-space:pre-wrap">${esc(r.assessment.doctorNotes)}</p>` : ""}</section>
    <section><h3>Prescription</h3>${r.prescription.items.length ? `<ol style="margin:0;padding-left:18px">${r.prescription.items.map((i) => `<li><b>${esc(i.name)}</b> ${esc([i.dose, i.frequency, i.duration, i.instructions].filter(Boolean).join(" · "))}</li>`).join("")}</ol>` : `<p class="small muted">None.</p>`}</section>
  </div>`;
}

/* ---------- Settings ---------- */

export function renderSettings(settings) {
  const c = settings.clinic;
  const rangeRows = ALL_MEASURES.map((m) => {
    const r = settings.ranges[m.key];
    return `<tr><td>${esc(m.label)} <span class="muted small">${esc(m.unit)}</span></td><td><input class="control mono" type="number" step="any" data-range="${m.key}.min" value="${esc(r.min)}"></td><td><input class="control mono" type="number" step="any" data-range="${m.key}.max" value="${esc(r.max)}"></td></tr>`;
  }).join("");
  const rules = settings.rules.map((r, i) => {
    const conds = r.type === "simple" ? `${r.section}.${r.field} ${r.operator} ${r.value}` : r.conditions.map((x) => `${x.section}.${x.field} ${x.operator} ${Array.isArray(x.value) ? x.value.join("|") : x.value}`).join(" AND ");
    return `<div class="rule"><div><b>${esc(r.suggestion)}</b><div><code>${esc(conds)}</code></div><div class="reason">${esc(r.reason)}</div></div><button class="btn sm ghost danger" data-action="rule-delete" data-i="${i}">Delete</button></div>`;
  }).join("");
  const fieldOpts = ALL_MEASURES.map((m) => `<option value="${m.key}">${esc(m.label)}</option>`).join("");
  return `<div class="page-head"><div><div class="step-tag">Settings</div><h1>Clinic, ranges and rules</h1><p>Everything here is stored on this device only.</p></div></div>
  <div class="card"><div class="card-head"><h2>Clinic details</h2><span class="hint">Printed on the prescription header</span></div><div class="card-body grid c3">
    ${field("Doctor's name", `<input class="control" data-setting="clinic.doctor" value="${esc(c.doctor)}" placeholder="Dr …">`)}
    ${field("Qualifications", `<input class="control" data-setting="clinic.qualifications" value="${esc(c.qualifications)}" placeholder="MD, DM (Nephrology)">`)}
    ${field("Registration no.", `<input class="control" data-setting="clinic.regNo" value="${esc(c.regNo)}">`)}
    ${field("Clinic / hospital", `<input class="control" data-setting="clinic.clinic" value="${esc(c.clinic)}">`)}
    ${field("Address", `<input class="control" data-setting="clinic.address" value="${esc(c.address)}">`)}
    ${field("Phone", `<input class="control" data-setting="clinic.phone" value="${esc(c.phone)}">`)}
  </div></div>
  <div class="card"><div class="card-head"><h2>Reference ranges</h2><button class="btn sm" data-action="reset-ranges">Reset to defaults</button></div><div class="card-body" style="padding:0 10px 6px">
    <table class="ranges"><thead><tr><th>Measure</th><th>Min</th><th>Max</th></tr></thead><tbody>${rangeRows}</tbody></table>
  </div></div>
  <div class="card"><div class="card-head"><h2>Diagnosis rules</h2><button class="btn sm" data-action="reset-rules">Reset to defaults</button></div>
    ${rules}
    <div class="card-body" style="border-top:1px solid var(--line)">
      <h3 style="font-size:0.9rem;margin-bottom:10px">Add a simple rule</h3>
      <div class="grid c4">
        ${field("Section", `<select class="control" id="nr-section"><option value="labs">Blood</option><option value="urine">Urine</option><option value="vitals">Vitals</option></select>`)}
        ${field("Measure", `<select class="control" id="nr-field">${fieldOpts}</select>`)}
        ${field("Operator", `<select class="control" id="nr-op"><option>&lt;</option><option>&gt;</option><option>&lt;=</option><option>&gt;=</option></select>`)}
        ${field("Threshold", `<input class="control mono" id="nr-value" type="number" step="any">`)}
        ${field("Suggestion", `<input class="control" id="nr-suggestion" placeholder="e.g. Hyponatraemia">`)}
        ${field("Reason (audit note)", `<input class="control" id="nr-reason" placeholder="Why this rule exists">`)}
      </div>
      <div style="margin-top:12px"><button class="btn primary" data-action="rule-add">Add rule</button></div>
    </div>
  </div>
  <div class="card"><div class="card-head"><h2>Data</h2></div><div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
    <button class="btn" data-action="export-all">Download all visits (JSON)</button>
    <button class="btn danger" data-action="clear-all">Erase everything on this device</button>
  </div></div>`;
}

/* ---------- Aside ---------- */

export function renderAside(ctx) {
  const { egfr, g, a, flagsList, suggestions, risk } = ctx;
  const grid = KDIGO_GRID.map((row, ri) => `<div class="r">${KDIGO_ROWS[ri]}</div>${row.map((c, ci) => `<div class="cell ${c} ${g && a && g.row === ri && a.col === ci ? "hit" : ""}">●</div>`).join("")}`).join("");
  return `
  <section>
    <h2>Kidney function</h2>
    <div class="egfr-hero">
      <div><div class="value">${egfr.value ?? "—"}</div></div><div class="unit">mL/min/1.73m²</div>
      <div class="stage">${g ? `<b>${g.code}</b><span>${esc(g.label)}</span>` : `<span>Needs creatinine, age, sex</span>`}</div>
    </div>
    ${egfr.source ? `<div class="egfr-note">${egfr.source === "entered" ? "Manually entered eGFR" : "CKD-EPI 2021, creatinine based"}</div>` : ""}
  </section>
  <section>
    <h2>KDIGO risk</h2>
    <div class="kdigo"><div></div><div class="h">A1</div><div class="h">A2</div><div class="h">A3</div>${grid}</div>
    <div class="kdigo-legend"><span><i style="background:#cfe3d7"></i>Low</span><span><i style="background:#f1e1b0"></i>Moderate</span><span><i style="background:#f0c8a3"></i>High</span><span><i style="background:#e9b3a6"></i>Very high</span></div>
    <p class="small" style="margin-top:8px">${g && a ? `<b>${g.code} ${a.code}</b> · ${KDIGO_RISK[risk]}` : `<span class="muted">Needs eGFR and urine ACR.</span>`}</p>
  </section>
  <section>
    <h2>Flagged values <span class="mono">${flagsList.length}</span></h2>
    ${flagsList.length ? `<div class="flag-list">${flagsList.map((f) => `<div class="flag-row"><span>${esc(f.measure.label)}</span><span class="v">${f.value} ${esc(f.measure.unit)}</span><span class="pill ${f.status}">${f.label}</span></div>`).join("")}</div>` : `<div class="empty">All entered values are within range.</div>`}
  </section>
  <section>
    <h2>Suggestions <span class="mono">${suggestions.length}</span></h2>
    ${suggestions.length ? `<div class="flag-list">${suggestions.map((s) => `<div class="flag-row" style="grid-template-columns:1fr"><span>${esc(s.suggestion)}</span></div>`).join("")}</div>` : `<div class="empty">No rule matched yet.</div>`}
  </section>`;
}

/* ---------- Print sheet ---------- */

export function renderPrintSheet(v, settings, ctx) {
  const c = settings.clinic;
  const eg = ctx.egfr;
  const labLine = LABS.filter((m) => v.labs[m.key] !== "" || (m.key === "egfr" && eg.value != null)).map((m) => `${m.label} ${m.key === "egfr" ? eg.value : v.labs[m.key]} ${m.unit}`).join(" · ");
  return `<div class="sheet">
    <div class="sheet-head"><div class="doc"><h1>${esc(c.doctor || "Doctor")}</h1><small>${esc(c.qualifications || "")}</small><small>${esc(c.regNo ? "Reg. " + c.regNo : "")}</small></div>
      <div style="text-align:right"><b>${esc(c.clinic || "")}</b><br><small>${esc(c.address || "")}</small><br><small>${esc(c.phone || "")}</small></div></div>
    <div class="sheet-patient"><div><span>Patient</span><br><b>${esc(v.patient.name)}</b></div><div><span>Age / Sex</span><br>${esc(v.patient.age)} y · ${esc(v.patient.sex)}</div><div><span>Visit</span><br>${esc(v.id || "unsaved")}</div><div><span>Date</span><br>${new Date().toLocaleDateString()}</div></div>
    ${ctx.g ? `<h2>Assessment</h2><p>eGFR ${eg.value} (${ctx.g.code}${ctx.a ? ` ${ctx.a.code}` : ""}). ${ctx.suggestions.map((s) => s.suggestion).join("; ")}</p>` : ""}
    ${labLine ? `<p style="font-size:12px;color:#444">${esc(labLine)}</p>` : ""}
    ${v.assessment.doctorNotes ? `<h2>Clinical note</h2><p style="white-space:pre-wrap">${esc(v.assessment.doctorNotes)}</p>` : ""}
    <div class="rx-symbol">℞</div>
    <table><thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>
      ${v.prescription.items.map((it, i) => `<tr><td>${i + 1}</td><td><b>${esc(it.name)}</b><br><small>${esc(it.composition || "")}</small></td><td>${esc(it.dose)}</td><td>${esc(it.frequency)}</td><td>${esc(it.duration)}</td><td>${esc(it.instructions)}</td></tr>`).join("") || `<tr><td colspan="6">No medicines prescribed.</td></tr>`}
    </tbody></table>
    ${v.prescription.advice ? `<h2>Advice</h2><p style="white-space:pre-wrap">${esc(v.prescription.advice)}</p>` : ""}
    ${v.prescription.followUp ? `<h2>Follow-up</h2><p style="white-space:pre-wrap">${esc(v.prescription.followUp)}</p>` : ""}
    ${(v.assessment.patientExplanation || ctx.explanation) ? `<h2>For the patient</h2><p style="white-space:pre-wrap">${esc(v.assessment.patientExplanation || ctx.explanation)}</p>` : ""}
    <div class="sheet-foot"><div>Generated by NephroCare Pro</div><div class="sign">Signature</div></div>
  </div>`;
}
