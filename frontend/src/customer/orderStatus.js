export const STATUS_STEPS = ['pending', 'accepted', 'preparing', 'ready', 'served']

export const GUEST_STATUS = {
  pending: { label: 'Order received', hint: 'Waiting for the kitchen to confirm it.' },
  accepted: { label: 'Confirmed', hint: 'Your order is with the kitchen.' },
  preparing: { label: 'Cooking', hint: 'Your karahi is on the coals.' },
  ready: { label: 'Ready', hint: 'Being plated for your table now.' },
  served: { label: 'Served', hint: 'Enjoy your meal.' },
  completed: { label: 'Completed', hint: 'Thank you for dining with us.' },
  cancelled: { label: 'Cancelled', hint: 'Please call your server to reorder.' },
}

export function statusMeta(status) {
  return GUEST_STATUS[status] || { label: status, hint: '' }
}
