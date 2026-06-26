import { useState, useEffect } from 'react';
import API from '../api/axios';

const QAPost = ({ postId, isOwner }) => {
  const [qa, setQa] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQA();
  }, [postId]);

  const fetchQA = async () => {
    try {
      const res = await API.get(`/qa/${postId}`);
      setQa(res.data.qa);
    } catch (err) {
      // No Q&A yet
    }
  };

  const handleCreate = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await API.post('/qa', {
        postId,
        question: question.trim(),
        isAnonymous,
      });
      setQa(res.data.qa);
      setShowCreate(false);
      setQuestion('');
    } catch (err) {
      console.error('Failed to create Q&A');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!answerText.trim()) return;

    try {
      const res = await API.post(`/qa/${postId}/answers`, { text: answerText });
      setQa((prev) => ({
        ...prev,
        answers: [...prev.answers, res.data.answer],
      }));
      setAnswerText('');
    } catch (err) {
      console.error('Failed to post answer');
    }
  };

  const handleUpvote = async (answerId) => {
    try {
      const res = await API.put(`/qa/${postId}/answers/${answerId}/upvote`);
      setQa((prev) => ({
        ...prev,
        answers: prev.answers.map((a) =>
          a._id === answerId
            ? { ...a, upvoteCount: res.data.upvoteCount, hasUpvoted: res.data.hasUpvoted }
            : a
        ),
      }));
    } catch (err) {}
  };

  if (qa) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mt-2">
        <h4 className="font-semibold text-gray-800 mb-2">❓ {qa.question}</h4>
        <div className="space-y-3">
          {qa.answers.map((ans) => (
            <div key={ans._id} className="bg-white rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="text-sm">{ans.text}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleUpvote(ans._id)}
                      className={`text-xs flex items-center gap-1 ${
                        ans.hasUpvoted ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      👍 {ans.upvoteCount}
                    </button>
                    <span className="text-xs text-gray-400">
                      {ans.user?.name || 'Anonymous'} · {new Date(ans.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
            placeholder="Write an answer..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnswer}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Answer
          </button>
        </div>
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="mt-2">
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          + Add Q&A
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            Post anonymously
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Q&A'}
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

export default QAPost;
