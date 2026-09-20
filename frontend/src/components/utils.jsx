/** Returns color classes for a grade string */
export function gradeColor(grade) {
  if (!grade) return 'bg-gray-100 text-gray-600'
  const g = grade.toUpperCase()
  if (g.startsWith('A')) return 'bg-green-100 text-green-700'
  if (g.startsWith('B')) return 'bg-blue-100 text-blue-700'
  if (g.startsWith('C')) return 'bg-yellow-100 text-yellow-700'
  if (g.startsWith('D') || g.startsWith('E')) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

/** Returns initials from a name */
export function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/** Avatar with fallback to initials */
export function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-20 h-20 text-2xl', xl: 'w-32 h-32 text-4xl' }
  const cls = sizes[size] || sizes.md

  if (src) {
    return <img src={src} alt={name} className={`${cls} rounded-full object-cover border-2 border-white shadow`} />
  }
  return (
    <div className={`${cls} rounded-full bg-primary-700 text-white flex items-center justify-center font-bold border-2 border-white shadow`}>
      {initials(name)}
    </div>
  )
}
