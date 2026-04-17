import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Send, ChevronLeft, Package, BadgeCheck } from 'lucide-react';
import { AuthContext } from '../../authentication/AuthContext';
import ErrorMessage from '../Messages/error';
import SuccessfullMessage from '../Messages/successful';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const getApiErrorMessage = (error, fallbackMessage) => {
  const data = error?.response?.data;
  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return data.non_field_errors[0];
  }

  const firstFieldError = Object.values(data).find((value) => Array.isArray(value) && value.length > 0);
  if (firstFieldError) return firstFieldError[0];

  return fallbackMessage;
};

const buildCustomerDetails = (user) => {
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const customerName =
    user?.full_name ||
    fullName ||
    user?.name ||
    user?.username ||
    user?.email ||
    'Customer';
  const customerPhone =
    user?.phone ||
    user?.phone_number ||
    user?.mobile ||
    localStorage.getItem('customer_phone') ||
    '';

  return {
    customer_name: String(customerName).trim() || 'Customer',
    customer_phone: String(customerPhone).trim(),
  };
};

function Product() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);

  const [item, setItem] = useState(location.state ?? null);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API}/api/products/${id}/`);
        if (!ignore) {
          setItem(response.data);
          setQuantity(1);
        }
      } catch {
        if (!ignore) setError('Unable to load product details.');
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      ignore = true;
    };
  }, [id]);

  const handleQuantityChange = (e) => {
    const maxStock = Math.max(item?.quantity ?? 1, 1);
    const next = Number(e.target.value);

    if (Number.isNaN(next)) {
      setQuantity(1);
      return;
    }

    if (next < 1) {
      setQuantity(1);
      return;
    }

    if (next > maxStock) {
      setQuantity(maxStock);
      return;
    }

    setQuantity(next);
  };

const handleOrder = async () => {
    setActionError('');
    setSuccessMessage('');

    const token = localStorage.getItem('access');
    if (!token) {
      setActionError('Your session has expired. Please login again.');
      navigate('/');
      return;
    }

    const totalAmount = (item.unit_price * quantity).toFixed(2);
    const customerDetails = buildCustomerDetails(user);
    const pendingOrderPayload = {
      ...customerDetails,
      items: [
        {
          product: id,
          quantity,
        },
      ],
    };
    setIsOrdering(true);

    try {
      const response = await axios.post(
        `${API}/api/payments/initialize/`, 
        { 
          amount: totalAmount,
          order_payload: pendingOrderPayload,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === "success") {
        const localTxRef =
          response.data.local_tx_ref ||
          response.data?.data?.tx_ref ||
          response.data?.data?.trx_ref ||
          '';
        if (localTxRef) {
          localStorage.setItem('latest_tx_ref', localTxRef);
        }

        const checkoutUrl = response.data?.data?.checkout_url;
        if (!checkoutUrl) {
          setActionError('Payment initialized but checkout link is missing.');
          return;
        }

        // Redirect to Chapa's secure payment page
        window.location.href = checkoutUrl;
      } else {
        setActionError(response.data.message || 'Payment initialization failed.');
      }
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Something went wrong while initiating payment.'));
    } finally {
      setIsOrdering(false);
    }
  };

  const handleAddToCart = async () => {
    if (authLoading) return;
    setActionError('');
    setSuccessMessage('');

    const token = localStorage.getItem('access');
    if (!token) {
      setActionError('Please login first.');
      navigate('/');
      return;
    }

    try {
      await axios.post(
        `${API}/api/cart/add_item/`,
        {
          product_id: id,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage('Added to cart.');
      navigate('/home/cart');
    } catch {
      setActionError('Unable to add item to cart.');
    }
  };

  const handleOrderWithAuth = () => {
    if (authLoading) return;
    
    const token = localStorage.getItem('access');

    if (token) {
      handleOrder();
    } else {
      setActionError('Please login to place an order.');
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400 font-medium">Loading premium product...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="m-10 rounded-xl bg-red-50 p-12 text-center text-red-600">
        {error || 'Product not found.'}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 md:px-10">
      <div className="max-w-6xl mx-auto">
        {(actionError || successMessage) && (
          <div className="mb-4">
            {actionError ? (
              <ErrorMessage msg={actionError} onClose={() => setActionError('')} />
            ) : (
              <SuccessfullMessage msg={successMessage} onClose={() => setSuccessMessage('')} />
            )}
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-green-600 transition-colors mb-6 font-semibold"
        >
          <ChevronLeft size={20} /> Back to Gallery
        </button>

        <div className="bg-white rounded-4xl shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 bg-stone-100 p-8 flex items-center justify-center">
            <img
              src={item.product_image || 'https://via.placeholder.com/600'}
              alt={item.name}
              className="w-full h-auto max-h-[450px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
            <div className="flex items-center gap-2 text-green-600 text-sm font-bold uppercase tracking-widest mb-4">
              <BadgeCheck size={18} /> Midroc Verified
            </div>

            <h1 className="text-4xl font-black text-stone-900 leading-tight mb-2">{item.name}</h1>
            <p className="text-stone-400 font-mono text-sm mb-6">SKU: {item.sku || 'N/A'}</p>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-bold text-green-600">${item.unit_price ?? '0.00'}</span>
              <span className="text-stone-400 text-sm">USD Per Unit</span>
            </div>

            <div className="mb-8">
              <h3 className="text-stone-900 font-bold mb-2 flex items-center gap-2">
                <Package size={18} className="text-stone-400" /> Description
              </h3>
              <p className="text-stone-600 leading-relaxed text-lg">
                {item.description || 'No detailed description available for this specific item.'}
              </p>
            </div>

            <div className="mb-10">
              <div className="inline-flex items-center px-4 py-2 rounded-lg bg-stone-50 border border-stone-100">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-3 animate-pulse" />
                <span className="text-stone-700 font-bold text-sm">{item.quantity ?? 0} units currently in stock</span>
              </div>

              <div className="inline-flex items-center gap-3 pl-3 ml-2 rounded-xl bg-stone-50 border border-stone-200 shadow-sm">
                <span className="text-stone-500 text-sm font-medium">Units:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(item.quantity ?? 1, 1)}
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="w-20 rounded-lg px-3 py-2 bg-white text-stone-800 font-bold text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                />
              </div>
            </div>

            <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-3 py-4 rounded-2xl border-2 border-stone-200 text-stone-700 font-bold text-base hover:bg-stone-50 hover:border-stone-300 transition-all active:scale-95"
              >
                <ShoppingCart size={22} /> Cart
              </button>

              <button
                onClick={handleOrderWithAuth}
                disabled={authLoading || isOrdering || item.quantity < 1}
                className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isOrdering ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <Send size={22} /> Buy Now
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Product;
