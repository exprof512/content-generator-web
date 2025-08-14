// FAQ modal logic
function openFAQModal() {
  document.getElementById('faq-modal').classList.remove('hidden');
}
function closeFAQModal() {
  document.getElementById('faq-modal').classList.add('hidden');
}

// FAQ models dropdown logic
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('faq-models-toggle');
  const menu = document.getElementById('faq-models-menu');
  if (toggleBtn && menu) {
    toggleBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      menu.classList.toggle('hidden');
      toggleBtn.textContent = menu.classList.contains('hidden') ? 'Показать подробности' : 'Скрыть подробности';
    });
    document.addEventListener('click', function(e) {
      if (!menu.classList.contains('hidden') && !menu.contains(e.target) && e.target !== toggleBtn) {
        menu.classList.add('hidden');
        toggleBtn.textContent = 'Показать подробности';
      }
    });
  }
});