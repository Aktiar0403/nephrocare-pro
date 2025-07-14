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
