export function getLast7DaysRange() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(to.getDate() - 6)

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}
