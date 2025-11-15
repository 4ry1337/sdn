export const format_bytes = ( bytes: number ): string => {
  if ( bytes === 0 ) return '0 B'
  const k = 1024
  const sizes = [ 'B', 'KB', 'MB', 'GB', 'TB' ]
  const i = Math.floor( Math.log( bytes ) / Math.log( k ) )
  return `${( bytes / Math.pow( k, i ) ).toFixed( 2 )} ${sizes[ i ]}`
}

export const format_bandwidth = ( bps: number ): string => {
  if ( bps === 0 ) return '0 bps'
  const k = 1000
  const sizes = [ 'bps', 'Kbps', 'Mbps', 'Gbps' ]
  const i = Math.floor( Math.log( bps ) / Math.log( k ) )
  return `${( bps / Math.pow( k, i ) ).toFixed( 2 )} ${sizes[ i ]}`
}

export const format_time_since = ( timestamp: number ): string => {
  const seconds = Math.floor( ( Date.now() - timestamp ) / 1000 )
  if ( seconds < 60 ) return `${seconds}s ago`
  const minutes = Math.floor( seconds / 60 )
  if ( minutes < 60 ) return `${minutes}m ago`
  const hours = Math.floor( minutes / 60 )
  if ( hours < 24 ) return `${hours}h ago`
  const days = Math.floor( hours / 24 )
  return `${days}d ago`
}
