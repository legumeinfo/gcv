// Downloads data as a file named by the prefix, the time and the extension,
// and returns the file's name and size in bytes.
export function saveFile(
  filename: string,
  data: BlobPart,
  mimetype: string,
  extension: string,
): { name: string; bytes: number } {
  const blob = new Blob([data], { type: mimetype });
  // save the data
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  // a time without colons, which file systems refuse
  const time = new Date().toISOString().replace(/:/g, '-');
  a.download = filename + time + '.' + extension;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
  return { name: a.download, bytes: blob.size };
}
