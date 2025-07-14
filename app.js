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
