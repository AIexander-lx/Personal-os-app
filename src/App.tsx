import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import { Dashboard, Roadmap, Study, StreakStudy, Health, Plan, Review } from './pages'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/study" element={<Study />} />
        <Route path="/streakstudy" element={<StreakStudy />} />
        <Route path="/health" element={<Health />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/review" element={<Review />} />
        {/* Ruta antigua: la ruta profesional ahora es el Plan. */}
        <Route path="/career" element={<Navigate to="/plan" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
