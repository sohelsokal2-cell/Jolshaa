import { useState, useEffect } from 'react';
import API from '../api/axios';

const Poll = ({ postId, isOwner }) => {
  const [poll, setPoll] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expiresIn, setExpiresIn] = useState('24');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPoll();
  }, [postId]);

  const fetchPoll = async () => {
    try {
      const res = await API.get(`/polls/${postId}`);
      setPoll(res.data.poll);
    } catch (err) {
      // No poll exists yet
    }
  };

  const handleCreate = async () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2) return;

    setLoading(true);
    try {
      const res = await API.post('/polls', {
        postId,
        question: question.trim(),
        options: options.filter((o) => o.trim()),
        expiresIn,
      });
      setPoll(res.data.poll);
      setShowCreate(false);
      setQuestion('');
      setOptions(['', '']);
    } catch (err) {
      console.error('Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionIndex) => {
    try {
      const res = await API.post(`/polls/${postId}/vote`, { optionIndex });
      setPoll((prev) => ({
        ...prev,
        options: res.data.poll.options,
        totalVotes: res.data.poll.totalVotes,
      }));
    } catch (err) {
      console.error('Failed to vote');
    }
  };

  if (poll) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-2">
        <h4 className="font-semibold text-gray-800 mb-3">{poll.question}</h4>
        <div className="space-y-2">
          {poll.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !opt.hasVoted && !poll.isExpired && handleVote(i)}
              disabled={opt.hasVoted || poll.isExpired}
              className={`w-full relative rounded-lg p-3 text-left text-sm transition ${
                opt.hasVoted
                  ? 'border-2 border-blue-500 bg-blue-50'
                  : 'border border-gray-300 hover:border-blue-400'
              }`}
            >
              <div
                className="absolute inset-0 bg-blue-100 rounded-lg transition-all"
                style={{ width: `${opt.percentage}%`, opacity: 0.3 }}
              />
              <div className="relative flex justify-between">
                <span>{opt.text}</span>
                <span className="font-medium">{opt.percentage}%</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">{poll.totalVotes} votes</p>
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="mt-2">
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add Poll
        </button>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {options.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={(e) => {
                const newOptions = [...options];
                newOptions[i] = e.target.value;
                setOptions(newOptions);
              }}
              placeholder={`Option ${i + 1}`}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}
          {options.length < 10 && (
            <button
              onClick={() => setOptions([...options, ''])}
              className="text-sm text-blue-600"
            >
              + Add option
            </button>
          )}
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          >
            <option value="1">1 hour</option>
            <option value="6">6 hours</option>
            <option value="24">24 hours</option>
            <option value="72">3 days</option>
            <option value="168">7 days</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Poll'}
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Poll;
