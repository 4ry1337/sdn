export const format_bytes = (bytes: number | string): string => {
  const num_bytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes

  if (isNaN(num_bytes) || num_bytes < 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = num_bytes
  let unit_index = 0

  while (size >= 1024 && unit_index < units.length - 1) {
    size /= 1024
    unit_index++
  }

  return `${size.toFixed(2)} ${units[unit_index]}`
}
