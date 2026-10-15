# 🧭 Personal OS

> **Personal Operating System** — un centro de control gamificado para la carrera académica, los estudios, la salud y el desarrollo profesional de un estudiante de Ingeniería de Sistemas.

![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-4.5-1e293b)
![Tests](https://img.shields.io/badge/tests-39%20passing-brightgreen?logo=vitest&logoColor=white)

Aplicación **100% frontend** (sin backend) que centraliza el seguimiento de estudio, salud y objetivos de carrera con un sistema de niveles, XP y logros. Todos los datos se guardan automáticamente en el navegador (`localStorage`) y se pueden respaldar/restaurar en JSON.

---

## ✨ Características

| Sección | Qué hace |
| --- | --- |
| 🏠 **Dashboard** | Stats (XP, nivel, racha, sesiones), gráfico de XP de 30 días, **fase actual del plan**, **bloque de día en vivo** con el horario semanal (bloques por día) que resalta la actividad actual, progreso por curso y grid de logros. |
| 🗺️ **Roadmap** | 6 cursos · 38 temas · 163 ejercicios. Tarjetas expandibles con dificultad y XP por tema, filtros por estado/dificultad y búsqueda. |
| 📅 **Horario** | Sincronizado **en vivo con Google Calendar** (solo lectura): clases y fechas de evaluación siempre al día, incluso si un profesor cambia una fecha — se edita en Google Calendar como siempre y aquí se refleja solo. Agrupado por día (Hoy / Mañana / próximos 14 días), resalta evaluaciones (exámenes, PCs, ECs) y permite elegir entre varios calendarios. Ver [configuración](#-horario-con-google-calendar) más abajo. |
| 🚀 **StreakStudy** | Tracker del proyecto principal: features y bugs con **drag & drop**, fases, barra de completitud y timeline de avances. |
| 💪 **Health** | Registro de gimnasio semanal (Lun–Vie), racha, y seguimiento de sueño y energía con gráficos de 7 días. |
| 🎯 **Plan** | Plan Millonario: reglas de oro, checklist de 90 días con XP, temario de 6 fases (la fase actual se calcula con la fecha), metas a 1, 3 y 10 años y contadores de portfolio/comunidad. Los datos están en `src/data/plan-millonario.json`. |
| 📒 **Diario** | Diario de trading: fecha, par, compra/venta, entrada, stop loss, salida, resultado en R (automático) y USD (opcional), si respeté mis reglas y por qué entré. Acierto, R promedio, curva de R y resumen por par. Las 30 operaciones en demo completan solas el ítem del checklist. |
| 🧭 **Revisión** | Revisión semanal de domingo: 8 indicadores que se activan según la fase, metas cumplidas, historial y evolución de las últimas 12 semanas. |

### 🎮 Gamificación
- **10 niveles profesionales** — de *Beginner* a *Master Architect*.
- **XP por sesión** = `50 base + 0.5 × minutos` (más bonos por logros).
- **16 logros desbloqueables** con lógica real (primera sesión, rachas, cursos al 100%, *Perfect Day*, primer cliente, revisiones semanales, etc.) y **notificaciones (toast)** al desbloquear.
- **Plan:** cada ítem del checklist de 90 días da XP (el primer cliente, más) y cada tarea de fase +25 XP. Desmarcar resta el XP, y los logros del checklist se revierten.
- **Diario de trading:** +10 XP por operación registrada (borrarla lo resta).
- **Revisión semanal:** +50 XP la primera vez que se guarda la semana actual o la anterior.

### 🎨 Temas
- **Claro y oscuro** con toggle en la barra lateral; respeta la preferencia del sistema en el primer arranque y recuerda tu elección.
- Construido sobre **tokens semánticos** (variables CSS) en vez de colores fijos, así que ambos temas salen de una sola fuente de verdad.
- Contraste **verificado WCAG AA** (≥4.5:1) en las 6 páginas y en ambos temas.

### 📱 PWA
- **Instalable** en escritorio y móvil (manifest + service worker vía `vite-plugin-pwa`), funciona offline gracias al precacheo.
- **Notificaciones** del navegador al terminar una sesión de estudio (con permiso del usuario).

### 💾 Persistencia & respaldo
- Auto-guardado en `localStorage` vía **Zustand + persist**.
- **Exportar / Importar** todos los datos en un archivo JSON para respaldar o migrar entre navegadores/dispositivos.
- Botón de **reiniciar datos** (con confirmación).

---

## 🛠️ Stack tecnológico

- **React 18** + **TypeScript**
- **Vite** (dev server y build)
- **Tailwind CSS** con tokens semánticos vía variables CSS (tema claro/oscuro)
- **Zustand** + `persist` middleware (estado global → `localStorage`)
- **React Router v6**
- **date-fns**, **clsx**

---

## 🚀 Cómo ejecutarlo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Previsualizar el build
npm run preview

# Ejecutar los tests
npm test
```

Los tests (Vitest + jsdom) cubren la lógica de gamificación (XP, niveles, logros), los formateadores y el CRUD de los stores (sesiones, cursos/temas, horario) — **39 tests**.

La app corre en `http://localhost:5173` (o el puerto que asigne Vite).

---

## 📅 Horario con Google Calendar

La pestaña **Horario** (antes Study) lee en vivo tus eventos de Google Calendar — solo lectura, nunca escribe ni modifica nada. Requiere un OAuth Client ID propio (gratis, de tu cuenta de Google Cloud):

1. Entra a [console.cloud.google.com](https://console.cloud.google.com/) y crea un proyecto (o usa uno existente).
2. **APIs & Services → Library** → busca **Google Calendar API** → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User type: *External*.
   - Completa nombre de la app y tu correo (como soporte y como contacto de desarrollador).
   - En **Test users**, agrega tu propio correo de Google. Así te basta con dejar la app en modo *Testing* — no hace falta publicarla ni verificarla para uso personal.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: *Web application*.
   - **Authorized JavaScript origins**: agrega `http://localhost:5173` (y, si despliegas la app, la URL de producción).
   - No hace falta configurar *Authorized redirect URIs*.
   - Copia el **Client ID** generado (termina en `.apps.googleusercontent.com`).
5. Crea un archivo `.env` en la raíz del proyecto (copia `.env.example`) con:
   ```
   VITE_GOOGLE_CLIENT_ID=tu-client-id-aqui
   ```
6. Reinicia `npm run dev` y entra a **Horario** → **Conectar con Google**. La primera vez Google mostrará *"Google no ha verificado esta app"* (normal en modo Testing) → **Avanzado** → **Ir a Personal OS (no seguro)** → acepta el permiso de solo lectura del calendario.

El token de acceso vive solo en `sessionStorage` del navegador (se renueva solo, sin volver a pedir permiso, mientras la sesión siga activa).

---

## 📁 Estructura del proyecto

```
personal-os/
├── src/
│   ├── pages/          # Dashboard, Roadmap, Study (Horario/Google Calendar), StreakStudy, Health, Plan, Journal, Review
│   ├── components/     # DaySchedule, ToastHost y comunes (Card, ProgressBar, StatBox, NavBar)
│   ├── lib/            # googleCalendar (OAuth + fetch de eventos, solo lectura)
│   ├── store/          # userStore, courseStore, gamificationStore, scheduleStore, calendarStore, planStore, journalStore, toastStore, themeStore
│   ├── data/           # courses, achievements, schedule, plan (+ plan-millonario.json)
│   ├── utils/          # gamification, formatters, dataBackup, plan, journal
│   ├── layouts/        # MainLayout
│   ├── types/          # course, user, achievement, plan, journal
│   └── styles/         # globals.css
├── index.html
└── vite.config.ts
```

Los temas de **AED** y **Sistemas Computacionales** están alineados con el sílabo real del curso (UTEC).

---

## 🗺️ Roadmap

- [x] MVP frontend con persistencia local
- [x] Gamificación (niveles, XP, logros con toast)
- [x] Bloque de día en vivo
- [x] Horario y cursos editables
- [x] Respaldo export/import en JSON
- [x] Tests con Vitest
- [x] PWA instalable + notificaciones del timer
- [x] Tema claro/oscuro con contraste AA
- [x] Plan Millonario: metas, fases, revisión semanal
- [x] Diario de trading
- [x] Horario sincronizado en vivo con Google Calendar
- [ ] Backend (Spring Boot + PostgreSQL)
- [ ] Sincronización multi-dispositivo (AWS)
- [ ] Autenticación

---

## 👤 Autor

**Alexander** — Ingeniería de Sistemas de Información, UTEC (Perú).

Proyecto personal desarrollado como parte del portfolio de la carrera.
