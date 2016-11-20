export function bindMenu (el, menuItems) {
  const createMenu = (x, y) => {
    const wrap = document.createElement('div')
    const menu = document.createElement('div')
    wrap.className = 'player-menu'
    menu.className = 'menu'
    wrap.appendChild(menu)

    menu.style.left = `${x}px`
    menu.style.top = `${y}px`

    menu.close = () => document.body.removeChild(wrap)
    wrap.addEventListener('mousedown', event => {
      if (event.target === wrap) {
        document.body.removeChild(wrap)
      }
    })
    wrap.addEventListener('contextmenu', event => event.preventDefault())

    document.body.appendChild(wrap)
    return menu
  }
  const addMenu = (menu, text, cb) => {
    const item = document.createElement('div')
    item.className = 'menu-item'
    item.innerHTML = text
    menu.appendChild(item)

    item.addEventListener('click', () => {
      menu.close()
      cb()
    })
  }
  el.addEventListener('contextmenu', event => {
    const menu = createMenu(event.clientX, event.clientY)
    let items = menuItems
    if (typeof items === 'function') items = items()
    for (let item of items) {
      addMenu(menu, item.text, item.cb)
    }
    event.preventDefault()
  })
}