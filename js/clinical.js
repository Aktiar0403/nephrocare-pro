// Clinical logic: reference ranges, eGFR (CKD-EPI 2021), KDIGO staging,
// rule evaluation, flags and plain-language patient text.

export const LABS = [
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", min: 0.6, max: 1.3, step: 0.01, plain: "creatinine, a waste product the kidneys clear" },
  { key: "egfr", label: "eGFR", unit: "mL/min/1.73m²", min: 90, max: 200, step: 1, plain: "kidney filtration rate (eGFR)", computed: true },
  { key: "urea", label: "Urea", unit: "mg/dL", min: 10, max: 50, step: 1, plain: "urea, a waste product" },
  { key: "potassium", label: "Potassium", unit: "mEq/L", min: 3.5, max: 5.2, step: 0.1, plain: "potassium" },
  { key: "sodium", label: "Sodium", unit: "mEq/L", min: 135, max: 145, step: 1, plain: "sodium (salt balance)" },
  { key: "calcium", label: "Calcium", unit: "mg/dL", min: 8.5, max: 10.5, step: 0.1, plain: "calcium" },
  { key: "phosphate", label: "Phosphate", unit: "mg/dL", min: 2.5, max: 4.5, step: 0.1, plain: "phosphate" },
  { key: "bicarbonate", label: "Bicarbonate", unit: "mEq/L", min: 22, max: 28, step: 0.1, plain: "bicarbonate (acid balance)" },
  { key: "hemoglobin", label: "Haemoglobin", unit: "g/dL", min: 12, max: 16, step: 0.1, plain: "haemoglobin (blood count)" },
  { key: "albumin", label: "Albumin", unit: "g/dL", min: 3.5, max: 5.5, step: 0.1, plain: "albumin (blood protein)" },
  { key: "pth", label: "PTH", unit: "pg/mL", min: 10, max: 65, step: 1, plain: "parathyroid hormone" },
  { key: "hba1c", label: "HbA1c", unit: "%", min: 4, max: 5.7, step: 0.1, plain: "3-month sugar average (HbA1c)" },
];

export const URINE = [
  { key: "acr", label: "Albumin / creatinine ratio", unit: "mg/g", min: 0, max: 30, step: 1, plain: "albumin leaking into urine (ACR)" },
  { key: "pcr", label: "Protein / creatinine ratio", unit: "mg/g", min: 0, max: 150, step: 1, plain: "protein leaking into urine (PCR)" },
  { key: "protein24", label: "24-hour protein", unit: "g/day", min: 0, max: 0.15, step: 0.01, plain: "protein in a full day of urine" },
];

export const VITALS = [
  { key: "sbp", label: "Systolic BP", unit: "mmHg", min: 90, max: 140, step: 1, plain: "upper blood pressure" },
  { key: "dbp", label: "Diastolic BP", unit: "mmHg", min: 60, max: 90, step: 1, plain: "lower blood pressure" },
  { key: "weight", label: "Weight", unit: "kg", min: 30, max: 200, step: 0.1, plain: "weight" },
  { key: "height", label: "Height", unit: "cm", min: 100, max: 220, step: 1, plain: "height" },
];

export const ALL_MEASURES = [...LABS, ...URINE, ...VITALS];

export function defaultRanges() {
  const r = {};
  for (const m of ALL_MEASURES) r[m.key] = { min: m.min, max: m.max };
  return r;
}

