import { useState, useEffect } from 'react';
import API from '../api/axios';

const PostScheduler = () => {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchScheduled();
  }, []);

  const fetchScheduled = async () => {
    try {
      const res = await API.get('/scheduler/schedule');
      setScheduledPosts(res.data.posts);
    } catch (err) {
      console.error('Failed to fetch scheduled posts');
    }
  };

  const handleSchedule = async (postData) => {
    if (!scheduleDate || !scheduleTime) return;

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledAt <= new Date()) {
      alert('Schedule time must be in the future');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', postData.text);
      formData.append('visibility', postData.visibility);
      formData.append('scheduledAt', scheduledAt.toISOString());

      if (postData.media) {
        postData.media.forEach(file => formData.append('media', file));
      }

      await API.post('/scheduler/schedule', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowScheduler(false);
      setScheduleDate('');
      setScheduleTime('');
      fetchScheduled();
    } catch (err) {
      console.error('Failed to schedule post');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await API.delete(`/scheduler/schedule/${id}`);
      fetchScheduled();
    } catch (err) {
      console.error('Failed to cancel');
    }
  };

  return {
    scheduledPosts,
    showScheduler,
    setShowScheduler,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    loading,
    handleSchedule,
    handleCancel,
  };
};

export default PostScheduler;
