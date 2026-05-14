import { onMounted, onUnmounted } from "vue";

export function useRevealAnimations() {
  let io: IntersectionObserver;
  let lineIo: IntersectionObserver;

  onMounted(() => {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    lineIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            lineIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    document
      .querySelectorAll(".reveal, .reveal-left, .reveal-right, .stagger")
      .forEach((el) => io.observe(el));
    document
      .querySelectorAll(".accent-line")
      .forEach((el) => lineIo.observe(el));
  });

  onUnmounted(() => {
    io?.disconnect();
    lineIo?.disconnect();
  });
}
