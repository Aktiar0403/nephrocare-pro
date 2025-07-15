console.log("NephroCare Pro App Loaded.");
console.log("NephroCare Pro App Loaded.");

const buttons = document.querySelectorAll('.accordion-button');
const bloodTestRanges = {
  creatinine: { min: 0.7, max: 1.2 },
  egfr: { min: 90, max: 150 },
  urea: { min: 7, max: 20 },
  potassium: { min: 3.5, max: 5.0 },
  sodium: { min: 135, max: 145 },
  calcium: { min: 8.5, max: 10.5 },
  phosphate: { min: 2.5, max: 4.5 },
  bicarbonate: { min: 22, max: 28 },
  hemoglobin: { min: 12, max: 16 },
  albumin: { min: 3.5, max: 5.5 },
  pth: { min: 10, max: 65 }
};
const vitalSignsRanges = {
  sbp: { min: 90, max: 140 },  // Normal SBP
  dbp: { min: 60, max: 90 },   // Normal DBP
  weight: { min: 30, max: 200 }  // Approx safe range (can be loose)
};

const urineTestRanges = {
  'spot-protein-creatinine': { max: 150 },   // mg/g
  'acr': { max: 30 },                        // mg/g
  'urine-protein-24h': { max: 0.15 }         // g/day
};
let allThresholds = {
  bloodTests: { ...bloodTestRanges },
  urineTests: { ...urineTestRanges },
  vitalSigns: { ...vitalSignsRanges }
};
function loadCustomThresholds() {
  const saved = localStorage.getItem('nephroThresholds');
  if (saved) {
    allThresholds = JSON.parse(saved);
  }
}

function saveCustomThresholds() {
  localStorage.setItem('nephroThresholds', JSON.stringify(allThresholds));
}
function populateThresholdSettings() {
  const container = document.getElementById('threshold-settings');
  if (!container) return;

  let html = '';

  for (const category in allThresholds) {
    html += `<h5>${category.replace(/([A-Z])/g, ' $1')}</h5>`;
    for (const test in allThresholds[category]) {
      const { min, max } = allThresholds[category][test];
      html += `
        <div>
          <label>${test} Min:</label>
          <input type="number" id="${test}-min" value="${min ?? ''}">
          <label>Max:</label>
          <input type="number" id="${test}-max" value="${max ?? ''}">
        </div>
      `;
    }
  }

  container.innerHTML = html;
}
document.getElementById('save-thresholds').addEventListener('click', () => {
  for (const category in allThresholds) {
    for (const test in allThresholds[category]) {
      const minInput = document.getElementById(`${test}-min`);
      const maxInput = document.getElementById(`${test}-max`);
      allThresholds[category][test].min = minInput ? parseFloat(minInput.value) : undefined;
      allThresholds[category][test].max = maxInput ? parseFloat(maxInput.value) : undefined;
    }
  }

  saveCustomThresholds();
  alert('Thresholds saved! They will now apply to color-coding.');

  // Re-run checks to apply new thresholds immediately
  checkBloodTestRanges();
  checkUrineTestRanges();
  checkVitalSignsRanges();
});

buttons.forEach(button => {
  button.addEventListener('click', () => {
    button.classList.toggle('active');
    const content = button.nextElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
});
document.getElementById('generate-diagnosis').addEventListener('click', () => {
  let doctorNotes = [];
  let patientNotes = [];

  // Blood Tests
  for (const test in allThresholds.bloodTests) {
    const input = document.getElementById(test);
    if (!input || input.value === '') continue;

    const val = parseFloat(input.value);
    if (isNaN(val)) continue;

    const { min, max } = allThresholds.bloodTests[test];
    if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
      doctorNotes.push(`${test}: Abnormal (${val})`);
      patientNotes.push(`Your ${test.replace(/-/g, ' ')} is outside normal range (${val}).`);
    }
  }

  // Urine Tests
  for (const test in allThresholds.urineTests) {
    const input = document.getElementById(test);
    if (!input || input.value === '') continue;

    const val = parseFloat(input.value);
    if (isNaN(val)) continue;

    const { min, max } = allThresholds.urineTests[test];
    if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
      doctorNotes.push(`${test}: Abnormal (${val})`);
      patientNotes.push(`Your ${test.replace(/-/g, ' ')} is higher than normal (${val}).`);
    }
  }

  // Vital Signs
  for (const test in allThresholds.vitalSigns) {
    const input = document.getElementById(test);
    if (!input || input.value === '') continue;

    const val = parseFloat(input.value);
    if (isNaN(val)) continue;

    const { min, max } = allThresholds.vitalSigns[test];
    if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
      doctorNotes.push(`${test}: Abnormal (${val})`);
      patientNotes.push(`Your ${test.toUpperCase()} is outside normal range (${val}).`);
    }
  }

  // Summaries
  if (doctorNotes.length === 0) {
    doctorNotes.push("All tests within normal thresholds.");
  }

  if (patientNotes.length === 0) {
    patientNotes.push("All your test results appear to be within normal range.");
  }

  // Write to textareas
  document.getElementById('doctor-diagnosis').value = doctorNotes.join('\n');
  document.getElementById('patient-diagnosis').value = patientNotes.join('\n');
});

