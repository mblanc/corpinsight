type ProgressCallback = (progress: string) => void

class ProgressStore {
  private sessions: Map<
    string,
    {
      progress: string[]
      callbacks: Set<ProgressCallback>
    }
  > = new Map()

  initSession(sessionId: string) {
    this.sessions.set(sessionId, {
      progress: [],
      callbacks: new Set(),
    })
  }

  addProgress(sessionId: string, progress: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.progress.push(progress)

    // Notify all subscribers
    session.callbacks.forEach((callback) => {
      callback(progress)
    })
  }

  getProgress(sessionId: string): string[] {
    return this.sessions.get(sessionId)?.progress || []
  }

  subscribe(sessionId: string, callback: ProgressCallback) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.callbacks.add(callback)
  }

  unsubscribe(sessionId: string, callback: ProgressCallback) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    session.callbacks.delete(callback)
  }

  clearSession(sessionId: string) {
    // Keep the session data for a while in case clients are still connected
    setTimeout(() => {
      this.sessions.delete(sessionId)
    }, 60000) // Clean up after 1 minute
  }
}

export const progressStore = new ProgressStore()

