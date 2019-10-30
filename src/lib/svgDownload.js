export const generateDownload = (element) => {
  const svgDoctype = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>'

  // serialize our SVG XML to a string.
  let svgString = (new XMLSerializer()).serializeToString(element)

  // reduce the SVG path by cutting off floating point values after the first digit beyond floating point (~50% less MBs)
  // eslint-disable-next-line no-useless-escape
  svgString = svgString.replace(/([\-+]?\d{1,}\.\d{3,}([eE][\-+]?\d+)?)/g, function (x) {
    return (+x).toFixed(1)
  })

  const blob = new Blob([svgDoctype + svgString], {type: 'image/svg+xml;charset=utf-8'})

  /* This portion of script saves the file to local filesystem as a download */
  const svgUrl = URL.createObjectURL(blob)

  const downloadLink = document.createElement('a')
  downloadLink.href = svgUrl
  downloadLink.download = 'streamlines' + Date.now() + '.svg'
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
  URL.revokeObjectURL(svgUrl)
}
