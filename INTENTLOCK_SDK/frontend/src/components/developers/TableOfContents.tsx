// INTENTLOCK 2.0 – In-Page Table of Contents
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
      <div className="sticky top-24 pl-6 border-l border-slate-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          On this page
        </h3>
        <ul className="mt-3 space-y-2 text-xs">
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
                      ? "text-emerald-400 font-medium"
                      : "text-slate-400 hover:text-slate-200"
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
