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
