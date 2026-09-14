# NephroCare Pro

Nephrology visit workspace with built-in decision support. Runs entirely in the browser with no backend;
visits and settings are stored on the device.

**Live:** https://nephrocare-pro.vercel.app

## What it does

- Seven-step visit workflow: patient, history and symptoms, vitals, laboratory, ultrasound, assessment, prescription.
- eGFR calculated automatically with the CKD-EPI 2021 creatinine equation from creatinine, age and sex (manual override allowed).
- KDIGO GFR × albuminuria risk grid with the patient's cell highlighted, updated live as values are typed.
- Every lab, urine and vital sign shows its reference range as a bar with a Low / Normal / High status.
- Rule engine (threshold and pattern rules) suggests diagnoses with the evidence that triggered each one.
- Plain-language explanation generated for the patient, editable, printed on the prescription sheet.
- Medicine search over a 124-drug formulary plus suggestions grouped by indication; printable prescription with clinic header.
- Saved visits table with KDIGO stage and flag count; open, copy, print or delete a visit.
- Settings for clinic details, reference ranges and diagnosis rules (add or delete, with an audit reason).

## Structure

```
index.html        app shell
css/app.css       design tokens and all styles (IBM Plex Sans / Mono, warm paper palette)
js/app.js         controller: routing, events, live assessment
js/views.js       HTML renderers for every screen
js/clinical.js    reference ranges, CKD-EPI 2021, KDIGO categories, rules, patient text
js/store.js       localStorage persistence
data/medicines.json
```

No build step. Serve the folder with any static server, for example `npx serve .`.

Decision support only. Clinical judgement remains with the treating doctor.