export const DEFAULT_RULES = [
  { id: "ckd-g2", type: "simple", section: "labs", field: "egfr", operator: "<", value: 90, suggestion: "Mildly reduced GFR (G2)", reason: "KDIGO GFR category G2 (60–89)." },
  { id: "ckd-g3", type: "simple", section: "labs", field: "egfr", operator: "<", value: 60, suggestion: "CKD stage 3 (G3a/G3b)", reason: "eGFR below 60 for a sustained period defines CKD." },
  { id: "ckd-g4", type: "simple", section: "labs", field: "egfr", operator: "<", value: 30, suggestion: "CKD stage 4 (G4)", reason: "Severely reduced GFR; plan for kidney replacement therapy education." },
  { id: "ckd-g5", type: "simple", section: "labs", field: "egfr", operator: "<", value: 15, suggestion: "Kidney failure (G5)", reason: "eGFR below 15 indicates kidney failure." },
  { id: "microalb", type: "simple", section: "urine", field: "acr", operator: ">", value: 30, suggestion: "Moderately increased albuminuria (A2)", reason: "ACR 30–300 mg/g indicates early kidney damage." },
  { id: "nephrotic", type: "simple", section: "urine", field: "acr", operator: ">", value: 300, suggestion: "Severely increased albuminuria (A3)", reason: "ACR above 300 mg/g suggests significant glomerular disease." },
  { id: "hyperk", type: "simple", section: "labs", field: "potassium", operator: ">", value: 5.5, suggestion: "Hyperkalaemia", reason: "Review RAAS blockers and dietary potassium; repeat urgently if above 6." },
  { id: "acidosis", type: "simple", section: "labs", field: "bicarbonate", operator: "<", value: 22, suggestion: "Metabolic acidosis", reason: "Consider oral bicarbonate supplementation in CKD." },
  { id: "anaemia", type: "simple", section: "labs", field: "hemoglobin", operator: "<", value: 11, suggestion: "Anaemia of CKD", reason: "Check iron studies before ESA therapy." },
  { id: "hyperphos", type: "simple", section: "labs", field: "phosphate", operator: ">", value: 4.5, suggestion: "Hyperphosphataemia", reason: "Dietary phosphate restriction; consider phosphate binder." },
  { id: "shpt", type: "simple", section: "labs", field: "pth", operator: ">", value: 65, suggestion: "Secondary hyperparathyroidism", reason: "Assess calcium, phosphate and vitamin D." },
  {
    id: "proteinuric-ckd", type: "compound",
    conditions: [
      { section: "labs", field: "egfr", operator: "<", value: 60 },
      { section: "urine", field: "acr", operator: ">", value: 300 },
    ],
    suggestion: "Proteinuric CKD", reason: "Reduced eGFR with heavy albuminuria; maximise RAAS blockade and SGLT2 inhibition.",
  },
  {
    id: "diabetic-nephropathy", type: "compound",
    conditions: [
      { section: "history", field: "diabetes", operator: "==", value: true },
      { section: "labs", field: "egfr", operator: "<", value: 60 },
      { section: "urine", field: "acr", operator: ">", value: 300 },
      { section: "imaging", field: "echogenicity", operator: "in", value: ["Mildly increased", "Markedly increased"] },
    ],
    suggestion: "Likely diabetic kidney disease", reason: "Diabetes with reduced eGFR, albuminuria and increased cortical echogenicity.",
  },
  {
    id: "htn-nephrosclerosis", type: "compound",
    conditions: [
      { section: "history", field: "hypertension", operator: "==", value: true },
      { section: "labs", field: "egfr", operator: "<", value: 60 },
      { section: "urine", field: "acr", operator: "<", value: 300 },
      { section: "imaging", field: "kidneySize", operator: "==", value: "Decreased" },
    ],
    suggestion: "Possible hypertensive nephrosclerosis", reason: "Long-standing hypertension with small kidneys and low-grade proteinuria.",
  },
  {
    id: "obstruction", type: "compound",
    conditions: [{ section: "imaging", field: "hydronephrosis", operator: "in", value: ["Moderate", "Severe"] }],
    suggestion: "Obstructive uropathy", reason: "Moderate or severe hydronephrosis warrants urology review.",
  },
  {
    id: "adpkd", type: "compound",
    conditions: [
      { section: "imaging", field: "cysts", operator: "==", value: "Multiple bilateral" },
      { section: "imaging", field: "kidneySize", operator: "==", value: "Increased" },
    ],
    suggestion: "Consider polycystic kidney disease", reason: "Bilateral multiple cysts with enlarged kidneys.",
  },
];

