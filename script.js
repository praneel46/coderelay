/**
 * VIDYANTRA 2026 // CODE RELAY
 * High-Performance Interactive Frontend Script
 * Handles:
 * - Live Event Countdown with Digit Animations
 * - Prize Pool Count-Up Animation
 * - Scroll-Triggered Reveal Animations (IntersectionObserver)
 * - Navigation Transparency & Active State Highlighting
 * - Top Scroll Tracker Line
 * - Mobile Fullscreen Menu
 * - Interactive FAQ Accordion
 * - Registration Modal with Easy URL Integration
 * - Back to Top Button
 * - Subtle Hero Parallax
 */

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================

/**
 * Replace with the official Google Form URL once registration opens.
 * When empty, all 'Register' buttons trigger the high-tech notification modal.
 */
const REGISTRATION_FORM_URL = "";

/**
 * Target Event Date: 30 October 2026 (09:00:00 IST)
 */
const EVENT_TARGET_DATE = new Date("2026-10-30T09:00:00+05:30").getTime();

// Check if user prefers reduced motion
const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
  initScrollTracker();
  initNavbarScroll();
  initMobileMenu();
  initLiveCountdown();
  initScrollReveals();
  initPrizeCounter();
  initFaqAccordion();
  initRegistrationModal();
  initBackToTop();
  initHeroParallax();
});

// ============================================================
// TOP SCROLL TRACKER BAR
// ============================================================
function initScrollTracker() {
  const hudLine = document.querySelector(".hud-line");
  if (!hudLine) return;

  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    hudLine.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
  }, { passive: true });
}

