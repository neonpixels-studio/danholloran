import confetti from "canvas-confetti";

const useConfetti = () => {
  const unicornFireworks = () => {
    const scalar = 2;
    const unicorn = confetti.shapeFromText({ text: "🦄", scalar });
    const duration = 15 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 20,
      spread: 360,
      gravity: 0,
      decay: 0.96,
      ticks: 60,
      zIndex: 0,
      shapes: [unicorn],
      scalar,
    };

    const randomInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        disableForReducedMotion: true,
        flat: true,
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        disableForReducedMotion: true,
        flat: true,
      });
    }, 250);
  };

  return { unicornFireworks };
};

export default useConfetti;
