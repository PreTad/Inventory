import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ChevronLeft, CreditCard, PackageCheck, Plus, Minus } from 'lucide-react';
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

function Cart() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  
  // In a real app, this might come from a Context or a dedicated Cart API
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Simulating fetching cart data from local storage or API
    // const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    let ignore = false;
    const fetchCart = async() =>{
      const token = localStorage.getItem('access');

      if (!token) {
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (!ignore) {
          setCartItems(Array.isArray(savedCart) ? savedCart : []);
          setLoading(false);
        }
        return;
      }

      try{
        setLoading(true);
        setError('');
        const res = await axios.get(`${API}/api/cart/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if(!ignore){
          const cart = Array.isArray(res.data) ? res.data[0] : res.data;
          const items = Array.isArray(cart?.items) ? cart.items : [];
          const normalizedItems = items.map((cartItem) => ({
            id: cartItem.product?.id ?? cartItem.id,
            name: cartItem.product?.name ?? 'Unnamed product',
            unit_price: Number(cartItem.product?.unit_price ?? 0),
            product_image: cartItem.product?.product_image ?? '',
            cartQuantity: Number(cartItem.quantity ?? 1)
          }));
          setCartItems(normalizedItems);
        }
      }catch(err){
        if (!ignore) {
          const status = err?.response?.status;
          if (status === 401) {
            setError('Please login to view your cart.');
          } else {
            setError('Unable to load cart.');
          }
          setCartItems([]);
        }
      }finally{
        if(!ignore) setLoading(false);
      }
    }
    
    fetchCart();
    return () =>{
      ignore = true;
    }
  }, []);

  const updateQuantity = (id, delta) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.cartQuantity + delta);
        return { ...item, cartQuantity: newQty };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = async (id) => {
    setError('');
    setSuccessMessage('');
    const previous = cartItems;
    const filtered = cartItems.filter(item => item.id !== id);

    setCartItems(filtered);
    localStorage.setItem('cart', JSON.stringify(filtered));

    const token = localStorage.getItem('access');
    if (!token) return;

    try {
      await axios.delete(`${API}/api/cart/remove_item/`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          product_id: id
        }
      });
    } catch (err) {
      setCartItems(previous);
      localStorage.setItem('cart', JSON.stringify(previous));
      if (err?.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError('Unable to remove item from cart.');
      }
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.unit_price * item.cartQuantity), 0);

  const handleCheckout = async () => {
    setError('');
    setSuccessMessage('');
    
    const token = localStorage.getItem('access');
    if (!token) {
      setError('Your session has expired. Please login again.');
      return navigate('/');
    }

    setLoading(true); // Reuse the loading state to show processing

    try {
      const customerDetails = buildCustomerDetails(user);
      const pendingOrderPayload = {
        ...customerDetails,
        items: cartItems.map((cartItem) => ({
          product: cartItem.id,
          quantity: Number(cartItem.cartQuantity),
        })),
      };

      const response = await axios.post(
        `${API}/api/payments/initialize/`, 
        { amount: subtotal.toFixed(2), order_payload: pendingOrderPayload }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
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
          setError('Payment initialized but checkout link is missing.');
          return;
        }

        // 2. Clear local cart before redirecting
        localStorage.removeItem('cart');
        
        // 3. Redirect to Chapa's secure payment page
        window.location.href = checkoutUrl;
      } else {
        setError(response.data.message || 'Payment initialization failed.');
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      setError(getApiErrorMessage(err, 'Checkout failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse">Loading your cart...</div>;

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 md:px-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-stone-500 hover:text-green-600 transition-colors mb-8 font-semibold"
        >
          <ChevronLeft size={20} /> Continue Shopping
        </button>

        <h1 className="text-3xl font-black text-stone-900 mb-8 flex items-center gap-3">
          <ShoppingCart className="text-green-600" size={32} /> Your Shopping Cart
        </h1>

        {(error || successMessage) && (
          <div className="mb-6">
            {error ? (
              <ErrorMessage msg={error} onClose={() => setError('')} />
            ) : (
              <SuccessfullMessage msg={successMessage} onClose={() => setSuccessMessage('')} />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-sm">
                <PackageCheck size={64} className="mx-auto text-stone-200 mb-4" />
                <p className="text-stone-500 text-lg font-medium">Your cart is currently empty.</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 md:p-6 border border-stone-100 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-stone-100 rounded-xl shrink-0 overflow-hidden">
                      <img src={item.product_image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-stone-900 text-lg">{item.name}</h3>
                      <p className="text-green-600 font-bold">${item.unit_price}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-1 border border-stone-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded-lg transition-colors"><Minus size={16}/></button>
                      <span className="font-bold text-stone-800 w-6 text-center">{item.cartQuantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded-lg transition-colors"><Plus size={16}/></button>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-3 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-[2rem] p-8 border border-stone-200 shadow-xl shadow-stone-200/50 sticky top-10">
              <h2 className="text-xl font-black text-stone-900 mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-stone-500 font-medium">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-stone-500 font-medium">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold">Free</span>
                </div>
                <div className="border-t border-stone-100 pt-4 flex justify-between text-stone-900 font-black text-xl">
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cartItems.length === 0 || authLoading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-stone-900 text-white font-bold text-base hover:bg-green-600 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <CreditCard size={20} /> Checkout Now
              </button>
              
              <p className="text-center text-stone-400 text-xs mt-6 px-4">
                Secure checkout powered by Midroc Inventory Systems.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
