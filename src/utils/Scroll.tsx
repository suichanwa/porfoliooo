import { useEffect } from "react";

const BASE_SELECTOR = "[data-scroll]";
const VISIBLE_TRANSFORM = "translateY(0)";
const DEFAULT_OFFSET_PX = 20;
const DEFAULT_DURATION = "0.6s";
const DEFAULT_EASE = "ease";
const ROOT_MARGIN = "0px 0px -15% 0px";

const getInitialTransform = (element: HTMLElement) => {
  const offset = Number.parseFloat(element.dataset.scrollOffset ?? `${DEFAULT_OFFSET_PX}`);
  const safeOffset = Number.isFinite(offset) ? offset : DEFAULT_OFFSET_PX;
  return `translateY(${safeOffset}px)`;
};

const getTransition = (element: HTMLElement) => {
  const duration = element.dataset.scrollDuration ?? DEFAULT_DURATION;
  const easing = element.dataset.scrollEase ?? DEFAULT_EASE;
  return `opacity ${duration} ${easing}, transform ${duration} ${easing}`;
};

const showElement = (element: HTMLElement) => {
  element.classList.add("motion-safe:animate-fadeIn");
  element.style.opacity = "1";
  element.style.transform = VISIBLE_TRANSFORM;
};

const hideElement = (element: HTMLElement) => {
  element.style.opacity = "0";
  element.style.transform = getInitialTransform(element);
};

export default function Scroll() {
  useEffect(() => {
    const scrollElements = Array.from(document.querySelectorAll<HTMLElement>(BASE_SELECTOR));
    const pendingTimers = new Map<HTMLElement, number>();

    scrollElements.forEach((element) => {
      element.style.transition = getTransition(element);
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
