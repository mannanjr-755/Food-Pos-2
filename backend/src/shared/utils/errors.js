export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100
