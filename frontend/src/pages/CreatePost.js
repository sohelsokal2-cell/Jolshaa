import { useNavigate } from 'react-router-dom';
import CreatePostBox from '../components/CreatePostBox';

const CreatePost = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto p-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600">Cancel</button>
        <h2 className="font-display text-lg font-semibold">Create Post</h2>
        <div className="w-12" />
      </div>
      <CreatePostBox onPostCreated={() => navigate('/feed')} />
    </div>
  );
};

export default CreatePost;
