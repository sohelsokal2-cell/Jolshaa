import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlbumGrid from '../components/AlbumGrid';

const Profile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('about');

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">Jolshaa</h1>
        <div className="flex items-center gap-4">
          <Link to="/edit-profile" className="text-sm text-blue-600 hover:underline">
            Edit Profile
          </Link>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-blue-400 to-blue-600">
            {user.coverPhoto && (
              <img
                src={user.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4">
              <img
                src={user.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
                alt={user.name}
                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md"
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
            <p className="text-gray-500 text-sm mt-1">{user.email}</p>

            {user.bio && (
              <p className="text-gray-700 mt-3">{user.bio}</p>
            )}

            <div className="flex gap-6 mt-4 text-sm text-gray-500">
              {user.phone && <span>Phone: {user.phone}</span>}
              {user.gender && <span>Gender: {user.gender}</span>}
              {user.dateOfBirth && (
                <span>DOB: {new Date(user.dateOfBirth).toLocaleDateString()}</span>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-4">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mt-4">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 py-3 text-center font-medium text-sm ${
                activeTab === 'about'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={`flex-1 py-3 text-center font-medium text-sm ${
                activeTab === 'albums'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Albums
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'albums' && <AlbumGrid userId={user._id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