// Placeholder for future saved records logic
console.log("Saved Records section ready.");
// Placeholder for rule saving
document.getElementById('save-rule').addEventListener('click', () => {
  const testName = document.getElementById('test-name').value;
  const operator = document.getElementById('operator').value;
  const threshold = document.getElementById('threshold').value;
  const suggestion = document.getElementById('suggestion').value;
  const reason = document.getElementById('reason').value;

  if (!testName || !operator || !threshold || !suggestion || !reason) {
    alert('Please fill all fields and provide a reason.');
    return;
  }

  alert(`Rule saved!\nTest: ${testName} ${operator} ${threshold}\nSuggestion: ${suggestion}\nReason: ${reason}`);
});
document.getElementById('save-visit').addEventListener('click', () => {
  // Collect patient profile
  const patientProfile = {
    name: document.getElementById('patient-name').value,
    age: document.getElementById('patient-age').value,
    gender: document.getElementById('patient-gender').value,
    location: document.getElementById('patient-location').value
  };

  // Collect medical history
  const medicalHistory = {
    diabetes: document.getElementById('diabetes').checked,
    diabetesDuration: document.getElementById('diabetes-duration').value,
    hypertension: document.getElementById('hypertension').checked,
    hypertensionDuration: document.getElementById('hypertension-duration').value,
    nsaidUse: document.getElementById('nsaid-use').checked,
    pastStoneDisease: document.getElementById('past-stone-disease').checked,
    familyCKD: document.getElementById('family-ckd').checked,
    tb: document.getElementById('tb').checked,
    hiv: document.getElementById('hiv').checked,
    hepatitis: document.getElementById('hepatitis').checked
  };

  // Symptoms
  const symptoms = {
    edema: document.getElementById('edema').checked,
    fatigue: document.getElementById('fatigue').checked,
    nausea: document.getElementById('nausea').checked,
    vomiting: document.getElementById('vomiting').checked,
    breathlessness: document.getElementById('breathlessness').checked,
    decreasedUrineOutput: document.getElementById('decreased-urine-output').checked,
    flankPain: document.getElementById('flank-pain').checked,
    hematuria: document.getElementById('hematuria').checked
  };

  // Vitals
  const vitalSigns = {
    sbp: document.getElementById('sbp').value,
    dbp: document.getElementById('dbp').value,
    weight: document.getElementById('weight').value,
    volumeStatus: document.getElementById('volume-status').value
  };

  // Blood tests
  const bloodTests = {
    creatinine: document.getElementById('creatinine').value,
    egfr: document.getElementById('egfr').value,
    urea: document.getElementById('urea').value,
    potassium: document.getElementById('potassium').value,
    sodium: document.getElementById('sodium').value,
    calcium: document.getElementById('calcium').value,
    phosphate: document.getElementById('phosphate').value,
    bicarbonate: document.getElementById('bicarbonate').value,
    hemoglobin: document.getElementById('hemoglobin').value,
    albumin: document.getElementById('albumin').value,
    pth: document.getElementById('pth').value
  };

  // Urine tests
  const urineTests = {
    urinalysisProtein: document.getElementById('urinalysis-protein').value,
    urinalysisBlood: document.getElementById('urinalysis-blood').value,
    spotProteinCreatinine: document.getElementById('spot-protein-creatinine').value,
    acr: document.getElementById('acr').value,
    urineProtein24h: document.getElementById('urine-protein-24h').value
  };

  // Ultrasound
  const ultrasoundReport = {
    kidneySize: document.getElementById('kidney-size').value,
    echogenicity: document.getElementById('echogenicity').value,
    parenchymalThickness: document.getElementById('parenchymal-thickness').value,
    hydronephrosis: document.getElementById('hydronephrosis').value,
    stones: document.getElementById('stones').value,
    cysts: document.getElementById('cysts').value,
    otherFindings: Array.from(document.querySelectorAll('input[name="other-findings"]:checked')).map(cb => cb.value)
  };

  // Diagnosis
  const diagnosis = {
    doctor: document.getElementById('doctor-diagnosis').value,
    patient: document.getElementById('patient-diagnosis').value
  };

  // Prescription
  const prescription = {
    medicineName: document.getElementById('med-name').value,
    dose: document.getElementById('dose').value,
    notes: document.getElementById('notes').value,
    patientInstructions: document.getElementById('patient-instructions').value
  };

  // Combine all
  const visit = {
    date: new Date().toLocaleString(),
    patientProfile,
    medicalHistory,
    symptoms,
    vitalSigns,
    bloodTests,
    urineTests,
    ultrasoundReport,
    diagnosis,
    prescription
  };

  // Save to LocalStorage
  let visits = JSON.parse(localStorage.getItem('nephroVisits') || '[]');
  visits.push(visit);
  localStorage.setItem('nephroVisits', JSON.stringify(visits));

  alert('Visit saved successfully!');
});
// Load saved records on page load
function loadSavedVisits() {
  const list = document.getElementById('saved-records-list');
  const details = document.getElementById('visit-details');
  if (!list || !details) return;

  const visits = JSON.parse(localStorage.getItem('nephroVisits') || '[]');
  if (visits.length === 0) {
    list.innerHTML = '<li>No saved records yet.</li>';
    details.innerHTML = '';
    return;
  }

  list.innerHTML = '';
  details.innerHTML = '<p>Select a visit above to view details here.</p>';

  visits.forEach((visit, index) => {
  const li = document.createElement('li');
  
  const visitText = document.createElement('span');
  visitText.textContent = `Visit ${index + 1} - ${visit.date}`;
  visitText.style.cursor = 'pointer';
  visitText.style.flex = '1';
  visitText.addEventListener('click', () => {
    displayVisitDetails(visit);
  });

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '🗑️ Delete';
  deleteButton.style.marginLeft = '1rem';
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteVisit(index);
  });

  li.style.display = 'flex';
  li.style.alignItems = 'center';
  li.appendChild(visitText);
  li.appendChild(deleteButton);

  list.appendChild(li);
});
function deleteVisit(index) {
  if (!confirm('Are you sure you want to delete this visit?')) return;

  let visits = JSON.parse(localStorage.getItem('nephroVisits') || '[]');
  visits.splice(index, 1);
  localStorage.setItem('nephroVisits', JSON.stringify(visits));

  loadSavedVisits();

  const details = document.getElementById('visit-details');
  if (details) {
    details.innerHTML = '<p>Select a visit above to view details here.</p>';
  }

  alert('Visit deleted successfully!');
}

}
function displayVisitDetails(visit) {
  const details = document.getElementById('visit-details');
  if (!details) return;

  details.innerHTML = `
    <h3>Visit on ${visit.date}</h3>

    <section>
      <h4>👤 Patient Profile</h4>
      <ul>
        <li><strong>Name:</strong> ${visit.patientProfile.name}</li>
        <li><strong>Age:</strong> ${visit.patientProfile.age}</li>
        <li><strong>Gender:</strong> ${visit.patientProfile.gender}</li>
        <li><strong>Location:</strong> ${visit.patientProfile.location}</li>
      </ul>
    </section>

<section>
  <h4>🩺 Medical History</h4>
  <ul>
  ${Object.entries(visit.medicalHistory)
    .map(([key, value]) => `<li>${formatKey(key)}: ${value === true ? 'Yes' : value === false ? 'No' : value}</li>`)
    .join('')}
</ul>

</section>

<section>
  <h4>🩹 Symptoms</h4>
  <ul>
  ${Object.entries(visit.symptoms)
    .filter(([k, v]) => v)
    .map(([key]) => `<li>${formatKey(key)}</li>`)
    .join('') || '<li>None reported</li>'}
</ul>

</section>

   <section>
  <h4>🩸 Vital Signs</h4>
  <ul>
    ${visit.vitalSigns.sbp ? `<li>SBP: ${visit.vitalSigns.sbp} mmHg</li>` : ''}
    ${visit.vitalSigns.dbp ? `<li>DBP: ${visit.vitalSigns.dbp} mmHg</li>` : ''}
    ${visit.vitalSigns.weight ? `<li>Weight: ${visit.vitalSigns.weight} kg</li>` : ''}
    ${visit.vitalSigns.volumeStatus ? `<li>Volume Status: ${visit.vitalSigns.volumeStatus}</li>` : ''}
  </ul>
</section>


    <section>
      <h4>🧪 Blood Tests</h4>
      <ul>
  ${Object.entries(visit.bloodTests)
    .map(([key, value]) => `<li>${formatKey(key)}: ${value}</li>`)
    .join('')}
</ul>

    </section>

    <section>
      <h4>💧 Urine Tests</h4>
      <ul>
  ${Object.entries(visit.urineTests)
    .map(([key, value]) => `<li>${formatKey(key)}: ${value}</li>`)
    .join('')}
</ul>

    </section>

    <section>
  <h4>🖼️ Ultrasound Report</h4>
  <ul>
    ${Object.entries(visit.ultrasoundReport)
      .map(([key, value]) => `<li>${formatKey(key)}: ${Array.isArray(value) ? value.join(', ') || 'None' : value}</li>`)
      .join('')}
  </ul>
</section>

    <section>
      <h4>🧭 AI Diagnosis</h4>
      <p><strong>Doctor-level:</strong> ${visit.diagnosis.doctor}</p>
      <p><strong>Patient-friendly:</strong> ${visit.diagnosis.patient}</p>
    </section>

   <section>
  <h4>💊 Prescription</h4>
  <ul>
    ${Object.entries(visit.prescription)
      .map(([key, value]) => `<li>${formatKey(key)}: ${value}</li>`)
      .join('')}
  </ul>
</section>

  `;
}
function checkBloodTestRanges() {
  Object.keys(allThresholds.bloodTests).forEach(test => {
    const input = document.getElementById(test);
    if (!input) return;

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      if (isNaN(val)) {
        input.style.backgroundColor = '';
        return;
      }

      const { min, max } = allThresholds.bloodTests[test];
      if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
        input.style.backgroundColor = '#ffcccc';
      } else {
        input.style.backgroundColor = '#ccffcc';
      }
    });
  });
}

