import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import midroc from '../../assets/midroc.png';
import { ShoppingBasket, Search, Menu, X, User, LogOut, Settings, UserCircle } from 'lucide-react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { BiUserCircle } from 'react-icons/bi';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Home', to: '/home', end: true },
  { label: 'Cart', to: '/home/cart', icon: <ShoppingBasket size={20} /> },
  { label: 'About', to: '/home/about' },
];

function Navbar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const pageSize = searchParams.get('page_size') ?? '5';
  const navigate = useNavigate();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (event) => {
    const nextValue = event.target.value;
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      if (nextValue.trim()) {
        nextParams.set('q', nextValue);
      } else {
        nextParams.delete('q');
      }
      nextParams.set('page', '1');
      return nextParams;
    }, { replace: true });
  };

  const handlePageSizeChange = (event) => {
    const nextValue = event.target.value;
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.set('page_size', nextValue);
      nextParams.set('page', '1');
      return nextParams;
    }, { replace: true });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY < lastScrollY.current || currentScrollY === 0) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
            setIsVisible(false);
            setIsMenuOpen(false);
            setIsUserDropdownOpen(false);
          }
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refresh');
    try {
      if (refresh) {
        await axios.post(`${API}/api/logout/`, { refresh });
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setIsLoggedIn(false);
      setIsUserDropdownOpen(false);
      navigate('/');
    }
  };

  useEffect(() => {
    const updateAuthState = () => {
      const token = localStorage.getItem("access");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      try {
        const payloadPart = token.split('.')[1];
        const payloadJson = atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        const isExpired = payload?.exp ? payload.exp <= Date.now() / 1000 : true;
        setIsLoggedIn(!isExpired);
      } catch {
        setIsLoggedIn(false);
      }
    };

    updateAuthState();
    window.addEventListener('storage', updateAuthState);
    return () => window.removeEventListener('storage', updateAuthState);
  }, []);

  return (
    <div className={`sticky top-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="bg-white border-b border-gray-200 flex h-16 w-full px-4 md:px-6 justify-between items-center shadow-sm relative z-50">
        
        {/* Left Section: Mobile Menu & Logo */}
        <div className="flex items-center gap-2 md:gap-8">
          <button 
            className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} className="text-gray-600" /> : <Menu size={24} className="text-gray-600" />}
          </button>

          <a href='https://www.midrocinvestmentgroup.com/' target='_blank' rel="noreferrer" className="shrink-0">
            <img src={midroc} alt="Midroc logo" className="h-7 md:h-10 w-auto" />
          </a>

          <nav className="hidden md:flex gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                to={item.to}
                key={item.label}
                end={item.end}
                className={({ isActive }) => 
                  `flex items-center gap-2 transition-colors ${isActive ? "text-green-700 font-bold" : "text-gray-600 hover:text-green-600"}`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-[140px] xs:max-w-xs md:max-w-md mx-2 md:mx-8">
          <div className="relative group">
            <input 
              type='text'
              placeholder='Search products...'
              value={query}
              onChange={handleSearchChange}
              className='w-full bg-gray-100 border-transparent focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-full py-1.5 md:py-2 pl-9 pr-4 text-sm transition-all outline-none border'
            />
            <Search className='absolute left-3 top-2 md:top-2.5 text-gray-400 group-focus-within:text-green-600' size={16}/>
          </div>
        </div>

        {/* Right Section: Actions */}
        <div className='flex items-center gap-1 md:gap-4'>
          <div className="hidden lg:flex items-center gap-2 mr-2">
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none focus:border-green-500 cursor-pointer"
            >
              <option value="5">5 / page</option>
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
            </select>
          </div>
          
          {/* Auth Logic & Profile Dropdown */}
          {!isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/')}
                className="text-green-700 text-sm font-bold px-3 py-2 hover:bg-green-50 rounded-lg transition-colors">
                Login
              </button>
              <button onClick={() => navigate('/')} className='hidden md:block bg-green-600 text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-green-700 shadow-md shadow-green-200 active:scale-95 transition-all'>
                Register
              </button>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors focus:ring-2 focus:ring-green-200"
              >
                <BiUserCircle size={32} className='text-green-600 cursor-pointer' />
              </button>

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2 border-b border-gray-50 mb-1">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">User Account</p>
                  </div>
                  
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors">
                    <User size={16} /> My Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors">
                    <Settings size={16} /> Settings
                  </button>
                  
                  <div className="border-t border-gray-50 mt-1 pt-1">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`absolute w-full bg-white border-b border-gray-300 shadow-xl transition-all duration-300 md:hidden overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              to={item.to}
              key={item.label}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 text-gray-700 font-medium p-3 hover:bg-green-50 rounded-xl"
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
          
          <div className="my-2 border-t border-gray-100 pt-4 px-2">
            {!isLoggedIn && (
               <button className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 active:scale-95 transition-all mb-4">
                Register Now
              </button>
            )}
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Items per page</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="rounded-lg border border-gray-300 p-2 outline-none focus:border-green-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;