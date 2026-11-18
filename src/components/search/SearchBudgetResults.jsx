import { Button } from '@/components/ui/button';
import { CATALOG_BUDGET_GROUPS } from '@/lib/catalogState';
import { catalogSearchCopy, formatCatalogueBudget } from '@/lib/catalogSearchCopy';

export default function SearchBudgetResults({ budget, groups, selected, onSelect, language }) {
    const copy = catalogSearchCopy(language);
    return (
        <section className="catalog-budget-results" aria-labelledby="catalog-budget-heading">
            <h2 id="catalog-budget-heading">{copy.budgetResults}</h2>
            <p>{copy.budgetSummary(formatCatalogueBudget(budget, language))}</p>
            <div className="catalog-budget-groups" role="group" aria-labelledby="catalog-budget-heading">
                {CATALOG_BUDGET_GROUPS.map(group => (
                    <Button key={group} type="button" variant="outline" aria-pressed={selected === group} onClick={() => onSelect(group)}>
                        {copy.groups[group]} <span>{groups[group].length}</span>
                    </Button>
                ))}
            </div>
            <p aria-live="polite">{copy.groupHelp[selected]}</p>
        </section>
    );
}
