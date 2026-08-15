export const inputCls = (hasError) =>
  `border rounded-xl p-2.5 text-sm w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-terong transition-colors ${
    hasError ? 'border-rose-400 dark:border-rose-500' : 'border-gray-200 dark:border-gray-700'
  }`

export function FieldError({ msg }) {
  if (!msg) return null
  return <p className="text-xs text-rose-500 mt-1">{msg}</p>
}