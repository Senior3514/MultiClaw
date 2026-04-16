document.querySelectorAll('[data-copy-target]').forEach((button) => {
  button.addEventListener('click', async () => {
    const targetId = button.getAttribute('data-copy-target');
    const target = document.getElementById(targetId);
    if (!target) return;

    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(target.textContent || '');
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy failed';
    }

    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  });
});
