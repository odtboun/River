import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { NegotiationApp } from './pages/NegotiationApp';
import { MarketingHome } from './pages/MarketingHome';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MarketingHome />} />
        <Route path="/app" element={<NegotiationApp />} />
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
