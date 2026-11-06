import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Radix reserves the empty string for clearing; keep the form's empty answer selectable.
const EMPTY_ANSWER = '__unimatch_empty_answer__';

export default function OptionSelect({ value, onValueChange, options, emptyLabel = undefined, name = undefined, disabled = false, ...triggerProps }) {
  return <Select name={name} disabled={disabled} value={value || EMPTY_ANSWER} onValueChange={next => onValueChange(next === EMPTY_ANSWER ? '' : next)}>
    <SelectTrigger {...triggerProps}><SelectValue /></SelectTrigger>
    <SelectContent>
      {emptyLabel != null && <SelectItem value={EMPTY_ANSWER}>{emptyLabel}</SelectItem>}
      {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}
