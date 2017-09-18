let bgPort = null
onconnect = ({ports}) => {
  for (let port of ports) {
    port.start()
    port.onmessage = ({data}) => {
      if (data.type === 'connect') {
        if (bgPort === null) {
          throw new Error('No port is waiting')
        }
        const channel = new MessageChannel()
        bgPort.postMessage({
          type: 'connect',
          port: channel.port1
        }, [channel.port1])
        port.postMessage({
          type: 'connect',
          port: channel.port2
        }, [channel.port2])
      } else if (data.type === 'registerBackground') {
        bgPort = port
      }
    }
  }
}
