import { clearAuth, getAPIBase, getToken } from './api.js'

let socketTask = null
let listeners = []
let reconnectEnabled = true

function wsBase() {
  const base = getAPIBase()
  if (base.indexOf('https://') === 0) return base.replace('https://', 'wss://')
  if (base.indexOf('http://') === 0) return base.replace('http://', 'ws://')
  return 'ws://localhost:8080'
}

export function connectRealtime() {
  const token = getToken()
  if (!token) return
  if (socketTask) return socketTask
  reconnectEnabled = true

  socketTask = uni.connectSocket({
    url: `${wsBase()}/ws?role=admin&token=${encodeURIComponent(token)}`,
    complete: () => {}
  })

  socketTask.onMessage((res) => {
    let payload
    try {
      payload = JSON.parse(res.data)
    } catch (err) {
      return
    }
    if (payload.event === 'session.revoked') {
      handleSessionRevoked()
      return
    }
    listeners.forEach((listener) => listener(payload))
  })

  socketTask.onClose(() => {
    socketTask = null
    if (reconnectEnabled) setTimeout(connectRealtime, 2000)
  })

  return socketTask
}

export function disconnectRealtime() {
  reconnectEnabled = false
  if (socketTask) {
    const task = socketTask
    socketTask = null
    task.close({})
  }
  listeners = []
}

function handleSessionRevoked() {
  reconnectEnabled = false
  clearAuth()
  if (socketTask) {
    const task = socketTask
    socketTask = null
    task.close({})
  }
  uni.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/login/login' })
  }, 500)
}

export function onRealtime(listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((item) => item !== listener)
  }
}
