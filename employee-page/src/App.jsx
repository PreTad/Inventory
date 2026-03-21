import {Route,Routes} from 'react-router-dom'
import LoginPage from './authentication/login';
import HomePage from './employee-pages/homepage';
import Products from './employee-pages/products';
import Dashboard from './employee-pages/Dashboard';

export default function App(){
  return (
    <Routes>
      <Route path='/' element={<LoginPage />} />
      <Route path='/home' element={<HomePage />}>
        <Route index path='' element={<Products/>} />
        <Route path='dashboard' element={<Dashboard />} />
        <Route path='sth' element={<div className="p-6">Something</div>} />
      </Route>
    </Routes>
  );
}
