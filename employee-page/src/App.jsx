import { Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react';
import HomePage from './components/employee-pages/AdminLayout';
import Products from './components/employee-pages/products';
import Dashboard from './components/employee-pages/Dashboard';
import LoginPage from './authentication/login';
import CustomerLayout from './components/customerpages/CustomerLayout';
import Home from './components/customerpages/Home';
import Cart from './components/customerpages/Cart';
import Product from './components/customerpages/Product';
import PaymentSuccess from './components/customerpages/PaymentSuccess';

export default function App(){
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  return (
    <Routes>
      <Route path='/' element={<LoginPage />} />
      <Route
        path='/admin'
        element={
          <HomePage
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          />
        }
      >
        <Route index element={<Products/>} />
        <Route path='dashboard' element={<Dashboard />} />
        <Route path='sth' element={<div className="p-6">Something</div>} />
      </Route>
      <Route path='/home' element = {<CustomerLayout />}>
        <Route index element={<Home/>} />
        <Route path='cart' element={<Cart/>} />
        <Route path='product/:id' element={<Product/>} />
      </Route>
      <Route path='/payment-success' element={<PaymentSuccess />} />
    </Routes>
  );
}
