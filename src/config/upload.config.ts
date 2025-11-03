export const uploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  allowedMimeTypes: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  allowedExtensions: ['.pdf', '.txt', '.md', '.docx'],
};

export const getMimeTypeDescription = (mimeType: string): string => {
  const mimeTypeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/plain': 'TXT',
    'text/markdown': 'Markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'DOCX',
  };
  return mimeTypeMap[mimeType] || mimeType;
};

export const getAllowedTypesMessage = (): string => {
  return uploadConfig.allowedMimeTypes.map(getMimeTypeDescription).join(', ');
};
