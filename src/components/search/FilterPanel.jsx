import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { catalogValue } from '@/lib/catalogCopy';
import '@/styles/glass-controls.css';

const countries = ["Germany", "Netherlands", "Czech Republic", "Poland", "Hungary", "Austria", "France", "Italy", "Spain", "Portugal", "Belgium", "Sweden", "Finland", "Norway", "Denmark", "Switzerland", "United Kingdom", "Ireland", "USA", "Canada", "Australia", "China", "South Korea", "Japan", "Singapore", "Malaysia", "UAE"];
const languages = ["English", "German", "French", "Spanish", "Italian", "Dutch", "Russian", "Mixed"];
const regions = ["Europe", "North America", "Asia", "Middle East", "Oceania", "South America"];
const degrees = ["Bachelor", "Master", "PhD"];

export default function FilterPanel({ filters, setFilters, onReset, universities = [] }) {
    const { t, language } = useLanguage();
    const unsetLabel = { en: 'Not set', ru: 'Не указано', uz: 'Kiritilmagan' }[language] || 'Not set';
    const idPrefix = React.useId();
    const [showAdvanced, setShowAdvanced] = React.useState(false);
    const availableCountries = React.useMemo(() => {
        if (!universities || universities.length === 0) return countries;
        const countrySet = new Set(universities.map(u => u.country).filter(Boolean));
        return [...countrySet].sort((a, b) => a.localeCompare(b));
    }, [universities]);
    const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: (key === 'country' || key === 'region') && value === 'all' ? '' : value }));
    const toggleArrayFilter = (key, value) => setFilters(prev => { const current = prev[key] || []; const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value]; return { ...prev, [key]: updated }; });
    const activeFilterCount = Object.values(filters).filter(v => v !== null && v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)).length;
    const optionLabel = (value) => catalogValue(value, language);
    const filterId = (name) => `${idPrefix}-search-filter-${name}`;

    return (
        <div className="product-glass search-filter-panel bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">{t('search.filters')}</h3>{activeFilterCount > 0 && <Button variant="ghost" size="sm" onClick={onReset} className="text-slate-500 hover:text-slate-700"><RotateCcw className="w-4 h-4 mr-1" />{t('filters.reset')}</Button>}</div>
            <div className="space-y-3"><Label id={filterId('gpa-label')} className="text-sm font-medium text-slate-700">{t('filters.gpa')}: <span className="search-filter-value text-indigo-600 font-semibold">{filters.gpa == null ? unsetLabel : filters.gpa.toFixed(1)}</span></Label><Slider aria-labelledby={filterId('gpa-label')} value={[filters.gpa ?? 1.0]} onValueChange={([val]) => updateFilter('gpa', val)} min={1.0} max={4.0} step={0.1} className="search-filter-slider py-2" /><div className="flex justify-between text-xs text-slate-400"><span>1.0</span><span>4.0</span></div></div>
            <div className="space-y-3"><Label id={filterId('ielts-label')} htmlFor={filterId('ielts')} className="text-sm font-medium text-slate-700">{t('filters.ielts')}: <span className="search-filter-value text-indigo-600 font-semibold">{filters.ielts == null ? unsetLabel : filters.ielts === 0 ? t('filters.noCertificate') : filters.ielts.toFixed(1)}</span></Label><Select value={filters.ielts == null ? 'unset' : String(filters.ielts)} onValueChange={(val) => updateFilter('ielts', val === 'unset' ? null : Number(val))}><SelectTrigger id={filterId('ielts')} className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger><SelectContent className="glass-filter-options search-filter-options" matchTriggerWidth align="start"><SelectItem value="unset">{unsetLabel}</SelectItem><SelectItem value="0">{t('filters.noCertificate')}</SelectItem><SelectItem value="5.5">IELTS 5.5</SelectItem><SelectItem value="6">IELTS 6.0</SelectItem><SelectItem value="6.5">IELTS 6.5</SelectItem><SelectItem value="7">IELTS 7.0+</SelectItem></SelectContent></Select></div>
            <div className="space-y-3"><Label id={filterId('budget-label')} className="text-sm font-medium text-slate-700">{t('filters.budget')}: <span className="search-filter-value text-indigo-600 font-semibold">{filters.budget == null ? unsetLabel : `€${filters.budget.toLocaleString()}/${t('common.year')}`}</span></Label><Slider aria-labelledby={filterId('budget-label')} value={[filters.budget ?? 0]} onValueChange={([val]) => updateFilter('budget', val)} min={0} max={50000} step={500} className="search-filter-slider py-2" /><div className="flex justify-between text-xs text-slate-400"><span>€0</span><span>€50,000+</span></div></div>
            <div className="space-y-3"><Label htmlFor={filterId('country')} className="text-sm font-medium text-slate-700">{t('filters.country')}</Label><Select value={filters.country || ""} onValueChange={(val) => updateFilter('country', val)}><SelectTrigger id={filterId('country')} className="bg-slate-50 border-slate-200"><SelectValue placeholder={t('filters.allCountries')} /></SelectTrigger><SelectContent className="glass-filter-options search-filter-options"><SelectItem value="all">{t('filters.allCountries')}</SelectItem>{availableCountries.map(c => <SelectItem key={c} value={c}>{optionLabel(c)}</SelectItem>)}</SelectContent></Select></div>
            <Button variant="outline" aria-expanded={showAdvanced} onClick={() => setShowAdvanced(!showAdvanced)} className="w-full">{t(showAdvanced ? 'filters.hideFilters' : 'filters.moreFilters')}<ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} /></Button>
            {showAdvanced && (
                <div className="space-y-6 pt-4 border-t">
                    <div className="space-y-3">
                        <Label htmlFor={filterId('topik')} className="text-sm font-medium text-slate-700">
                            {t('filters.topik')}: <span className="text-indigo-600 font-semibold">{filters.topikLevel == null ? unsetLabel : filters.topikLevel === "Not taken" ? t('filters.notTaken') : filters.topikLevel}</span>
                        </Label>
                        <Select value={filters.topikLevel || "unset"} onValueChange={(val) => updateFilter('topikLevel', val === 'unset' ? null : val)}>
                            <SelectTrigger id={filterId('topik')} className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                            <SelectContent className="glass-filter-options search-filter-options">
                                <SelectItem value="unset">{unsetLabel}</SelectItem><SelectItem value="Not taken">{t('filters.notTaken')}</SelectItem>
                                <SelectItem value="TOPIK 1">TOPIK 1</SelectItem><SelectItem value="TOPIK 2">TOPIK 2</SelectItem><SelectItem value="TOPIK 3">TOPIK 3</SelectItem>
                                <SelectItem value="TOPIK 4">TOPIK 4</SelectItem><SelectItem value="TOPIK 5">TOPIK 5</SelectItem><SelectItem value="TOPIK 6">TOPIK 6</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-400">{t('filters.topikHint')}</p>
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor={filterId('region')} className="text-sm font-medium text-slate-700">{t('filters.region')}</Label>
                        <Select value={filters.region || ""} onValueChange={(val) => updateFilter('region', val)}>
                            <SelectTrigger id={filterId('region')} className="bg-slate-50 border-slate-200"><SelectValue placeholder={t('filters.allRegions')} /></SelectTrigger>
                            <SelectContent className="glass-filter-options search-filter-options"><SelectItem value="all">{t('filters.allRegions')}</SelectItem>{regions.map(r => <SelectItem key={r} value={r}>{optionLabel(r)}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-700">{t('filters.language')}</Label>
                        <div className="flex flex-wrap gap-2" role="group" aria-label={t('filters.language')}>
                            {languages.map(lang => <Button key={lang} type="button" variant="outline" aria-pressed={Boolean(filters.languages?.includes(lang))} className={`search-filter-chip ${filters.languages?.includes(lang) ? "is-selected" : ""}`} onClick={() => toggleArrayFilter('languages', lang)}>{optionLabel(lang)}</Button>)}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-slate-700">{t('filters.degree')}</Label>
                        <div className="flex flex-wrap gap-2" role="group" aria-label={t('filters.degree')}>
                            {degrees.map(deg => <Button key={deg} type="button" variant="outline" aria-pressed={filters.degree === deg} className={`search-filter-chip ${filters.degree === deg ? "is-selected" : ""}`} onClick={() => updateFilter('degree', filters.degree === deg ? '' : deg)}>{optionLabel(deg)}</Button>)}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label htmlFor={filterId('scholarships')} className="flex min-h-12 cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#e7dfd3] bg-[#f7f3ec] px-4 py-3 text-left shadow-sm transition-colors hover:border-[#c6a47e] focus-within:ring-2 focus-within:ring-[#855a36]/30">
                            <span id={filterId('scholarships-label')} className="min-w-0 text-sm font-medium leading-5 text-[#292823]">{t('filters.scholarships')}</span>
                            <input id={filterId('scholarships')} type="checkbox" role="switch" aria-labelledby={filterId('scholarships-label')} checked={Boolean(filters.scholarshipsOnly)} onChange={(event) => updateFilter('scholarshipsOnly', event.target.checked)} className="catalog-scholarship-switch relative h-5 w-9 shrink-0 appearance-none rounded-full border transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-3.5 after:w-3.5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform checked:after:translate-x-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#855a36] focus-visible:ring-offset-2" />
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
