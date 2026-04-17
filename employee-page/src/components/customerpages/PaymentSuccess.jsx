import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying your payment...');
  const [isError, setIsError] = useState(false);

  const txRef = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (
      params.get('tx_ref') ||
      params.get('trx_ref') ||
      params.get('transaction_ref') ||
      localStorage.getItem('latest_tx_ref') ||
      ''
    );
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!txRef) {
        if (!cancelled) {
          setIsError(true);
          setStatus('Missing transaction reference. Please contact support.');
        }
        return;
      }

      try {
        const response = await axios.get(`${API}/api/payments/verify/${txRef}/`);
        const paymentState = response?.data?.data?.status?.toLowerCase();

        if (cancelled) return;

        if (paymentState === 'success') {
          localStorage.removeItem('latest_tx_ref');
          setIsError(false);
          setStatus('Payment successful. Thank you for your order.');
        } else if (paymentState === 'pending') {
          setIsError(true);
          setStatus('Payment is still pending. Please wait a moment and refresh.');
        } else {
          setIsError(true);
          setStatus('Payment could not be confirmed.');
        }
      } catch (error) {
        if (!cancelled) {
          setIsError(true);
          setStatus(error?.response?.data?.message || 'Could not verify payment.');
        }
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [txRef]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-stone-200 rounded-3xl p-8 shadow-sm text-center">
        <h1 className="text-2xl font-black text-stone-900 mb-4">Payment Status</h1>
        <p className={`text-base ${isError ? 'text-red-600' : 'text-green-700'}`}>{status}</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 px-5 py-3 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-700 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;
