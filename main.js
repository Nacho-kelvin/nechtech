(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const doc = document.documentElement;

  /* ---------- footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- reading progress bar ---------- */
  const progress = document.getElementById("progress");
  function updateProgress() {
    const scrollTop = window.scrollY;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
  }

  /* ---------- spine (ambient drawn line, signature element) ---------- */
  const spinePath = document.getElementById("spinePath");
  const spineSvg = document.getElementById("spineSvg");

  function buildSpinePath() {
    if (!spinePath || !spineSvg) return;
    const docHeight = doc.scrollHeight;
    spineSvg.setAttribute("viewBox", `0 0 40 ${docHeight}`);
    spineSvg.style.height = docHeight + "px";

    // a gentle wandering line, seeded so it feels hand-plotted rather than random
    const points = [];
    const step = 90;
    let x = 20;
    let seed = 0;
    for (let y = 0; y <= docHeight; y += step) {
      seed += 0.7;
      x = 20 + Math.sin(seed) * 12 + Math.sin(seed * 0.35) * 6;
      points.push(`${y === 0 ? "M" : "L"}${x.toFixed(1)},${y}`);
    }
    const d = points.join(" ");
    spinePath.setAttribute("d", d);

    const length = spinePath.getTotalLength ? spinePath.getTotalLength() : docHeight;
    spinePath.style.strokeDasharray = length;
    spinePath.style.strokeDashoffset = reduceMotion ? 0 : length;
  }

  function updateSpine() {
    if (!spinePath || reduceMotion) return;
    const length = spinePath.style.strokeDasharray
      ? parseFloat(spinePath.style.strokeDasharray)
      : 0;
    if (!length) return;
    const scrollTop = window.scrollY;
    const height = doc.scrollHeight - doc.clientHeight;
    const pct = height > 0 ? scrollTop / height : 0;
    const offset = length - length * Math.min(pct * 1.05, 1);
    spinePath.style.strokeDashoffset = Math.max(offset, 0);
  }

  /* ---------- index (nav) panel ---------- */
  const toggle = document.getElementById("indexToggle");
  const panel = document.getElementById("indexPanel");
  const scrim = document.getElementById("indexScrim");

  function openIndex() {
    panel.classList.add("is-open");
    scrim.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  }
  function closeIndex() {
    panel.classList.remove("is-open");
    scrim.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && panel && scrim) {
    toggle.addEventListener("click", () => {
      panel.classList.contains("is-open") ? closeIndex() : openIndex();
    });
    scrim.addEventListener("click", closeIndex);
    panel.querySelectorAll("[data-close]").forEach((link) => {
      link.addEventListener("click", closeIndex);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeIndex();
    });
  }

  /* ---------- reveal-on-scroll for chapters & project entries ---------- */
  const revealTargets = document.querySelectorAll(
    ".chapter-body, .project-entry, .practice-entry, .tool-group, .process-line li"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- animated counters ---------- */
  const counters = document.querySelectorAll(".num[data-count]");
  function animateCount(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const progressRatio = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(progressRatio * target);
      if (progressRatio < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    const countIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countIo.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => countIo.observe(el));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- contact form (client-side validate + mailto fallback) ---------- */
  const form = document.getElementById("contact-form");
  if (form) {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (!name || !email || !message) {
        status.textContent = "Please fill in every field.";
        return;
      }

      const subject = encodeURIComponent(`Project inquiry from ${name}`);
      const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
      window.location.href = `mailto:kelvinnatonia@gmail.com?subject=${subject}&body=${body}`;
      status.textContent = "Opening your email app…";
    });
  }

  /* ---------- scroll handling (rAF-throttled) ---------- */
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateProgress();
        updateSpine();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    buildSpinePath();
    updateProgress();
    updateSpine();
  });

  window.addEventListener("load", () => {
    buildSpinePath();
    updateProgress();
    updateSpine();
  });
})();
