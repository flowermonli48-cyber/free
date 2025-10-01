
import { type RouteObject } from 'react-router-dom';
import Home from '../pages/home/page';
import Services from '../pages/services/page';
import CaseDetails from '../pages/case-details/page';
import Chat from '../pages/chat/page';
import Verification from '../pages/verification/page';
import Payment from '../pages/payment/page';
import PaymentSuccess from '../pages/payment-success/page';
import AdminLogin from '../pages/admin/login/page';
import AdminDashboard from '../pages/admin/dashboard/page';
import NotFound from '../pages/NotFound';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/services',
    element: <Services />,
  },
  {
    path: '/case-details/:id',
    element: <CaseDetails />,
  },
  {
    path: '/chat',
    element: <Chat />,
  },
  {
    path: '/verification/:id',
    element: <Verification />,
  },
  {
    path: '/payment/:id',
    element: <Payment />,
  },
  {
    path: '/payment-success',
    element: <PaymentSuccess />,
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
