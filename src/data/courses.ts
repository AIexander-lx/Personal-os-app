import type { Course } from '@/types'

/**
 * 6 cursos del Ciclo 4 — UTEC.
 * Los temas de AED y Sistemas Computacionales están alineados con el sílabo
 * real (CS2023 / IS2021) y el material de clase.
 */
export const courses: Course[] = [
  {
    id: 'course_aed',
    name: 'Algoritmos y Estructura de Datos',
    icon: '📊',
    description: 'Fundamentos de AED, estructuras y complejidad para competencias.',
    progress: 0,
    topics: [
      { id: 'aed_1', name: 'Complejidad Algorítmica (Big-O)', difficulty: 'Easy', exercises: 6, xp: 50 },
      { id: 'aed_2', name: 'Listas Enlazadas (simples y dobles)', difficulty: 'Easy', exercises: 8, xp: 50 },
      { id: 'aed_3', name: 'Matrices Dispersas', difficulty: 'Medium', exercises: 4, xp: 70 },
      { id: 'aed_4', name: 'Pilas, Colas e Iteradores', difficulty: 'Easy', exercises: 7, xp: 50 },
      { id: 'aed_5', name: 'Tablas Hash', difficulty: 'Medium', exercises: 6, xp: 80 },
      { id: 'aed_6', name: 'Árboles Binarios de Búsqueda (BST)', difficulty: 'Medium', exercises: 8, xp: 90 },
      { id: 'aed_7', name: 'Heaps y Colas de Prioridad', difficulty: 'Medium', exercises: 5, xp: 90 },
      { id: 'aed_8', name: 'Árboles AVL', difficulty: 'Hard', exercises: 5, xp: 120 },
      { id: 'aed_9', name: 'Árboles B', difficulty: 'Hard', exercises: 4, xp: 120 },
      { id: 'aed_10', name: 'Grafos (representación e intro)', difficulty: 'Medium', exercises: 6, xp: 90 },
      { id: 'aed_11', name: 'BFS y DFS', difficulty: 'Medium', exercises: 7, xp: 90 },
      { id: 'aed_12', name: 'Backtracking', difficulty: 'Hard', exercises: 6, xp: 120 },
      { id: 'aed_13', name: 'Conjuntos Disjuntos (Union-Find)', difficulty: 'Medium', exercises: 4, xp: 90 },
      { id: 'aed_14', name: 'Árboles de Expansión Mínima (MST)', difficulty: 'Hard', exercises: 5, xp: 120 },
      { id: 'aed_15', name: 'Caminos Mínimos (Dijkstra)', difficulty: 'Hard', exercises: 5, xp: 120 },
    ],
  },
  {
    id: 'course_sistemas',
    name: 'Sistemas Computacionales',
    icon: '🖥️',
    description: 'Arquitectura de computadoras y sistemas operativos.',
    progress: 0,
    topics: [
      { id: 'sis_1', name: 'Arquitectura de Computadoras', difficulty: 'Medium', exercises: 5, xp: 80 },
      { id: 'sis_2', name: 'Fundamentos de Sistemas Operativos', difficulty: 'Easy', exercises: 4, xp: 50 },
      { id: 'sis_3', name: 'Procesos y Threads (POSIX)', difficulty: 'Medium', exercises: 6, xp: 90 },
      { id: 'sis_4', name: 'System Calls', difficulty: 'Medium', exercises: 4, xp: 80 },
      { id: 'sis_5', name: 'Gestión de Memoria', difficulty: 'Hard', exercises: 5, xp: 110 },
      { id: 'sis_6', name: 'Memoria Caché', difficulty: 'Hard', exercises: 5, xp: 110 },
      { id: 'sis_7', name: 'I/O y File Systems', difficulty: 'Medium', exercises: 4, xp: 90 },
      { id: 'sis_8', name: 'Fundamentos de Redes', difficulty: 'Medium', exercises: 5, xp: 90 },
    ],
  },
  {
    id: 'course_ml',
    name: 'Machine Learning',
    icon: '🤖',
    description: 'Aprendizaje supervisado, no supervisado y redes neuronales.',
    progress: 0,
    topics: [
      { id: 'ml_1', name: 'Aprendizaje Supervisado', difficulty: 'Medium', exercises: 3, xp: 90 },
      { id: 'ml_2', name: 'Aprendizaje No Supervisado', difficulty: 'Medium', exercises: 2, xp: 90 },
      { id: 'ml_3', name: 'Redes Neuronales', difficulty: 'Hard', exercises: 3, xp: 130 },
      { id: 'ml_4', name: 'Feature Engineering', difficulty: 'Medium', exercises: 2, xp: 80 },
      { id: 'ml_5', name: 'Evaluación de Modelos', difficulty: 'Medium', exercises: 2, xp: 80 },
    ],
  },
  {
    id: 'course_cloud',
    name: 'Cloud Computing',
    icon: '☁️',
    description: 'Servicios AWS y despliegue en la nube.',
    progress: 0,
    topics: [
      { id: 'cloud_1', name: 'AWS EC2', difficulty: 'Easy', exercises: 3, xp: 60 },
      { id: 'cloud_2', name: 'AWS RDS', difficulty: 'Medium', exercises: 2, xp: 80 },
      { id: 'cloud_3', name: 'AWS S3', difficulty: 'Easy', exercises: 2, xp: 60 },
      { id: 'cloud_4', name: 'Deployment & DevOps', difficulty: 'Hard', exercises: 3, xp: 120 },
    ],
  },
  {
    id: 'course_optim',
    name: 'Optimización',
    icon: '📈',
    description: 'Programación lineal, convexa y metaheurísticas.',
    progress: 0,
    topics: [
      { id: 'optim_1', name: 'Programación Lineal', difficulty: 'Medium', exercises: 3, xp: 90 },
      { id: 'optim_2', name: 'Optimización Convexa', difficulty: 'Hard', exercises: 3, xp: 120 },
      { id: 'optim_3', name: 'Metaheurísticas', difficulty: 'Hard', exercises: 2, xp: 120 },
    ],
  },
  {
    id: 'course_analytics',
    name: 'Business Analytics',
    icon: '💼',
    description: 'Visualización de datos, estadística e inteligencia de negocios.',
    progress: 0,
    topics: [
      { id: 'ba_1', name: 'Visualización de Datos', difficulty: 'Easy', exercises: 3, xp: 60 },
      { id: 'ba_2', name: 'Análisis Estadístico', difficulty: 'Medium', exercises: 3, xp: 90 },
      { id: 'ba_3', name: 'Business Intelligence', difficulty: 'Medium', exercises: 3, xp: 90 },
    ],
  },
]

export default courses
