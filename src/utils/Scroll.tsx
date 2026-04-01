import { useEffect } from "react";

const BASE_SELECTOR = "[data-scroll]";
const INITIAL_TRANSFORM = "translateY(20px)";
const VISIBLE_TRANSFORM = "translateY(0)";
const TRANSITION = "opacity 0.6s ease, transform 0.6s ease";
const ROOT_MARGIN = "0px 0px -15% 0px";

const showElement = (element: HTMLElement) => {
  element.classList.add("motion-safe:animate-fadeIn");
  element.style.opacity = "1";
  element.style.transform = VISIBLE_TRANSFORM;
};

const hideElement = (element: HTMLElement) => {
  element.style.opacity = "0";
  element.style.transform = INITIAL_TRANSFORM;
};

export default function Scroll() {
  useEffect(() => {
    const scrollElements = Array.from(document.querySelectorAll<HTMLElement>(BASE_SELECTOR));
    const pendingTimers = new Map<HTMLElement, number>();

    scrollElements.forEach((element) => {
      element.style.transition = TRANSITION;
      hideElement(element);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          const pendingTimer = pendingTimers.get(element);

          if (entry.isIntersecting) {
            if (pendingTimer) {
              return;
            }

            const delay = Number.parseFloat(element.dataset.scrollDelay ?? "0");
            const timer = window.setTimeout(() => {
              showElement(element);
              pendingTimers.delete(element);
            }, delay * 1000);

            pendingTimers.set(element, timer);
            return;
          }

          if (pendingTimer) {
            window.clearTimeout(pendingTimer);
            pendingTimers.delete(element);
          }

          hideElement(element);
        });
      },
      { rootMargin: ROOT_MARGIN, threshold: 0 }
    );

    scrollElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      pendingTimers.forEach((timer) => {
        window.clearTimeout(timer);
      });
      observer.disconnect();
    };
  }, []);

  return null;
}
