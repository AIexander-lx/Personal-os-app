import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import { Dashboard, Roadmap, Study, StreakStudy, Health, Plan, Review, Goals, Finance } from './pages'
import { LEGACY_ROUTES } from './data/nav'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/estudios" element={<Roadmap />} />
        <Route path="/agenda" element={<Study />} />
        <Route path="/objetivos" element={<Goals />} />
        <Route path="/proyectos" element={<StreakStudy />} />
        <Route path="/bienestar" element={<Health />} />
        <Route path="/finanzas" element={<Finance />} />
        <Route path="/revision" element={<Review />} />
        {/* Rutas anteriores a la reorganización. */}
        {Object.entries(LEGACY_ROUTES).map(([from, to]) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
