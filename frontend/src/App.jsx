import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { ProtectedRoute, RoleRoute } from './routes/guards'
import Home from './pages/Home'
import Resources from './pages/Resources'
import ResourceDetail from './pages/ResourceDetail'
import ResourceForm from './pages/ResourceForm'
import Questions from './pages/Questions'
import QuestionDetail from './pages/QuestionDetail'
import UserProfile from './pages/UserProfile'
import Login from './pages/Login'
import Register from './pages/Register'
import Me from './pages/Me'
import MyDashboard from './pages/MyDashboard'
import Favorites from './pages/Favorites'
import Follows from './pages/Follows'
import Notifications from './pages/Notifications'
import Moderation from './pages/Moderation'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="resources" element={<Resources />} />
        <Route path="resources/:id" element={<ResourceDetail />} />
        <Route path="questions" element={<Questions />} />
        <Route path="questions/:id" element={<QuestionDetail />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="resources/new" element={<ResourceForm />} />
          <Route path="resources/:id/edit" element={<ResourceForm />} />
          <Route path="me" element={<Me />} />
          <Route path="me/dashboard" element={<MyDashboard />} />
          <Route path="me/favorites" element={<Favorites />} />
          <Route path="me/follows" element={<Follows />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route element={<RoleRoute roles={['moderateur', 'admin']} />}>
          <Route path="moderation" element={<Moderation />} />
        </Route>
        <Route element={<RoleRoute roles={['admin']} />}>
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
