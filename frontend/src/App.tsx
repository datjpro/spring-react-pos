import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { AuthProvider } from './store/auth'
import { ToastProvider } from './store/toast'
import { ToastContainer } from './components/ui/Toast'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
