(function () {
  if (typeof window.jQuery === 'undefined') return;
  var $ = window.jQuery;

  var WORKER_SRC = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  // The menus are 16 pages each; iOS enforces a hard per-tab canvas memory
  // budget, so rendered pages are capped in resolution and released again
  // once they scroll far out of view (the IntersectionObserver below).
  var MAX_CANVAS_WIDTH = 1600;
  var MAX_DPR = 2;

  var modal = document.getElementById('pdfModal');
  var modalBody = modal.querySelector('.modal-body');
  var pagesEl = document.getElementById('pdfModalPages');
  var frame = document.getElementById('pdfModalFrame');

  var loadingTask = null;
  var pdfDoc = null;
  var observer = null;
  var isShown = false;
  // Bumped on every open/close; async callbacks compare their copy against
  // it and bail out if the modal was closed or reopened in the meantime.
  var token = 0;

  function setStatus(msg) {
    pagesEl.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'pdf-status';
    p.textContent = msg;
    pagesEl.appendChild(p);
  }

  function reset() {
    token++;
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (loadingTask) {
      try {
        loadingTask.destroy();
      } catch (e) {}
    }
    loadingTask = null;
    pdfDoc = null;
    pagesEl.innerHTML = '';
    frame.style.display = 'none';
    // 'about:blank', not '', which browsers resolve against the current
    // page URL and would silently reload index.html inside the iframe.
    frame.src = 'about:blank';
  }

  function showIframeFallback(src) {
    pagesEl.innerHTML = '';
    frame.style.display = 'block';
    frame.src = src;
  }

  function releasePage(wrapper) {
    if (wrapper.dataset.state !== 'rendered') return;
    var canvas = wrapper.firstChild;
    if (canvas) {
      // Zeroing the dimensions frees the bitmap immediately on iOS instead
      // of waiting for garbage collection.
      canvas.width = 0;
      canvas.height = 0;
      wrapper.removeChild(canvas);
    }
    wrapper.dataset.state = '';
  }

  function renderPage(wrapper, myToken) {
    if (wrapper.dataset.state) return;
    wrapper.dataset.state = 'rendering';
    var pageNum = parseInt(wrapper.dataset.page, 10);
    pdfDoc
      .getPage(pageNum)
      .then(function (page) {
        if (myToken !== token) return;
        var base = page.getViewport({ scale: 1 });
        // Keep the placeholder's aspect ratio in sync with the real page
        // (placeholders are created with page 1's ratio).
        wrapper.style.paddingBottom = (base.height / base.width) * 100 + '%';
        var cssWidth = wrapper.clientWidth || pagesEl.clientWidth;
        var dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        var pixelWidth = Math.min(cssWidth * dpr, MAX_CANVAS_WIDTH);
        var viewport = page.getViewport({ scale: pixelWidth / base.width });
        var canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        wrapper.appendChild(canvas);
        return page
          .render({ canvasContext: canvas.getContext('2d'), viewport: viewport })
          .promise.then(function () {
            if (myToken === token) wrapper.dataset.state = 'rendered';
          });
      })
      .catch(function () {
        if (myToken === token) wrapper.dataset.state = '';
      });
  }

  function buildPages(myToken) {
    pdfDoc
      .getPage(1)
      .then(function (page) {
        if (myToken !== token) return;
        var base = page.getViewport({ scale: 1 });
        var ratio = (base.height / base.width) * 100;
        pagesEl.innerHTML = '';
        observer = new IntersectionObserver(
          function (entries) {
            if (myToken !== token) return;
            entries.forEach(function (entry) {
              if (entry.isIntersecting) renderPage(entry.target, myToken);
              else releasePage(entry.target);
            });
          },
          // Render pages up to two screens away; release them again once
          // they leave that window, so memory stays bounded on long menus.
          { root: modalBody, rootMargin: '200% 0px' }
        );
        for (var i = 1; i <= pdfDoc.numPages; i++) {
          var wrapper = document.createElement('div');
          wrapper.className = 'pdf-page';
          wrapper.dataset.page = i;
          wrapper.style.paddingBottom = ratio + '%';
          pagesEl.appendChild(wrapper);
          observer.observe(wrapper);
        }
      })
      .catch(function () {
        if (myToken === token) setStatus('Could not display the menu. Please use the Download button above.');
      });
  }

  $(modal).on('show.bs.modal', function (event) {
    var button = event.relatedTarget;
    if (!button) return;
    var src = button.getAttribute('data-pdf-src');
    var title = button.getAttribute('data-pdf-title') || 'Menu';
    document.getElementById('pdfModalLabel').textContent = title;
    document.getElementById('pdfModalDownload').setAttribute('href', src);
    reset();

    if (!window.pdfjsLib || !window.IntersectionObserver) {
      // pdf.js CDN blocked or ancient browser: browser's own viewer.
      showIframeFallback(src);
      return;
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    setStatus('Loading menu…');
    var myToken = token;
    // Start fetching immediately on click; page elements are only built once
    // the modal is visible ('shown'), because widths are 0 before that.
    loadingTask = window.pdfjsLib.getDocument(encodeURI(src));
    loadingTask.onProgress = function (progress) {
      if (myToken !== token || pdfDoc || !progress || !progress.total) return;
      var pct = Math.min(99, Math.round((progress.loaded / progress.total) * 100));
      setStatus('Loading menu… ' + pct + '%');
    };
    loadingTask.promise.then(
      function (pdf) {
        if (myToken !== token) return;
        pdfDoc = pdf;
        if (isShown) buildPages(myToken);
      },
      function () {
        if (myToken !== token) return;
        showIframeFallback(src);
      }
    );
  });

  $(modal).on('shown.bs.modal', function () {
    isShown = true;
    if (pdfDoc) buildPages(token);
  });

  // Clear everything on close so the large PDF stops loading/rendering and
  // its memory is released as soon as the visitor dismisses the modal.
  $(modal).on('hidden.bs.modal', function () {
    isShown = false;
    reset();
  });
})();
