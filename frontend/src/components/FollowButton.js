import { useState } from 'react';
import API from '../api/axios';

const FollowButton = ({ userId, initialFollowing, initialFollowerCount }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing || false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount || 0);

  const handleToggle = async () => {
    try {
      const res = await API.post(`/creator/follow/${userId}`);
      setIsFollowing(res.data.isFollowing);
      setFollowerCount(res.data.followerCount);
    } catch (err) {
      console.error('Failed to follow');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
          isFollowing
            ? 'bg-jolshaa-surface-container text-jolshaa-on-surface hover:bg-jolshaa-surface-container-high'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
      <span className="text-sm text-jolshaa-on-surface-variant">{followerCount} followers</span>
    </div>
  );
};

export default FollowButton;
