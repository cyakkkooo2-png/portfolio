export function shouldBatchUpload(type, files = []) {
  return (type === 'video' || type === 'image') && files.length > 1;
}

export function batchTitleForFile(file = {}) {
  const name = String(file.name || '');
  return name.replace(/\.[^/.]+$/, '') || name;
}

export function isDuplicateUploadError(error = {}) {
  return Number(error.status) === 409 && error.code === 'DUPLICATE_WORK';
}
