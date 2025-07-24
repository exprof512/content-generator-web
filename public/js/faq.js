// FAQ modal logic
function openFAQModal() {
  document.getElementById('faq-modal').classList.remove('hidden');
}
function closeFAQModal() {
  document.getElementById('faq-modal').classList.add('hidden');
}

// Навешиваем обработчики на все FAQ-кнопки
function setupFAQHandlers() {
  const showFaqBtn = document.getElementById('show-faq-btn');
  showFaqBtn?.addEventListener('click', openFAQModal);
  const inlineFaqBtn = document.getElementById('inline-faq-btn');
  inlineFaqBtn?.addEventListener('click', openFAQModal);
  const faqCloseBtn = document.getElementById('faq-close');
  faqCloseBtn?.addEventListener('click', closeFAQModal);
  // Клик вне модалки
  window.addEventListener('mousedown', (e) => {
    const faqModal = document.getElementById('faq-modal');
    if (faqModal && !faqModal.classList.contains('hidden')) {
      const inner = faqModal.children[0];
      if (inner && !inner.contains(e.target)) closeFAQModal();
    }
  });
  document.getElementById('fixed-faq-btn')?.addEventListener('click', openFAQModal);
  // prompt-helper-buttons
  const promptFaqBtn = document.querySelector('#prompt-helper-buttons #show-faq-btn');
  if (promptFaqBtn) {
    promptFaqBtn.addEventListener('click', openFAQModal);
  }
}

document.addEventListener('DOMContentLoaded', setupFAQHandlers); 