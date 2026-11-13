const BASE = '/api/v1/public'

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, options)
  let data = null
  try {
    data = await res.json()
  } catch {
    // A proxy or cold-start error can answer with HTML; fall through to the status code.
  }
  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export function fetchMenu(tableNumber) {
  return request(`/menu?table=${encodeURIComponent(tableNumber)}`)
}

export function placeOrder(payload) {
  return request('/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function fetchOrder(orderId) {
  return request(`/orders/${encodeURIComponent(orderId)}`)
}
