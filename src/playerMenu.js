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
const addTextMenu = (menu, text, cb) => {
  const item = document.createElement('div')
  item.className = 'menu-item'
  item.innerText = text
  menu.appendChild(item)

  item.addEventListener('click', () => {
    menu.close()
    cb()
  })
}
const addEleMenu = (menu, ele) => {
  const item = document.createElement('div')
  item.className = 'menu-ele'
  item.appendChild(ele)
  menu.appendChild(item)
}
const addLabelMenu = (menu, label) => {
  const item = document.createElement('div')
  item.className = 'menu-item'
  item.innerText = label
  menu.appendChild(item)
}
const addDash = (menu) => {
  const item = document.createElement('div')
  item.className = 'menu-dash'
  menu.appendChild(item)
}
export function bindMenu (el, menuItems) {
  el.addEventListener('contextmenu', event => {
    const menu = createMenu(event.clientX, event.clientY)
    let items = menuItems
    if (typeof items === 'function') items = items()
    for (let item of items) {
      if (item.text) {
        addTextMenu(menu, item.text, item.cb)
      } else if (item.el) {
        addEleMenu(menu, item.el, item.cb)
      } else if (item.label) {
        addLabelMenu(menu, item.label)
      } else {
        addDash(menu)
      }
    }
    const rect = menu.getBoundingClientRect()
    if (menu.offsetLeft + menu.offsetWidth > document.documentElement.clientWidth) {
      menu.style.left = `${rect.left - rect.width}px`
    }
    if (menu.offsetTop + menu.offsetHeight > document.documentElement.clientHeight) {
      menu.style.top = `${rect.top - rect.height}px`
    }
    event.preventDefault()
  })
}
