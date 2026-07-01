(function () {
  if (typeof window.jQuery === 'undefined') return;
  var $ = window.jQuery;

  $('#pdfModal').on('show.bs.modal', function (event) {
    var button = event.relatedTarget;
    if (!button) return;
    var src = button.getAttribute('data-pdf-src');
    var title = button.getAttribute('data-pdf-title') || 'Menu';
    document.getElementById('pdfModalLabel').textContent = title;
    document.getElementById('pdfModalFrame').src = src;
    document.getElementById('pdfModalDownload').setAttribute('href', src);
  });

  // Lazily set the iframe src only once the modal is actually opened, and
  // clear it on close, so the large PDF isn't fetched until the visitor
  // asks to view it, and stops loading once they dismiss the modal.
  $('#pdfModal').on('hidden.bs.modal', function () {
    // 'about:blank', not '', which browsers resolve against the current
    // page URL and would silently reload index.html inside the iframe.
    document.getElementById('pdfModalFrame').src = 'about:blank';
  });
})();
