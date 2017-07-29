export function embedSWF (id: string, src: string) {
  const flash = [
    '<object type="application/x-shockwave-flash" ',
    `id="${id}" `,
    'name="${id}" ',
    'align="middle" ',
    'allowscriptaccess="always" ',
    'allowfullscreen="true" ',
    'allowfullscreeninteractive="true" ',
    'wmode="transparent" ',
    `data="${src}" `,
    'width="100%" ',
    'height="100%">',
    `<param name="src" value="${src}">`,
    '<param name="quality" value="high">',
    '<param name="bgcolor" value="#fff">',
    '<param name="allowscriptaccess" value="always">',
    '<param name="allowfullscreen" value="true">',
    '<param name="wmode" value="transparent">',
    '<param name="allowFullScreenInteractive" value="true">',
    '<param name="flashvars" value="">',
    '</object>'
  ].join('')
  let div = document.createElement('div')
  div.className = 'big-flash-cls' // 防止Chrome屏蔽小块的 Flash
  document.body.appendChild(div)
  div.innerHTML = flash
  return div
}
