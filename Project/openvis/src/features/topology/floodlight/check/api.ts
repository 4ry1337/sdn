export async function check_floodlight(url: string) {
  try {
    const response = await fetch(`${url}/wm/core/health/json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.healthy === true
  } catch (error) {
    throw error
  }
}
