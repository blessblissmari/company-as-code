import yaml from 'js-yaml'

export function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportJson(name: string, data: unknown) {
  download(`${name}.json`, JSON.stringify(data, null, 2), 'application/json')
}

export function exportYaml(name: string, data: unknown) {
  download(`${name}.yaml`, yaml.dump(data, { noRefs: true, lineWidth: 120 }), 'text/yaml')
}
