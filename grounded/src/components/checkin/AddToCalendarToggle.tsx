// "Add to my calendar" at the end of making a plan. On by default; shown only with a calendar connected.
export default function AddToCalendarToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-600">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-stone-700" />
      Add to my calendar
    </label>
  )
}
