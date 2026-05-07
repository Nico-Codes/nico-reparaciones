export const ADMIN_UPLOAD_INTERCEPTOR_OPTIONS = {
  limits: {
    files: 1,
    fileSize: 10 * 1024 * 1024,
  },
} as const;
