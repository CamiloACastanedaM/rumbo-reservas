import { Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import NotFound from './pages/NotFound.jsx'
import AdminLayout, { AdminHome } from './pages/admin/AdminLayout.jsx'
import ProductList from './pages/admin/ProductList.jsx'
import ProductForm from './pages/admin/ProductForm.jsx'
import CategoryForm from './pages/admin/CategoryForm.jsx'
import FeatureAdmin from './pages/admin/FeatureAdmin.jsx'
import UserAdmin from './pages/admin/UserAdmin.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

const adminRoutes = (
  <>
    <Route index element={<AdminHome />} />
    <Route path="productos" element={<ProductList />} />
    <Route path="productos/nuevo" element={<ProductForm key="new" />} />
    <Route path="productos/:id/editar" element={<ProductForm key="edit" />} />
    <Route path="categorias/nueva" element={<CategoryForm />} />
    <Route path="caracteristicas" element={<FeatureAdmin />} />
    <Route path="usuarios" element={<UserAdmin />} />
  </>
)

export default function App() {
  return (
    <>
      <Header />
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/iniciar-sesion" element={<Login />} />
          <Route path="/administración" element={<AdminLayout />}>{adminRoutes}</Route>
          <Route path="/administracion" element={<AdminLayout />}>{adminRoutes}</Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