/** CKD-EPI 2021 race-free creatinine equation. */
export function ckdEpi2021(creatinine, age, sex) {
  const scr = Number(creatinine);
  const a = Number(age);
  if (!scr || !a || !sex) return null;
  const female = sex === "Female";
  const k = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const ratio = scr / k;
  let egfr = 142 * Math.pow(Math.min(ratio, 1), alpha) * Math.pow(Math.max(ratio, 1), -1.2) * Math.pow(0.9938, a);
  if (female) egfr *= 1.012;
  return Math.round(egfr);
}

export function gfrCategory(egfr) {
  if (egfr == null || isNaN(egfr)) return null;
  if (egfr >= 90) return { code: "G1", label: "Normal or high", row: 0 };
  if (egfr >= 60) return { code: "G2", label: "Mildly decreased", row: 1 };
  if (egfr >= 45) return { code: "G3a", label: "Mildly to moderately decreased", row: 2 };
  if (egfr >= 30) return { code: "G3b", label: "Moderately to severely decreased", row: 3 };
  if (egfr >= 15) return { code: "G4", label: "Severely decreased", row: 4 };
  return { code: "G5", label: "Kidney failure", row: 5 };
}

export function albuminuriaCategory(acr) {
  if (acr == null || acr === "" || isNaN(acr)) return null;
  const v = Number(acr);
  if (v < 30) return { code: "A1", label: "Normal to mildly increased", col: 0 };
  if (v <= 300) return { code: "A2", label: "Moderately increased", col: 1 };
  return { code: "A3", label: "Severely increased", col: 2 };
}

/** KDIGO heat map: rows G1..G5, cols A1..A3. g=green y=yellow o=orange r=red */
export const KDIGO_GRID = [
  ["g", "y", "o"],
  ["g", "y", "o"],
  ["y", "o", "r"],
  ["o", "r", "r"],
  ["r", "r", "r"],
  ["r", "r", "r"],
];
export const KDIGO_ROWS = ["G1", "G2", "G3a", "G3b", "G4", "G5"];
export const KDIGO_RISK = { g: "Low risk", y: "Moderately increased risk", o: "High risk", r: "Very high risk" };

/** Status of a value against a range: ok | warn | crit | null */
export function status(value, range, measure) {
  if (value === "" || value == null || isNaN(value)) return null;
  const v = Number(value);
  const { min, max } = range;
  if (v >= min && v <= max) return "ok";
  // "crit" when more than 25% outside the band (or specific clinical thresholds).
  const span = Math.max(max - min, 1e-9);
  const dist = v < min ? (min - v) / span : (v - max) / span;
  if (measure?.key === "potassium" && (v >= 6 || v < 3)) return "crit";
  if (measure?.key === "egfr" && v < 30) return "crit";
  return dist > 0.25 ? "crit" : "warn";
}

export function statusLabel(s, v, range) {
  if (!s) return "";
  if (s === "ok") return "Normal";
  return Number(v) < range.min ? "Low" : "High";
}

function getField(visit, section, field) {
  const s = visit[section];
  if (!s) return undefined;
  return s[field];
}

export function evaluateCondition(c, visit) {
  const val = getField(visit, c.section, c.field);
  if (val === undefined || val === "" || val === null) return false;
  switch (c.operator) {
    case "<": return Number(val) < Number(c.value);
    case ">": return Number(val) > Number(c.value);
    case "<=": return Number(val) <= Number(c.value);
    case ">=": return Number(val) >= Number(c.value);
    case "==": return String(val) === String(c.value);
    case "in": return Array.isArray(c.value) && c.value.includes(val);
    default: return false;
  }
}

export function evaluateRule(rule, visit) {
  const conds = rule.type === "simple"
    ? [{ section: rule.section || "labs", field: rule.field, operator: rule.operator, value: rule.value }]
    : rule.conditions || [];
  if (!conds.length) return null;
  if (!conds.every((c) => evaluateCondition(c, visit))) return null;
  const evidence = conds.map((c) => {
    const v = getField(visit, c.section, c.field);
    return `${c.field} ${c.operator} ${Array.isArray(c.value) ? c.value.join("/") : c.value} (${v === true ? "yes" : v})`;
  });
  return { ...rule, evidence };
}