// Accordion toggle logic
document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const content = header.nextElementSibling;

    // Toggle active on header (optional styling)
    header.classList.toggle('active');

    // Toggle active on content to show/hide
    if (content.classList.contains('active')) {
      content.classList.remove('active');
    } else {
      content.classList.add('active');
    }
  });
});

// Call on page load
window.addEventListener('load', () => {
  loadSavedVisits();
  checkBloodTestRanges();
});
function checkUrineTestRanges() {
  Object.keys(allThresholds.urineTests).forEach(test => {
    const input = document.getElementById(test);
    if (!input) return;

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      if (isNaN(val)) {
        input.style.backgroundColor = '';
        return;
      }

      const { min, max } = allThresholds.urineTests[test];
      if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
        input.style.backgroundColor = '#ffcccc';
      } else {
        input.style.backgroundColor = '#ccffcc';
      }
    });
  });
}

function checkVitalSignsRanges() {
  Object.keys(allThresholds.vitalSigns).forEach(test => {
    const input = document.getElementById(test);
    if (!input) return;

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      if (isNaN(val)) {
        input.style.backgroundColor = '';
        return;
      }

      const { min, max } = allThresholds.vitalSigns[test];
      if ((min !== undefined && val < min) || (max !== undefined && val > max)) {
        input.style.backgroundColor = '#ffcccc';
      } else {
        input.style.backgroundColor = '#ccffcc';
      }
    });
  });
}