// ============================================================
// NAVBAR SCROLL & ACTIVE LINK HIGHLIGHTING
// ============================================================
function initNavbarScroll() {
  const navbar = document.getElementById("navbar");
  const navLinks = document.querySelectorAll(".desktop-nav .nav-link");
  const sections = document.querySelectorAll("main section[id]");

  window.addEventListener("scroll", () => {
    const scrollPos = window.scrollY;

    // Background blur/fill change
    if (navbar) {
      if (scrollPos > 60) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }

    // Active Section Detection
    let currentSectionId = "";
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 180;
      const sectionHeight = section.offsetHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentSectionId}`) {
        link.classList.add("active");
      }
    });
  }, { passive: true });
}

// ============================================================
// MOBILE MENU OVERLAY
// ============================================================
function initMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const menuCloseBtn = document.getElementById("menuCloseBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-nav-list a");

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuToggle?.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle?.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  menuToggle?.addEventListener("click", openMenu);
  menuCloseBtn?.addEventListener("click", closeMenu);
  mobileMenu?.querySelector(".mobile-menu-backdrop")?.addEventListener("click", closeMenu);

  // Close when tapping links
  mobileLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu?.classList.contains("is-open")) {
      closeMenu();
    }
  });
}

// ============================================================
// LIVE COUNTDOWN TIMER
// ============================================================
function initLiveCountdown() {
  const daysEl = document.getElementById("timerDays");
  const hoursEl = document.getElementById("timerHours");
  const minutesEl = document.getElementById("timerMinutes");
  const secondsEl = document.getElementById("timerSeconds");

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  let lastVals = { d: null, h: null, m: null, s: null };

  function updateDigit(element, newVal, key) {
    const formatted = String(newVal).padStart(2, "0");
    if (lastVals[key] !== formatted) {
      if (!PREFERS_REDUCED_MOTION && lastVals[key] !== null) {
        element.style.opacity = "0";
        element.style.transform = "translateY(-6px)";
        setTimeout(() => {
          element.textContent = formatted;
          element.style.opacity = "1";
          element.style.transform = "translateY(0)";
        }, 150);
      } else {
        element.textContent = formatted;
      }
      lastVals[key] = formatted;
    }
  }

  function tick() {
    const now = new Date().getTime();
    const distance = EVENT_TARGET_DATE - now;

    if (distance <= 0) {
      updateDigit(daysEl, 0, "d");
      updateDigit(hoursEl, 0, "h");
      updateDigit(minutesEl, 0, "m");
      updateDigit(secondsEl, 0, "s");
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    updateDigit(daysEl, days, "d");
    updateDigit(hoursEl, hours, "h");
    updateDigit(minutesEl, minutes, "m");
    updateDigit(secondsEl, seconds, "s");
  }

  // Initial call and 1s continuous decrement
  tick();
  setInterval(tick, 1000);
}

// ============================================================
// REPEATING SCROLL-TRIGGERED REVEAL ANIMATIONS
// Every time a section/element enters viewport -> animates in
// Every time it leaves viewport -> resets so it replays upon return
// ============================================================
function initScrollReveals() {
  if (PREFERS_REDUCED_MOTION) {
    document.querySelectorAll(".reveal-up, .reveal-scale, .reveal-stagger").forEach((el) => {
      el.classList.add("is-revealed");
    });
    return;
  }

  const revealElements = document.querySelectorAll(".reveal-up, .reveal-scale, .reveal-stagger");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
      } else {
        // Element left viewport: reset so entrance replays on scroll return
        entry.target.classList.remove("is-revealed");
      }
    });
  }, {
    root: null,
    threshold: 0.1,
    rootMargin: "0px 0px -40px 0px"
  });

  revealElements.forEach((el) => observer.observe(el));
}

// ============================================================
// REPEATING PRIZE POOL COUNT-UP ANIMATION
// Triggers count-up on viewport enter; resets on leave to replay
// ============================================================
function initPrizeCounter() {
  const prizeCounter = document.getElementById("prizeCounter");
  if (!prizeCounter) return;

  const targetAmount = 45000;
  let animId = null;
  let hasCounted = false;

  function runCounter() {
    if (hasCounted) return;
    hasCounted = true;

    if (PREFERS_REDUCED_MOTION) {
      prizeCounter.textContent = targetAmount.toLocaleString("en-IN");
      return;
    }

    if (animId) cancelAnimationFrame(animId);
    const duration = 1600; // ms
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.floor(easeOutProgress * targetAmount);

      prizeCounter.textContent = currentVal.toLocaleString("en-IN");

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        prizeCounter.textContent = targetAmount.toLocaleString("en-IN");
        animId = null;
      }
    }

    animId = requestAnimationFrame(step);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasCounted) {
        runCounter();
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: "0px 0px -30px 0px"
  });

  observer.observe(prizeCounter);
}

// ============================================================
// FAQ ACCORDION
// ============================================================
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const content = item.querySelector(".faq-content");

    if (!trigger || !content) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // Optional: Close all other open accordion items for clean rhythm
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          other.classList.remove("is-open");
          const otherTrigger = other.querySelector(".faq-trigger");
          const otherContent = other.querySelector(".faq-content");
          if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
          if (otherContent) otherContent.style.maxHeight = null;
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
        content.style.maxHeight = null;
      } else {
        item.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });

    // Keyboard support: Enter / Space handled natively on button
  });
}

// ============================================================
// REGISTRATION BUTTONS & MODAL BEHAVIOR
// ============================================================
function initRegistrationModal() {
  const registerButtons = document.querySelectorAll(".btn-register, [data-action='register']");
  const modal = document.getElementById("registrationModal");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalBackdrop = document.getElementById("modalBackdrop");

  function handleRegisterClick(e) {
    e.preventDefault();

    // If a Google Form URL is provided, navigate directly to it
    if (REGISTRATION_FORM_URL && REGISTRATION_FORM_URL.trim() !== "") {
      window.open(REGISTRATION_FORM_URL, "_blank", "noopener,noreferrer");
      return;
    }

    // Otherwise show the official Coming Soon notice modal
    openModal();
  }

  function openModal() {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modalCloseBtn?.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  registerButtons.forEach((btn) => {
    btn.addEventListener("click", handleRegisterClick);
  });

  modalCloseBtn?.addEventListener("click", closeModal);
  modalBackdrop?.addEventListener("click", closeModal);

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("is-open")) {
      closeModal();
    }
  });
}

// ============================================================
// BACK TO TOP BUTTON
// ============================================================
function initBackToTop() {
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (!backToTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 450) {
      backToTopBtn.classList.add("is-visible");
    } else {
      backToTopBtn.classList.remove("is-visible");
    }
  }, { passive: true });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

// ============================================================
// SUBTLE HERO PARALLAX
// ============================================================
function initHeroParallax() {
  if (PREFERS_REDUCED_MOTION) return;

  const heroBg = document.getElementById("heroBgImg");
  const heroSection = document.getElementById("hero");
  if (!heroBg || !heroSection) return;

  window.addEventListener("scroll", () => {
    if (window.innerWidth < 768) return;
    const scrollPos = window.scrollY;
    if (scrollPos <= heroSection.offsetHeight) {
      // Very subtle, smooth parallax translation without jumping
      const translateY = scrollPos * 0.18;
      const scale = 1.02 + scrollPos * 0.00015;
      heroBg.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
    }
  }, { passive: true });
}
