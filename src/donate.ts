let dialog: HTMLDivElement = null
export function getDialog (title: string, content: string, qrcodes: {src: string, desc: string}[]) {
  if (dialog) {
    return dialog
  }
  dialog = document.createElement('div')
  dialog.className = 'donate-dialog'
  const wrap = document.createElement('div')
  wrap.className = 'donate-wrap'
  const titleEl = document.createElement('h3')
  titleEl.className = 'donate-title'
  titleEl.innerText = title
  const contentEl = document.createElement('div')
  contentEl.className = 'donate-content'
  contentEl.innerText = content
  const qrcodeEl = document.createElement('div')
  qrcodeEl.className = 'donate-qrcode-bar'
  for (let i of qrcodes) {
    const qrcodeBox = document.createElement('div')
    qrcodeBox.className = 'donate-qrcode-box'
    const qrcode = document.createElement('img')
    qrcode.className = 'donate-qrcode-img'
    qrcode.src = i.src
    const qrcodeDesc = document.createElement('div')
    qrcodeDesc.className = 'donate-qrcode-desc'
    qrcodeDesc.innerText = i.desc
    qrcodeBox.appendChild(qrcode)
    qrcodeBox.appendChild(qrcodeDesc)
    qrcodeEl.appendChild(qrcodeBox)
  }
  const closeEl = document.createElement('div')
  closeEl.className = 'donate-close-btn'
  const close = () => {
    dialog.style.display = 'none'
  }
  closeEl.addEventListener('click', close)
  wrap.appendChild(titleEl)
  wrap.appendChild(contentEl)
  wrap.appendChild(qrcodeEl)
  wrap.appendChild(closeEl)
  dialog.appendChild(wrap)
  dialog.style.display = 'none'
  return dialog
}