// Call on page load
window.addEventListener('load', () => {
  loadSavedVisits();
  checkBloodTestRanges();
  checkUrineTestRanges();
  checkVitalSignsRanges();
});

// Show Export button
const exportButton = document.getElementById('export-button');
const exportText = document.getElementById('export-text');
if (exportButton && exportText) {
  exportButton.style.display = 'block';
  exportText.style.display = 'none';  // Hide text initially

  exportButton.onclick = () => {
    const exportData = `
Visit Date: ${visit.date}

👤 Patient Profile
${formatObject(visit.patientProfile)}

🩺 Medical History
${formatObject(visit.medicalHistory)}

🩹 Symptoms
${formatObject(visit.symptoms)}

🩸 Vital Signs
${formatObject(visit.vitalSigns)}

🧪 Blood Tests
${formatObject(visit.bloodTests)}

💧 Urine Tests
${formatObject(visit.urineTests)}

🖼️ Ultrasound Report
${formatObject(visit.ultrasoundReport)}

🧭 AI Diagnosis
Doctor Interpretation:
${visit.diagnosis.doctor}

Patient-Friendly Explanation:
${visit.diagnosis.patient}

💊 Prescription
${formatObject(visit.prescription)}
    `.trim();

    exportText.value = exportData;
    exportText.style.display = 'block';
    exportButton.textContent = '✅ Copy to Clipboard';

    exportButton.onclick = () => {
      navigator.clipboard.writeText(exportData).then(() => {
        alert('Visit summary copied to clipboard!');
      });
    };
  };
}

function formatObject(obj) {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
      if (typeof value === 'object') return `${key}: ${JSON.stringify(value)}`;
      return `${key}: ${value}`;
    })
    .join('\n');
}
function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, c => c.toUpperCase());
}
