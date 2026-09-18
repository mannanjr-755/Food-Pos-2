import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import { POS } from '@/pages/POS/POS';
import { MenuManagement } from '@/pages/MenuManagement/MenuManagement';
import { TableManagement } from '@/pages/TableManagement/TableManagement';
import { OrderManagement } from '@/pages/OrderManagement/OrderManagement';
import { Inventory } from '@/pages/Inventory/Inventory';
import { Reports } from '@/pages/Reports/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/menu" element={<MenuManagement />} />
          <Route path="/tables" element={<TableManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}