import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const PaymentResult = ({ success }) => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <Layout>
      <div className="max-w-md mx-auto p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          success ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
        }`}>
          {success ? (
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          {success ? 'Payment Successful!' : 'Payment Failed'}
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          {success
            ? 'Your payment has been processed successfully.'
            : 'Something went wrong. Please try again.'}
        </p>
        {sessionId && (
          <p className="text-xs text-neutral-400 mb-4">Session: {sessionId}</p>
        )}
        <Link
          to="/feed"
          className="inline-block px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Back to Feed
        </Link>
      </div>
    </Layout>
  );
};

export const PaymentSuccess = () => <PaymentResult success={true} />;
export const PaymentCancel = () => <PaymentResult success={false} />;
export const PaymentFail = () => <PaymentResult success={false} />;
