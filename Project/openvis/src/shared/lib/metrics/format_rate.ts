export const format_rate = (bytes_per_second: number): string => {
  if (isNaN(bytes_per_second) || bytes_per_second < 0) return '0 bps'

  const bits_per_second = bytes_per_second * 8
  const units = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps']
  let rate = bits_per_second
  let unit_index = 0

  while (rate >= 1000 && unit_index < units.length - 1) {
    rate /= 1000
    unit_index++
  }

  return `${rate.toFixed(2)} ${units[unit_index]}`
}

export const calculate_throughput = (
  bytes: number | string,
  duration_sec: number | string,
  duration_nsec: number | string
): number => {
  const num_bytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes
  const sec = typeof duration_sec === 'string' ? parseInt(duration_sec, 10) : duration_sec
  const nsec = typeof duration_nsec === 'string' ? parseInt(duration_nsec, 10) : duration_nsec

  if (isNaN(num_bytes) || isNaN(sec) || isNaN(nsec)) return 0

  const total_seconds = sec + nsec / 1e9
  if (total_seconds === 0) return 0

  return num_bytes / total_seconds
}
