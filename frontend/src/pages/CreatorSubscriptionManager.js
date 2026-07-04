import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CreatorSubscriptionManager = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      navigate(`/creator/subscriptions/${user.id}`, { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default CreatorSubscriptionManager;
