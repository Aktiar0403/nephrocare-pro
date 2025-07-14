console.log("NephroCare Pro App Loaded.");
console.log("NephroCare Pro App Loaded.");

const buttons = document.querySelectorAll('.accordion-button');

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
  // For now, we just show placeholder text.
  // Later, we'll add real logic here!
  document.getElementById('doctor-diagnosis').value = 
    "Diagnosis: Chronic Kidney Disease Stage 3b with moderate proteinuria. Recommend BP control, ACEi/ARB, nephrology referral.";
  
  document.getElementById('patient-diagnosis').value = 
    "Your kidneys are not working as well as they should (Stage 3). We suggest controlling blood pressure carefully and seeing a kidney specialist.";
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
        ${Object.entries(visit.medicalHistory).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}
      </ul>
    </section>

    <section>
      <h4>🩹 Symptoms</h4>
      <ul>
        ${Object.entries(visit.symptoms).filter(([k,v]) => v).map(([key]) => `<li>${key}</li>`).join('') || '<li>None reported</li>'}
      </ul>
    </section>

    <section>
      <h4>🩸 Vital Signs</h4>
      <ul>
        <li>SBP: ${visit.vitalSigns.sbp} mmHg</li>
        <li>DBP: ${visit.vitalSigns.dbp} mmHg</li>
        <li>Weight: ${visit.vitalSigns.weight} kg</li>
        <li>Volume Status: ${visit.vitalSigns.volumeStatus}</li>
      </ul>
    </section>

    <section>
      <h4>🧪 Blood Tests</h4>
      <ul>
        ${Object.entries(visit.bloodTests).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}
      </ul>
    </section>

    <section>
      <h4>💧 Urine Tests</h4>
      <ul>
        ${Object.entries(visit.urineTests).map(([key, value]) => `<li>${key}: ${value}</li>`).join('')}
      </ul>
    </section>

    <section>
      <h4>🖼️ Ultrasound Report</h4>
      <ul>
        <li>Kidney Size: ${visit.ultrasoundReport.kidneySize}</li>
        <li>Echogenicity: ${visit.ultrasoundReport.echogenicity}</li>
        <li>Parenchymal Thickness: ${visit.ultrasoundReport.parenchymalThickness}</li>
        <li>Hydronephrosis: ${visit.ultrasoundReport.hydronephrosis}</li>
        <li>Stones: ${visit.ultrasoundReport.stones}</li>
        <li>Cysts: ${visit.ultrasoundReport.cysts}</li>
        <li>Other Findings: ${visit.ultrasoundReport.otherFindings.join(', ') || 'None'}</li>
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
        <li><strong>Medicine:</strong> ${visit.prescription.medicineName}</li>
        <li><strong>Dose:</strong> ${visit.prescription.dose}</li>
        <li><strong>Doctor Notes:</strong> ${visit.prescription.notes}</li>
        <li><strong>Patient Instructions:</strong> ${visit.prescription.patientInstructions}</li>
      </ul>
    </section>
  `;
}



// Call on page load
window.addEventListener('load', loadSavedVisits);
