import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MerchPage from './pages/MerchPage';
import AdminPage from './pages/AdminPage';
import CartPopup from './components/CartPopup';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/merch/:teamId" element={<MerchPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      
      {/* Cart Popup Global - accessible sur toutes les pages */}
      <CartPopup />
    </>
  );
}

export default App;
