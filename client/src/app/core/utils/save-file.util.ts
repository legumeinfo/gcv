export function saveFile(filename, data, mimetype, extension) {
  const blob = new Blob([data], {type: mimetype});
  // save the data
  const url = window.URL.createObjectURL(blob);
  const a: any = document.createElement("a");
  a.style = "display: none";
  a.href = url;
  const date = new Date();
  a.download = filename + date.toISOString() + "." + extension;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
