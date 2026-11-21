/* Auto-generated runtime for static docs/index.html — Single Source of Truth: src/app/page.tsx */
(function () {
  var rawConfig = document.body.getAttribute('data-landing-config') || '{}';
  var config = { treatments: [], testimonials: [], appointmentCta: {} };
  try {
    config = JSON.parse(rawConfig);
  } catch (e) {}

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  var progressBar = document.querySelector('[aria-hidden="true"].fixed.top-0 div');
  var header = document.querySelector('header');
  var backToTop = document.querySelector('button[aria-label="Kembali ke atas"]');

  function onScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (header) {
      if (scrollTop > 36) {
        header.classList.remove('py-5', 'px-4', 'sm:px-8');
        header.classList.add('py-3', 'px-4', 'sm:px-6');
      } else {
        header.classList.remove('py-3', 'px-4', 'sm:px-6');
        header.classList.add('py-5', 'px-4', 'sm:px-8');
      }
    }
    if (backToTop) {
      if (scrollTop > 420) {
        backToTop.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
        backToTop.classList.add('opacity-100', 'translate-y-0');
      } else {
        backToTop.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
        backToTop.classList.remove('opacity-100', 'translate-y-0');
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  var openMenuBtn = document.querySelector('button[aria-label="Buka Menu"]');
  if (openMenuBtn) {
    var drawer = null;
    openMenuBtn.addEventListener('click', function () {
      if (drawer) {
        drawer.remove();
        drawer = null;
        return;
      }
      drawer = el('div', 'fixed inset-0 z-50 bg-[#163224]/70 backdrop-blur-sm flex justify-end lg:hidden');
      var panel = el('div', 'w-72 max-w-[85vw] bg-[#FAF6EE] h-full p-6 flex flex-col justify-between shadow-2xl border-l border-[#DFD4C0]');
      var topWrap = el('div', 'space-y-4');
      var headRow = el('div', 'flex items-center justify-between border-b border-[#DFD4C0] pb-4');
      headRow.appendChild(el('span', 'font-editorial text-lg font-semibold text-[#234B38]', config.brandName || 'Yovela Dental'));
      var closeBtn = el('button', 'w-9 h-9 rounded-full bg-[#F3EBDD] text-[#234B38] font-bold cursor-pointer', '✕');
      closeBtn.type = 'button';
      headRow.appendChild(closeBtn);
      topWrap.appendChild(headRow);

      var nav = el('nav', 'space-y-1');
      (config.navLinks || []).forEach(function (l) {
        var a = el('a', 'block py-3 px-4 rounded-2xl hover:bg-[#F3EBDD] text-[#234B38] font-bold text-sm', l.label);
        a.href = l.href;
        nav.appendChild(a);
      });
      topWrap.appendChild(nav);
      panel.appendChild(topWrap);

      var cta = el('a', 'w-full py-3.5 rounded-full bg-[#234B38] text-[#F3EBDD] text-xs font-bold text-center', 'Book Appointment');
      cta.href = '#appointment';
      panel.appendChild(cta);
      drawer.appendChild(panel);

      drawer.addEventListener('click', function (ev) {
        if (ev.target === drawer || ev.target === closeBtn || ev.target.tagName === 'A') {
          drawer.remove();
          drawer = null;
        }
      });
      document.body.appendChild(drawer);
    });
  }

  var treatmentButtons = document.querySelectorAll('#treatments article button');
  treatmentButtons.forEach(function (btn, idx) {
    btn.addEventListener('click', function () {
      var item = (config.treatments || [])[idx];
      if (!item) return;
      var overlay = el('div', 'fixed inset-0 z-50 bg-[#163224]/70 backdrop-blur-sm flex items-center justify-center p-4');
      var card = el('div', 'bg-[#FAF6EE] text-[#234B38] border border-[#DFD4C0] rounded-[32px] max-w-lg w-full p-7 sm:p-8 shadow-2xl space-y-5');

      var headerRow = el('div', 'flex items-start justify-between gap-4 border-b border-[#DFD4C0] pb-4');
      var titleCol = el('div', '');
      titleCol.appendChild(el('span', 'px-3 py-1 rounded-full bg-[#F3EBDD] border border-[#DFD4C0] text-[10px] font-bold uppercase tracking-wider text-[#E65B45]', item.category));
      titleCol.appendChild(el('h3', 'font-editorial text-2xl sm:text-3xl font-semibold mt-2 leading-tight', item.title));
      headerRow.appendChild(titleCol);

      var closeModalBtn = el('button', 'w-9 h-9 rounded-full bg-[#F3EBDD] text-[#234B38] flex items-center justify-center cursor-pointer shrink-0 font-bold', '✕');
      closeModalBtn.type = 'button';
      closeModalBtn.setAttribute('aria-label', 'Tutup detail layanan');
      headerRow.appendChild(closeModalBtn);
      card.appendChild(headerRow);

      card.appendChild(el('p', 'text-xs sm:text-sm text-[#4A6B5B] leading-relaxed', item.description));

      var hlBox = el('div', 'space-y-2 bg-[#F3EBDD] border border-[#DFD4C0] rounded-2xl p-4');
      (item.highlights || []).forEach(function (h) {
        var row = el('div', 'flex items-center gap-2 text-xs font-semibold text-[#234B38]');
        row.appendChild(el('span', 'w-2 h-2 rounded-full bg-[#E65B45] shrink-0'));
        row.appendChild(el('span', '', h));
        hlBox.appendChild(row);
      });
      card.appendChild(hlBox);

      var foot = el('div', 'flex items-center justify-between gap-3 pt-2');
      var priceWrap = el('div', '');
      priceWrap.appendChild(el('span', 'block text-[10px] text-[#4A6B5B]', 'Estimasi Durasi & Biaya'));
      priceWrap.appendChild(el('strong', 'text-sm font-extrabold text-[#234B38]', item.duration + ' • ' + item.priceLabel));
      foot.appendChild(priceWrap);

      var bookBtn = el('a', 'px-5 py-3 rounded-full bg-[#E65B45] hover:bg-[#CC4631] text-[#FAF6EE] text-xs font-bold transition', 'Book Treatment');
      bookBtn.href = '#appointment';
      foot.appendChild(bookBtn);
      card.appendChild(foot);

      overlay.appendChild(card);
      overlay.addEventListener('click', function (ev) {
        if (ev.target === overlay || ev.target === closeModalBtn || ev.target === bookBtn) {
          overlay.remove();
        }
      });
      document.body.appendChild(overlay);
    });
  });

  var prevTestiBtn = document.querySelector('button[aria-label="Testimoni sebelumnya"]');
  var nextTestiBtn = document.querySelector('button[aria-label="Testimoni berikutnya"]');
  var desktopCards = document.querySelectorAll('.md\\:grid.md\\:grid-cols-3 > div');
  var mobileContainer = document.querySelector('.md\\:hidden > article');
  var activeTestiIdx = 0;

  function renderTestiState() {
    var list = config.testimonials || [];
    if (!list.length) return;
    desktopCards.forEach(function (card, idx) {
      if (idx === activeTestiIdx) {
        card.classList.add('ring-2', 'ring-[#E65B45]', 'rounded-[28px]');
      } else {
        card.classList.remove('ring-2', 'ring-[#E65B45]', 'rounded-[28px]');
      }
    });
    if (mobileContainer && list[activeTestiIdx]) {
      var item = list[activeTestiIdx];
      var quoteEl = mobileContainer.querySelector('p.font-editorial');
      var nameEl = mobileContainer.querySelector('.pt-4 p.font-extrabold');
      var trtEl = mobileContainer.querySelector('.pt-4 p.text-\\[11px\\]');
      if (quoteEl) quoteEl.textContent = '\u201C' + item.quote + '\u201D';
      if (nameEl) nameEl.textContent = item.patientName;
      if (trtEl) trtEl.textContent = item.treatment;
    }
  }
  if (prevTestiBtn) {
    prevTestiBtn.addEventListener('click', function () {
      var len = (config.testimonials || []).length || 1;
      activeTestiIdx = activeTestiIdx === 0 ? len - 1 : activeTestiIdx - 1;
      renderTestiState();
    });
  }
  if (nextTestiBtn) {
    nextTestiBtn.addEventListener('click', function () {
      var len = (config.testimonials || []).length || 1;
      activeTestiIdx = activeTestiIdx === len - 1 ? 0 : activeTestiIdx + 1;
      renderTestiState();
    });
  }

  var bookingForm = document.querySelector('#appointment form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var inputs = bookingForm.querySelectorAll('input, textarea');
      var nameVal = inputs[0] ? inputs[0].value.trim() : '';
      var phoneVal = inputs[1] ? inputs[1].value.trim() : '';
      var dateVal = inputs[2] ? inputs[2].value : '';
      var notesVal = bookingForm.querySelector('textarea') ? bookingForm.querySelector('textarea').value.trim() : '';
      var waNum = (config.appointmentCta && config.appointmentCta.whatsappNumber) || '6281234567890';
      var msg =
        'Halo Yovela Dental Clinic, saya ingin booking jadwal kunjungan:%0A' +
        '• Nama: ' + encodeURIComponent(nameVal) + '%0A' +
        '• WhatsApp: ' + encodeURIComponent(phoneVal) + '%0A' +
        '• Tanggal: ' + encodeURIComponent(dateVal) +
        (notesVal ? '%0A• Keluhan: ' + encodeURIComponent(notesVal) : '');

      fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameVal,
          phone: phoneVal,
          scheduledDate: dateVal,
          scheduledTime: '09:00',
          serviceName: (config.treatments && config.treatments[0] && config.treatments[0].title) || 'Konsultasi Gigi',
          notes: notesVal,
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('static');
          return res.json();
        })
        .then(function () {
          alert('Jadwal kunjungan Anda berhasil terdaftar di sistem klinik!');
          bookingForm.reset();
        })
        .catch(function () {
          window.open('https://wa.me/' + waNum + '?text=' + msg, '_blank', 'noopener,noreferrer');
        });
    });
  }
})();

