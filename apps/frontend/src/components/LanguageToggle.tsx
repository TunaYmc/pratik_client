import { useLanguage } from '../i18n/LanguageContext';

export default function LanguageToggle() {
    const { lang, setLang } = useLanguage();

    return (
        <div className="flex items-center gap-1 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg overflow-hidden text-xs">
            <button
                onClick={() => setLang('tr')}
                className={`px-2.5 py-1.5 transition-colors ${lang === 'tr' ? 'bg-blue-500 text-white' : 'text-[var(--color-text-muted)] hover:text-white'}`}
            >
                TR
            </button>
            <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1.5 transition-colors ${lang === 'en' ? 'bg-blue-500 text-white' : 'text-[var(--color-text-muted)] hover:text-white'}`}
            >
                EN
            </button>
        </div>
    );
}
