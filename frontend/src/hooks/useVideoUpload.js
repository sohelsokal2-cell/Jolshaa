import { useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import API from '../api/axios';

const VALID_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const MAX_REGULAR_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_SHORT_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_REGULAR_DURATION = 600; // 10 minutes
const MAX_SHORT_DURATION = 90; // 90 seconds
const MIN_SHORT_DURATION = 15; // 15 seconds

const useVideoUpload = () => {
  const { socket } = useSocket();
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [isShortForm, setIsShortForm] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | validating | uploading | processing | ready | error
  const [uploadError, setUploadError] = useState('');
  const [postId, setPostId] = useState(null);
  const abortRef = useRef(null);
  const videoRef = useRef(null);
  const previewRef = useRef('');
  const thumbnailRef = useRef('');

  // Keep refs in sync with state
  useEffect(() => { previewRef.current = videoPreview; }, [videoPreview]);
  useEffect(() => { thumbnailRef.current = thumbnail; }, [thumbnail]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      if (thumbnailRef.current) URL.revokeObjectURL(thumbnailRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Listen for processing completion via socket
  useEffect(() => {
    if (!socket || !postId) return;

    const handleProcessingComplete = (data) => {
      if (data.postId === postId) {
        setUploadStatus('ready');
        setThumbnail(data.thumbnailUrl || thumbnailRef.current);
      }
    };

    const handleProcessingFailed = (data) => {
      if (data.postId === postId) {
        setUploadStatus('error');
        setUploadError(data.error || 'Video processing failed. Please try uploading again.');
      }
    };

    const handleProcessingStatus = (data) => {
      if (data.postId === postId && data.status === 'failed') {
        handleProcessingFailed(data);
      }
    };

    socket.on('videoProcessingComplete', handleProcessingComplete);
    socket.on('videoProcessingStatus', handleProcessingStatus);

    return () => {
      socket.off('videoProcessingComplete', handleProcessingComplete);
      socket.off('videoProcessingStatus', handleProcessingStatus);
    };
  }, [socket, postId, thumbnail]);

  // Generate thumbnail from video at 1 second mark
  const generateThumbnail = useCallback((file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = URL.createObjectURL(file);
      video.currentTime = 1;
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        video.currentTime = 1;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbUrl = URL.createObjectURL(blob);
            resolve(thumbUrl);
          } else {
            resolve('');
          }
          URL.revokeObjectURL(video.src);
        }, 'image/jpeg', 0.7);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve('');
      };
    });
  }, []);

  // Select and validate video file
  const selectVideo = useCallback(async (file) => {
    setUploadError('');
    setUploadStatus('validating');

    // Validate type
    if (!VALID_VIDEO_TYPES.includes(file.type)) {
      setUploadError('This video format is not supported. Please use MP4, MOV, or WebM.');
      setUploadStatus('error');
      return false;
    }

    // Validate file size (assume regular video first)
    if (file.size > MAX_REGULAR_SIZE) {
      setUploadError('Video is too large. Maximum size is 500MB.');
      setUploadStatus('error');
      return false;
    }

    // Get video duration and dimensions
    const video = document.createElement('video');
    video.preload = 'metadata';
    const previewUrl = URL.createObjectURL(file);

    const metadata = await new Promise((resolve) => {
      video.onloadedmetadata = () => {
        resolve({
          duration: Math.floor(video.duration),
          width: video.videoWidth,
          height: video.videoHeight,
        });
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => {
        resolve({ duration: 0, width: 0, height: 0 });
        URL.revokeObjectURL(video.src);
      };
      video.src = previewUrl;
    });

    if (metadata.duration === 0) {
      setUploadError('Could not read video metadata. The file may be corrupted.');
      setUploadStatus('error');
      URL.revokeObjectURL(previewUrl);
      return false;
    }

    const { duration, width, height } = metadata;

    // Determine if this should be short form (vertical video <= 90s)
    const detectedShortForm = height > width && duration <= MAX_SHORT_DURATION;
    setIsShortForm(detectedShortForm);

    // Validate duration for short form
    if (detectedShortForm && duration < MIN_SHORT_DURATION) {
      setUploadError(`Short videos must be at least ${MIN_SHORT_DURATION} seconds long.`);
      setUploadStatus('error');
      URL.revokeObjectURL(previewUrl);
      return false;
    }

    // Validate duration for regular video
    if (!detectedShortForm && duration > MAX_REGULAR_DURATION) {
      setUploadError('Regular videos can be up to 10 minutes long. Would you like to post as a short video instead?');
      setUploadStatus('error');
      URL.revokeObjectURL(previewUrl);
      return false;
    }

    // Validate file size for short form
    const maxSize = detectedShortForm ? MAX_SHORT_SIZE : MAX_REGULAR_SIZE;
    if (file.size > maxSize) {
      setUploadError(detectedShortForm
        ? 'Short videos must be under 100MB.'
        : 'Video is too large. Maximum size is 500MB.');
      setUploadStatus('error');
      URL.revokeObjectURL(previewUrl);
      return false;
    }

    // Generate thumbnail
    const thumbUrl = await generateThumbnail(file);

    setVideoFile(file);
    setVideoPreview(previewUrl);
    setThumbnail(thumbUrl);
    setVideoDuration(duration);
    setVideoDimensions({ width, height });
    setUploadStatus('idle');
    return true;
  }, [generateThumbnail]);

  // Start the video upload
  const startUpload = useCallback(async (text, visibility) => {
    if (!videoFile) return null;

    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('text', text || '');
      formData.append('visibility', visibility || 'public');
      formData.append('isShortForm', String(isShortForm));

      // Create abort controller for cancellation
      abortRef.current = new AbortController();

      const res = await API.post('/posts/video-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: abortRef.current.signal,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        },
      });

      setPostId(res.data._id);
      setUploadStatus('processing');
      setUploadProgress(100);

      return res.data._id;
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        setUploadStatus('idle');
        setUploadError('Upload cancelled.');
      } else {
        setUploadStatus('error');
        setUploadError(err.response?.data?.message || 'Upload failed. Check your connection and try again.');
      }
      return null;
    }
  }, [videoFile, isShortForm]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError('Upload cancelled.');
  }, []);

  // Reset everything
  const resetUpload = useCallback(() => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    if (thumbnail) URL.revokeObjectURL(thumbnail);
    if (abortRef.current) abortRef.current.abort();

    setVideoFile(null);
    setVideoPreview('');
    setThumbnail('');
    setVideoDuration(0);
    setVideoDimensions({ width: 0, height: 0 });
    setIsShortForm(false);
    setUploadProgress(0);
    setUploadStatus('idle');
    setUploadError('');
    setPostId(null);
  }, [videoPreview, thumbnail]);

  // Retry after error
  const retryUpload = useCallback((text, visibility) => {
    setUploadError('');
    setUploadStatus('idle');
    setUploadProgress(0);
    return startUpload(text, visibility);
  }, [startUpload]);

  return {
    videoFile,
    videoPreview,
    thumbnail,
    videoDuration,
    videoDimensions,
    isShortForm,
    setIsShortForm,
    uploadProgress,
    uploadStatus,
    uploadError,
    postId,
    selectVideo,
    startUpload,
    cancelUpload,
    resetUpload,
    retryUpload,
  };
};

export default useVideoUpload;
