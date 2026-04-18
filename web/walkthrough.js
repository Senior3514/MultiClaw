document.querySelectorAll('[data-copy-target]').forEach((button) => {
  button.addEventListener('click', async () => {
    const targetId = button.getAttribute('data-copy-target');
    const target = document.getElementById(targetId);
    if (!target) return;

    const original = button.textContent;
    const text = target.textContent || '';

    const fallbackCopyText = (value) => {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }

      document.body.removeChild(textarea);
      return copied;
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (!fallbackCopyText(text)) {
        throw new Error('clipboard unavailable');
      }
      button.textContent = 'Copied';
    } catch {
      button.textContent = fallbackCopyText(text) ? 'Copied' : 'Copy failed';
    }

    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  });
});
