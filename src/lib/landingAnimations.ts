import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initLandingAnimations(rootEl: HTMLElement): () => void {
  if (typeof window === 'undefined') return () => {};

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    return () => {};
  }

  const ctx = gsap.context(() => {
    const mm = gsap.matchMedia();

    const isBelowFold = (el: Element) => {
      const rect = el.getBoundingClientRect();
      return rect.top > window.innerHeight * 0.96;
    };

    // 1. Hero Entrance
    gsap.from('.gsap-hero-headline', {
      y: 24,
      opacity: 0,
      duration: 0.85,
      ease: 'power3.out',
      clearProps: 'all',
    });

    gsap.from('.gsap-hero-item', {
      y: 18,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      delay: 0.12,
      ease: 'power3.out',
      clearProps: 'all',
    });

    // 2. Scroll-Triggered Text Reveal (hanya animasi jika masih di bawah viewport)
    gsap.utils.toArray<HTMLElement>('.gsap-text-reveal').forEach((el) => {
      if (!isBelowFold(el)) return;
      gsap.from(el, {
        y: 22,
        opacity: 0,
        duration: 0.75,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: el,
          start: 'top 95%',
          once: true,
        },
      });
    });

    // 3. Fade Up Paragraphs
    gsap.utils.toArray<HTMLElement>('.gsap-fade-up').forEach((el) => {
      if (!isBelowFold(el)) return;
      gsap.from(el, {
        y: 16,
        opacity: 0,
        duration: 0.65,
        ease: 'power2.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: el,
          start: 'top 95%',
          once: true,
        },
      });
    });

    // 4. Image Mask Reveal
    gsap.utils.toArray<HTMLElement>('.gsap-image-mask').forEach((el) => {
      if (!isBelowFold(el)) return;
      gsap.fromTo(
        el,
        { clipPath: 'inset(8% 0% 8% 0% round 28px)', opacity: 0.5 },
        {
          clipPath: 'inset(0% 0% 0% 0% round 28px)',
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: el,
            start: 'top 94%',
            once: true,
          },
        }
      );
    });

    // 5. Staggered Cards per Container (gunakan batch agar tidak pernah macet di opacity 0)
    ScrollTrigger.batch('.gsap-stagger-card', {
      start: 'top 96%',
      once: true,
      onEnter: (batch) => {
        gsap.fromTo(
          batch,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.07,
            ease: 'power2.out',
            clearProps: 'all',
          }
        );
      },
    });

    // 6. Animated Counters
    gsap.utils.toArray<HTMLElement>('.gsap-counter').forEach((el) => {
      const target = Number(el.dataset.target || 0);
      if (!target) return;
      const counter = { val: 0 };
      gsap.to(counter, {
        val: target,
        duration: 1.3,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = String(Math.round(counter.val));
        },
        scrollTrigger: {
          trigger: el,
          start: 'top 95%',
          once: true,
        },
      });
    });

    // 7. Efek Khusus Desktop (Parallax, Floating, Horizontal Scrub Gallery)
    mm.add('(min-width: 768px)', () => {
      gsap.to('.gsap-float', {
        y: -10,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.5,
      });

      gsap.utils.toArray<HTMLElement>('.gsap-parallax').forEach((el) => {
        gsap.to(el, {
          yPercent: -5,
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
          },
        });
      });

      const horizSection = rootEl.querySelector<HTMLElement>('.gsap-horizontal-section');
      const horizTrack = rootEl.querySelector<HTMLElement>('.gsap-horizontal-track');
      if (horizSection && horizTrack) {
        const getScrollAmount = () => -(horizTrack.scrollWidth - horizSection.clientWidth + 32);
        if (horizTrack.scrollWidth > horizSection.clientWidth) {
          gsap.to(horizTrack, {
            x: getScrollAmount,
            ease: 'none',
            scrollTrigger: {
              trigger: horizSection,
              start: 'top 22%',
              end: () => `+=${Math.max(400, horizTrack.scrollWidth - horizSection.clientWidth)}`,
              pin: true,
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          });
        }
      }
    });

    // Pastikan ScrollTrigger menghitung ulang setelah font & layout stabil
    setTimeout(() => ScrollTrigger.refresh(), 180);
  }, rootEl);

  return () => {
    ctx.revert();
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
}
