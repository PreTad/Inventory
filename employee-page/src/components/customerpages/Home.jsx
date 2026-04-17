import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Package, Info,MessageCircleWarningIcon } from 'lucide-react';

const API = import.meta.env.VITE_API_URL
function Home() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [previousPageUrl, setPreviousPageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);

  const query = (searchParams.get('q') ?? '').trim();

  const page = useMemo(() => {
    const value = Number(searchParams.get('page') ?? '1');
    return Number.isFinite(value) && value > 0 ? value : 1;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const value = Number(searchParams.get('page_size') ?? '8'); // Upped to 8 for a better grid
    return Number.isFinite(value) && value > 0 ? value : 8;
  }, [searchParams]);

  useEffect(() => {
    let ignore = false;
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API}/api/products/`, {
          params: { search: query, page, page_size: pageSize },
        });

        if (ignore) return;
        const payload = response.data;

        if (Array.isArray(payload)) {
          setRows(payload);
          setTotalCount(payload.length);
          setNextPageUrl(null);
          setPreviousPageUrl(null);
        } else {
          setRows(payload.results ?? []);
          setTotalCount(payload.count ?? 0);
          setNextPageUrl(payload.next ?? null);
          setPreviousPageUrl(payload.previous ?? null);
        }
        setError('');
      } catch (err) {
        if (!ignore) {
          setRows([]);
          setError('Unable to load products. Please check your connection.');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    fetchProducts();
    return () => { ignore = true; };
  }, [query, page, pageSize]);

  const updatePage = (newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Inventory</h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <Package size={18} />
              {query ? (
                <span>Search results for <span className="text-green-600 font-semibold">"{query}"</span></span>
              ) : (
                `Managing ${totalCount} items total`
              )}
            </p>
          </div>
          
          <div className="text-sm font-medium text-gray-400">
            Page {page} of {Math.ceil(totalCount / pageSize) || 1}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-center gap-3">
            <Info className="text-red-500" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Main Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(pageSize)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rows.length > 0 ? (
                rows.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => navigate(`/home/product/${item.id}`, { state: item })}
                    className={`group bg-white rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 ${
                      activeId === item.id ? "ring-2 ring-green-600 border-transparent" : "border-gray-100"
                    }`}
                  >
                    {/* Image Container */}
                    <div className="h-48 overflow-hidden bg-gray-100">
                      <img
                        src={item.product_image || 'https://via.placeholder.com/300'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                        <span className="text-green-600 font-bold text-lg">
                          ${item.unit_price || '0.00'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">SKU</span>
                          <span className="text-gray-700 font-mono">{item.sku || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Stock</span>
                          <span className={`font-semibold ${item.quantity < 5 ? 'text-orange-500' : 'text-gray-700'}`}>
                            {item.quantity < 5 ? (
                              <>
                                <MessageCircleWarningIcon className="inline mr-1" size={16} />
                                {item.quantity}
                              </>
                            ) : (
                              `${item.quantity ?? 0} units`
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                  <Package className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-gray-500 text-lg font-medium">No items found matching your search.</h3>
                </div>
              )}
            </div>

            {/* Modern Pagination */}
            <div className="mt-12 flex justify-center items-center gap-4">
              <button
                onClick={() => updatePage(page - 1)}
                disabled={!previousPageUrl || isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full font-semibold text-gray-700 hover:bg-gray-50 hover:border-green-600 hover:text-green-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-700 transition-all shadow-sm"
              >
                <ChevronLeft size={20} /> Previous
              </button>

              <div className="h-10 w-px bg-gray-200" />

              <button
                onClick={() => updatePage(page + 1)}
                disabled={!nextPageUrl || isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 rounded-full font-semibold text-white hover:bg-green-700 shadow-lg shadow-green-100 disabled:opacity-30 disabled:bg-gray-400 disabled:shadow-none transition-all"
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Home;