/** Collapse stacked CKD stage rules so only the most specific stage shows. */
export function matchedSuggestions(rules, visit) {
  const hits = rules.map((r) => evaluateRule(r, visit)).filter(Boolean);
  const stageIds = ["ckd-g5", "ckd-g4", "ckd-g3", "ckd-g2"];
  const bestStage = stageIds.find((id) => hits.some((h) => h.id === id));
  const albIds = ["nephrotic", "microalb"];
  const bestAlb = albIds.find((id) => hits.some((h) => h.id === id));
  return hits.filter((h) => {
    if (stageIds.includes(h.id)) return h.id === bestStage;
    if (albIds.includes(h.id)) return h.id === bestAlb;
    return true;
  });
}

/** All out-of-range measured values with their status. */
export function flags(visit, ranges) {
  const out = [];
  const sections = [["labs", LABS], ["urine", URINE], ["vitals", VITALS]];
  for (const [section, measures] of sections) {
    for (const m of measures) {
      const v = visit[section]?.[m.key];
      const range = ranges[m.key] || { min: m.min, max: m.max };
      const s = status(v, range, m);
      if (s && s !== "ok") out.push({ section, measure: m, value: Number(v), status: s, label: statusLabel(s, v, range), range });
    }
  }
  const order = { crit: 0, warn: 1 };
  return out.sort((a, b) => order[a.status] - order[b.status]);
}

export function effectiveEgfr(visit) {
  const manual = visit.labs?.egfrManual;
  if (manual !== "" && manual != null && !isNaN(manual)) return { value: Number(manual), source: "entered" };
  const computed = ckdEpi2021(visit.labs?.creatinine, visit.patient?.age, visit.patient?.sex);
  if (computed != null) return { value: computed, source: "CKD-EPI 2021" };
  return { value: null, source: null };
}

/** Plain-language explanation for the patient. */
export function patientExplanation(visit, ranges, suggestions) {
  const name = visit.patient?.name?.split(" ")[0];
  const lines = [];
  const eg = effectiveEgfr(visit);
  const g = gfrCategory(eg.value);
  const a = albuminuriaCategory(visit.urine?.acr);

  if (g) {
    const pct = Math.min(100, Math.round(eg.value));
    if (g.row === 0) lines.push(`Your kidney filtration (eGFR) is ${eg.value}, which is in the normal range.`);
    else if (g.row === 1) lines.push(`Your kidney filtration (eGFR) is ${eg.value}. This is mildly reduced, which can be normal with age, and is worth keeping an eye on.`);
    else lines.push(`Your kidney filtration (eGFR) is ${eg.value}. Your kidneys are working at roughly ${pct}% of full capacity, which we call stage ${g.code.replace("G", "")} kidney disease.`);
  }
  if (a) {
    if (a.col === 0) lines.push("There is no significant protein leaking into your urine, which is a good sign.");
    else if (a.col === 1) lines.push("A small amount of protein (albumin) is leaking into your urine. This is an early sign that the kidney filters are under strain.");
    else lines.push("A large amount of protein is leaking into your urine. This means the kidney filters are damaged and need treatment to protect them.");
  }
  const f = flags(visit, ranges).filter((x) => !["egfr", "acr", "weight", "height"].includes(x.measure.key));
  for (const x of f.slice(0, 5)) {
    const dir = x.label === "High" ? "higher than normal" : "lower than normal";
    lines.push(`Your ${x.measure.plain} is ${dir} (${x.value} ${x.measure.unit}).`);
  }
  const named = suggestions.filter((s) => !/^(CKD stage|Mildly reduced|Kidney failure|Moderately increased|Severely increased)/.test(s.suggestion));
  if (named.length) lines.push(`Putting this together, the most likely explanation is: ${named.map((s) => s.suggestion.toLowerCase()).join("; ")}.`);
  if (!lines.length) return "Your results look within the normal range. Keep taking care of your blood pressure, sugar and fluids, and come back for your next review.";
  const greeting = name ? `${name}, here is what your results mean in simple words.` : "Here is what your results mean in simple words.";
  return [greeting, ...lines, "Please ask your doctor about anything you do not understand."].join("\n");
}
