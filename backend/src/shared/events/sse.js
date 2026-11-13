class SseHub {
  constructor() {
    this.clients = new Set()
    setInterval(() => {
      for (const res of this.clients) {
        try { res.write(': ping\n\n') } catch { this.clients.delete(res) }
      }
    }, 25000).unref()
  }

  addClient(res) {
    this.clients.add(res)
    res.on('close', () => this.clients.delete(res))
  }

  broadcast(type, data) {
    const frame = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of this.clients) {
      try { res.write(frame) } catch { this.clients.delete(res) }
    }
  }
}

export default new SseHub()
