"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Lang = "en" | "roman_urdu";

type Copy = {
  checkProblem: string;
  report: string;
  triage: string;
};

const copy: Record<Lang, Copy> = {
  en: {
    checkProblem: "Check a home problem",
    report: "Report a problem",
    triage: "Adaptive triage",
  },
  roman_urdu: {
    checkProblem: "Ghar ki problem check karein",
    report: "Masla report karein",
    triage: "Sawalat ke zariye samjhein",
  },
};

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Copy;
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => undefined,
  t: copy.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: copy[lang] }),
    [lang]
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      type="button"
      className="rounded-md border border-[var(--avero-line)] px-2 py-1 text-xs"
      onClick={() => setLang(lang === "en" ? "roman_urdu" : "en")}
    >
      {lang === "en" ? "Roman Urdu" : "English"}
    </button>
  );
}
