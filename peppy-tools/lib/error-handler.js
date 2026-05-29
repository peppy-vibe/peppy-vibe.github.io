/* Global error handler — shows uncaught errors in a transient toast */
(function () {
  function showErrorToast(msg) {
    var el = document.getElementById('_err-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = '_err-toast';
      el.style.cssText =
        'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);' +
        'background:#d32f2f;color:#fff;padding:8px 18px;border-radius:8px;' +
        'font-size:13px;z-index:99999;max-width:90vw;word-break:break-word;' +
        'box-shadow:0 2px 8px rgba(0,0,0,.3);opacity:0;transition:opacity .3s';
      document.body.appendChild(el);
    }
    el.textContent = '\u26a0 ' + msg;
    el.style.opacity = '1';
    clearTimeout(el._timer);
    el._timer = setTimeout(function () { el.style.opacity = '0'; }, 5000);
  }

  window.addEventListener('error', function (e) {
    console.error('[Peppy] Uncaught error:', e.error || e.message);
    showErrorToast(e.message || 'An unexpected error occurred');
  });

  window.addEventListener('unhandledrejection', function (e) {
    var msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    console.error('[Peppy] Unhandled rejection:', e.reason);
    showErrorToast(msg || 'An unexpected error occurred');
  });
})();
