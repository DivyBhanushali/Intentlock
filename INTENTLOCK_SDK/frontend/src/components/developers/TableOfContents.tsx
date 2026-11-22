// SICTACK 1.0 – In-Page Table of Contents
// Direction A: Warm Editorial Software (Human-Centered Design)
"use client";

import { useEffect, useState } from "react";
import { TocItem } from "./types";

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!items || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -70% 0%" }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <aside className="hidden xl:block w-64 shrink-0">
      <div className="sticky top-20 pl-6 border-l border-[#E2E0D8]">
        <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#787A80]">
          On this page
        </h3>
        <ul className="mt-3 space-y-2 text-xs" role="list">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                className={item.level === 3 ? "pl-3" : ""}
              >
                <a
                  href={`#${item.id}`}
                  className={`block transition-colors leading-normal ${
                    isActive
                      ? "text-[#1D3557] font-semibold"
                      : "text-[#56585D] hover:text-[#18191B]"
                  }`}
                >
                  {item.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
