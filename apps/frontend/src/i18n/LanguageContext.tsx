import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang, t as translate } from './translations';

interface LanguageContextType {
    lang: Lang;
    setLang: (lang: Lang) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'tr',
    setLang: () => {},
    t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Lang>(() => {
        const saved = localStorage.getItem('lang');
        return (saved === 'en' || saved === 'tr') ? saved : 'tr';
    });

    const setLang = (newLang: Lang) => {
        setLangState(newLang);
        localStorage.setItem('lang', newLang);
    };

    const t = (key: string) => translate(key, lang);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
