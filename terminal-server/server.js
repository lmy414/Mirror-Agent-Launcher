import { spawn } from 'child_process'
import { WebSocketServer } from 'ws'

const PORT = 9228
const wss = new WebSocketServer({ port: PORT })

console.log(`[terminal-server] ws://localhost:${PORT}`)

wss.on('connection', (ws) => {
  let child = null

  ws.on('message', (raw) => {
    let msg
    try { msg = JSON.parse(raw.toString()) } catch { return }

    if (msg.type === 'spawn') {
      const cmd = msg.command
      const args = msg.args ?? []
      const cwd = msg.cwd ?? process.cwd()

      if (child) {
        try { child.kill() } catch {}
      }

      child = spawn(cmd, args, {
        cwd,
        shell: process.platform === 'win32',
        env: { ...process.env, ...(msg.env ?? {}) },
      })

      child.stdout?.on('data', (data) => {
        ws.send(JSON.stringify({ type: 'data', data: data.toString() }))
      })
      child.stderr?.on('data', (data) => {
        ws.send(JSON.stringify({ type: 'data', data: data.toString() }))
      })
      child.on('exit', (code, sig) => {
        ws.send(JSON.stringify({ type: 'exit', code, signal: sig ?? null }))
        child = null
      })
      child.on('error', (err) => {
        ws.send(JSON.stringify({ type: 'error', message: err.message }))
      })

      ws.send(JSON.stringify({ type: 'spawned', pid: child.pid }))

    } else if (msg.type === 'stdin') {
      if (child) child.stdin?.write(msg.data)
    } else if (msg.type === 'resize') {
      if (child?.stdout?.writable) {
        // Optional: resize handling for pty
      }
    } else if (msg.type === 'kill') {
      if (child) { try { child.kill() } catch {}; child = null }
    }
  })

  ws.on('close', () => {
    if (child) { try { child.kill() } catch {}; child = null }
  })
})
