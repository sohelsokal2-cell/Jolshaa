const VideoUploadProgress = ({
  uploadStatus,
  uploadProgress,
  uploadError,
  isShortForm,
  onRetry,
  onCancel,
}) => {
  if (uploadStatus === 'idle' || uploadStatus === 'validating') return null;

  const statusMessages = {
    uploading: `Uploading... ${uploadProgress}%`,
    processing: 'Processing video...',
    ready: 'Video ready!',
    error: uploadError || 'Upload failed',
  };

  return (
    <div className="rounded-lg border border-jolshaa-outline-variant p-3 mt-2">
      {/* Status text */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {uploadStatus === 'uploading' && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {uploadStatus === 'processing' && (
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          )}
          {uploadStatus === 'ready' && (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {uploadStatus === 'error' && (
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className={`text-xs font-medium ${
            uploadStatus === 'ready' ? 'text-green-600' :
            uploadStatus === 'error' ? 'text-red-600' :
            'text-jolshaa-on-surface-variant'
          }`}>
            {statusMessages[uploadStatus]}
          </span>
          {isShortForm && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 font-medium">
              Short
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {uploadStatus === 'uploading' && (
            <button
              onClick={onCancel}
              className="text-xs text-jolshaa-on-surface-variant/60 hover:text-red-500 transition-colors"
            >
              Cancel
            </button>
          )}
          {uploadStatus === 'error' && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
        <div className="w-full h-1.5 bg-jolshaa-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              uploadStatus === 'processing'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-blue-500'
            }`}
            style={{ width: `${uploadStatus === 'processing' ? 100 : uploadProgress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {uploadStatus === 'error' && uploadError && (
        <p className="text-xs text-red-500 mt-1">{uploadError}</p>
      )}
    </div>
  );
};

export default VideoUploadProgress;
