import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  const startDate = new Date(event.startDate);
  const isPast = startDate < new Date();

  return (
    <Link
      to={`/events/${event._id}`}
      className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition ${isPast ? 'opacity-75' : ''}`}
    >
      {event.coverPhoto && (
        <img src={event.coverPhoto} alt="" className="w-full h-40 object-cover" />
      )}
      {!event.coverPhoto && (
        <div className="w-full h-40 bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center">
          <svg className="w-12 h-12 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
            event.visibility === 'public' ? 'bg-green-100 text-green-700' :
            event.visibility === 'friends' ? 'bg-blue-100 text-blue-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {event.visibility === 'invite_only' ? 'Invite Only' : event.visibility}
          </span>
          {isPast && <span className="text-xs text-gray-400">Past</span>}
        </div>
        <h3 className="font-semibold text-gray-800 mt-1">{event.title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' · '}
          {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </p>
        {event.location && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
          <span>{event.attendeeCount || 0} going</span>
          {event.maybeCount > 0 && <span>{event.maybeCount} maybe</span>}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <img
            src={event.creator?.profilePhoto || 'https://res.cloudinary.com/demo/image/upload/v1556418119/default-avatar.png'}
            alt=""
            className="w-5 h-5 rounded-full object-cover"
          />
          <span className="text-xs text-gray-500">Created by {event.creator?.name}</span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
