import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const LANGUAGES = [
  { code: "az", label: "AZ", name: "Azərbaycan" },
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeLang = LANGUAGES.find((lang) => lang.code === language) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-[#1A1714]/90 text-[#F4EDE0] border border-[#B8935A]/30 hover:border-[#C9A227]/70 hover:bg-[#2B2118] hover:text-[#F0D68A] focus:outline-none focus:ring-1 focus:ring-[#C9A227] transition-all duration-200 ease-in-out shadow-sm"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-[#B8935A]" />
        <span className="flex items-center gap-1.5">
          <span className="tracking-wider">{activeLang.label}</span>
        </span>
        <ChevronDown className={"w-3.5 h-3.5 text-gray-400 transition-transform duration-200 " + (isOpen ? "rotate-180" : "")} />
      </button>

      <div
        className={"absolute right-0 mt-2 w-40 rounded-md shadow-2xl py-1 bg-[#1A1714] border border-[#B8935A]/30 backdrop-blur-md z-50 transform transition-all duration-200 origin-top-right " + (isOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-1 pointer-events-none")}
      >
        {LANGUAGES.map((lang) => {
          const isSelected = lang.code === language;
          return (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={"w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors duration-150 cursor-pointer " + (isSelected ? "text-[#F0D68A] bg-[#2B2118] font-semibold" : "text-[#F4EDE0]/80 hover:text-[#F4EDE0] hover:bg-[#2B2118]/60")}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#C9A227] w-6">{lang.label}</span>
                <span>{lang.name}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-[#C9A227]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
