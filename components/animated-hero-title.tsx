"use client";

import { useEffect, useMemo, useState } from "react";

type AnimatedHeroTitleProps = {
  text: string;
  className?: string;
};

export function AnimatedHeroTitle({ text, className = "" }: AnimatedHeroTitleProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const tokens = useMemo(() => text.split(" "), [text]);

  return (
    <h1
      className={`max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl xl:text-[4rem] ${className}`}
      aria-label={text}
    >
      {tokens.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} className="mr-[0.28em] inline-block whitespace-nowrap last:mr-0">
          {word.split("").map((char, charIndex) => {
            const delay = wordIndex * 0.08 + charIndex * 0.018;

            return (
              <span
                key={`${char}-${wordIndex}-${charIndex}`}
                aria-hidden="true"
                className="inline-block will-change-transform will-change-opacity"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translate3d(0, 0, 0)" : "translate3d(0, 38px, 0)",
                  filter: isVisible ? "blur(0px)" : "blur(8px)",
                  transitionProperty: "transform, opacity, filter",
                  transitionDuration: "900ms",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  transitionDelay: `${delay}s`
                }}
              >
                {char}
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
