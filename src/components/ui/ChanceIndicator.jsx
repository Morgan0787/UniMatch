import React from 'react';
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

// The `chance` prop is a `VERDICT` value from `src/lib/matching.js`. Those are
// spelled out as bare literals here on purpose: importing `VERDICT` would pin
// nothing, since `VERDICT.HIGH` would follow a rename silently. What does pin
// them is scripts/check-matching.mjs, which asserts each literal string, so a
// rename fails that script instead of quietly dropping every badge to the
// neutral "unknown" state.
const SCORABLE_VERDICTS = new Set(['high', 'medium', 'low']);

export default function ChanceIndicator({ chance, size = "default", reason }) {
    const { t } = useLanguage();
    
    const config = {
        high: {
            label: t('chance.high'),
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: CheckCircle2,
            iconColor: "text-emerald-500"
        },
        medium: {
            label: t('chance.medium'),
            color: "bg-amber-50 text-amber-700 border-amber-200",
            icon: AlertCircle,
            iconColor: "text-amber-500"
        },
        low: {
            label: t('chance.low'),
            color: "bg-rose-50 text-rose-600 border-rose-200",
            icon: XCircle,
            iconColor: "text-rose-400"
        },
        // Not a verdict, and not one cause: `calculateChance` returns UNKNOWN
        // from two guards — the student has no GPA, or the university
        // publishes no cutoff to compare against. Either way there is nothing
        // to score, so the badge stays visually neutral and unscored.
        unknown: {
            label: t('chance.unknown'),
            color: "bg-slate-50 text-slate-600 border-slate-200",
            icon: HelpCircle,
            iconColor: "text-slate-400"
        }
    };

    // Only the three real verdicts may be rendered as a verdict. Anything else
    // - a typo, a stale caller, or a missing `chance` prop - resolves to
    // `unknown` rather than silently reporting "Medium Chance".
    const { label, color, icon: Icon, iconColor } =
        config[SCORABLE_VERDICTS.has(chance) ? chance : 'unknown'];

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium",
            color,
            size === "sm" && "text-xs px-2 py-1",
            size === "lg" && "text-base px-4 py-2"
        )}>
            <Icon className={cn("w-4 h-4", iconColor, size === "sm" && "w-3 h-3")} />
            <span>{label}</span>
            {reason && <span className="sr-only">{reason}</span>}
        </div>
    );
}