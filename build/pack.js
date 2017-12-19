var fs = require('fs')
var archiver = require('archiver')

// 同步manifest的版本
console.log('sync version...')
var pkg = require('../package')
var manifest = fs.readFileSync('manifest.json', {
  encoding: 'utf-8'
})
manifest = manifest.replace(/("version"\s*:\s*)"(\d+\.\d+\.\d+(-\d+))"/, function (_, v) {
  return v + '"' + pkg.version.replace('-', '.') + '"'
})
fs.writeFileSync('manifest.json', manifest)

// 压缩成zip
function zip (manifest, filename) {
  console.log('ziping...', manifest)
  try {
    fs.mkdirSync('versions')
  } catch (e) {}
  var archive = archiver.create('zip', {})
  var output = fs.createWriteStream(filename)
  var zipDirs = ['dist']
  var zipFiles = ['icon.png']

  archive.pipe(output)

  zipDirs.forEach(function (dir) {
    archive.directory(dir, dir)
  })
  zipFiles.forEach(function (file) {
    archive.file(file)
  })
  archive.file(manifest, {
    name: 'manifest.json'
  })
  archive.finalize()
}

zip('manifest.json', 'versions/dh5p-' + pkg.version + '.zip')
