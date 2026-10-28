export const UNSUPPORTED_MANUSCRIPT = 'Unsupported file type. Please upload a Word document (.doc or .docx) or paste a Google Docs link.';

export function validateManuscriptFile(file: {name: string | null; type: string | null; size: number | null}): string | null {
  const mime = file.name?.toLowerCase().endsWith('.doc') ? 'application/msword' :
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (!file.name || !/\.docx?$/i.test(file.name) || (file.type && file.type !== mime)) return UNSUPPORTED_MANUSCRIPT;
  if (file.size === null) return 'Could not determine the file size. Please choose another Word document.';
  if (file.size === 0) return 'The uploaded document appears to be empty or contains no extractable text.';
  if (file.size > 25 * 1024 * 1024) return 'This file is larger than 25 MB. Please upload a smaller Word document.';
  return null;
}
