var script = document.createElement('script')
var blob = new Blob([`//hehe
`], { type: 'text/javascript' })
script.src = URL.createObjectURL(blob)
document.documentElement.appendChild(script)
