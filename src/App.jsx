import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

const COLORS = ['#e44145', '#ff9f43', '#feca57', '#10b981', '#54a0ff', '#5f27cd', '#ff6b6b', '#c8d6e5']

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('auth')
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [currentFilter, setCurrentFilter] = useState('today')
  const [currentProject, setCurrentProject] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [selectedColor, setSelectedColor] = useState(COLORS[0])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        setView('app')
        loadData(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        setView('app')
        loadData(session.user.id)
      } else {
        setView('auth')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadData(userId) {
    const [projectsRes, tasksRes] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    ])
    setProjects(projectsRes.data || [])
    setTasks(tasksRes.data || [])
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    if (dateStr === today) return 'Hoy'
    if (dateStr === tomorrowStr) return 'Mañana'
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }

  function isOverdue(dateStr) {
    if (!dateStr) return false
    return dateStr < new Date().toISOString().split('T')[0]
  }

  function getFilteredTasks() {
    const today = new Date().toISOString().split('T')[0]
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextWeekStr = nextWeek.toISOString().split('T')[0]

    return tasks.filter(task => {
      if (currentProject && task.project_id !== currentProject) return false
      if (currentFilter === 'today') {
        return task.due_date === today || (!task.due_date && !task.completed)
      }
      if (currentFilter === 'upcoming') {
        return task.due_date && task.due_date >= today && task.due_date <= nextWeekStr
      }
      return true
    })
  }

  function getPageTitle() {
    if (currentFilter === 'today') return { icon: '📅', text: 'Hoy' }
    if (currentFilter === 'upcoming') return { icon: '📆', text: 'Próximos 7 días' }
    if (currentFilter === 'all') return { icon: '📋', text: 'Todas las tareas' }
    const project = projects.find(p => p.id === currentProject)
    return { icon: '', text: project?.name || '' }
  }

  async function handleLogin(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function handleRegister(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setProjects([])
    setTasks([])
    setCurrentProject(null)
    setCurrentFilter('today')
  }

  async function addTask(title) {
    if (!title.trim() || !session) return
    const { data } = await supabase.from('tasks').insert({
      user_id: session.user.id,
      project_id: currentProject || projects[0]?.id,
      title: title.trim(),
      completed: false,
      priority: 4
    }).select()
    if (data) setTasks([data[0], ...tasks])
  }

  async function toggleTask(task) {
    const { data } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id).select()
    if (data) {
      setTasks(tasks.map(t => t.id === task.id ? data[0] : t))
    }
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  async function saveTask(taskData) {
    if (editingTask) {
      const { data } = await supabase.from('tasks').update(taskData).eq('id', editingTask.id).select()
      if (data) setTasks(tasks.map(t => t.id === editingTask.id ? data[0] : t))
    } else {
      const { data } = await supabase.from('tasks').insert({
        ...taskData,
        user_id: session.user.id
      }).select()
      if (data) setTasks([data[0], ...tasks])
    }
    setShowTaskModal(false)
    setEditingTask(null)
  }

  async function addProject(name) {
    if (!name.trim() || !session) return
    const { data } = await supabase.from('projects').insert({
      user_id: session.user.id,
      name: name.trim(),
      color: selectedColor
    }).select()
    if (data) setProjects([...projects, data[0]])
  }

  async function saveProject(name) {
    if (editingProject) {
      const { data } = await supabase.from('projects').update({ name, color: selectedColor }).eq('id', editingProject.id).select()
      if (data) setProjects(projects.map(p => p.id === editingProject.id ? data[0] : p))
    } else {
      const { data } = await supabase.from('projects').insert({
        user_id: session.user.id,
        name,
        color: selectedColor
      }).select()
      if (data) setProjects([...projects, data[0]])
    }
    setShowProjectModal(false)
    setEditingProject(null)
  }

  async function deleteProject(id) {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(projects.filter(p => p.id !== id))
    if (currentProject === id) setCurrentProject(null)
  }

  if (loading) return <div className="loading">Cargando...</div>

  if (view === 'auth') {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} />
  }

  const title = getPageTitle()

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">M</div>
            MyTodoist
          </div>
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        </div>

        <div className="nav-section">
          <div className={`nav-item ${currentFilter === 'today' ? 'active' : ''}`} onClick={() => { setCurrentFilter('today'); setCurrentProject(null); setSidebarOpen(false) }}>
            <span className="icon">📅</span> Hoy
          </div>
          <div className={`nav-item ${currentFilter === 'upcoming' ? 'active' : ''}`} onClick={() => { setCurrentFilter('upcoming'); setCurrentProject(null); setSidebarOpen(false) }}>
            <span className="icon">📆</span> Próximos 7 días
          </div>
          <div className={`nav-item ${currentFilter === 'all' ? 'active' : ''}`} onClick={() => { setCurrentFilter('all'); setCurrentProject(null); setSidebarOpen(false) }}>
            <span className="icon">📋</span> Todas las tareas
          </div>
        </div>

        <div className="nav-label">Proyectos</div>
        <div className="nav-section">
          {projects.map(p => (
            <div key={p.id} className={`project-item ${currentProject === p.id ? 'active' : ''}`} onClick={() => { setCurrentProject(p.id); setCurrentFilter(null); setSidebarOpen(false) }}>
              <span className="project-dot" style={{ background: p.color }}></span>
              <span>{p.name}</span>
            </div>
          ))}
        </div>

        <div className="add-project-btn" onClick={() => { setEditingProject(null); setSelectedColor(COLORS[0]); setShowProjectModal(true) }}>
          <span className="icon">+</span> Añadir proyecto
        </div>
      </aside>

      <main className="main-content">
        <div className="main-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <h1 className="page-title">
            {title.icon && <span>{title.icon}</span>}
            {title.text}
          </h1>
        </div>

        <div className="add-task-section">
          <input type="text" className="add-task-input" placeholder="Añadir una tarea..." onKeyPress={(e) => e.key === 'Enter' && addTask(e.target.value)} />
        </div>

        <div className="task-list">
          {getFilteredTasks().map(task => {
            const project = projects.find(p => p.id === task.project_id)
            const dateClass = task.due_date ? (task.due_date === new Date().toISOString().split('T')[0] ? 'today' : (isOverdue(task.due_date) ? 'overdue' : '')) : ''
            
            return (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <div className="task-checkbox" onClick={() => toggleTask(task)}></div>
                {task.priority ? <div className={`priority-dot priority-${task.priority}`}></div> : ''}
                <span className="task-text">{task.title}</span>
                {project && <span className="task-project-label" style={{ background: project.color + '33', color: project.color }}>{project.name}</span>}
                {task.due_date && <span className={`task-date ${dateClass}`}>{formatDate(task.due_date)}</span>}
                <div className="task-actions">
                  <button className="task-action-btn edit" onClick={() => { setEditingTask(task); setShowTaskModal(true) }}>✏️</button>
                  <button className="task-action-btn delete" onClick={() => deleteTask(task.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projects={projects}
          onSave={saveTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          colors={COLORS}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          onSave={saveProject}
          onClose={() => { setShowProjectModal(false); setEditingProject(null) }}
        />
      )}
    </div>
  )
}

function Auth({ onLogin, onRegister }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await onLogin(email, password)
      } else {
        await onRegister(email, password)
        alert('¡Registro exitoso! Por favor verifica tu correo electrónico.')
        setIsLogin(true)
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div className="logo-icon">M</div>
          MyTodoist
        </div>
        <h2>{isLogin ? 'Iniciar sesión' : 'Registrarse'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar sesión' : 'Registrarse')}
          </button>
        </form>
        <p style={{ marginTop: 16, textAlign: 'center', color: '#9ca3af' }}>
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <span style={{ color: '#e44145', cursor: 'pointer', marginLeft: 8 }} onClick={() => { setIsLogin(!isLogin); setError(''); setEmail(''); setPassword('') }}>
            {isLogin ? 'Registrarse' : 'Iniciar sesión'}
          </span>
        </p>
      </div>
    </div>
  )
}

function TaskModal({ task, projects, onSave, onClose }) {
  const [title, setTitle] = useState(task?.title || '')
  const [projectId, setProjectId] = useState(task?.project_id || projects[0]?.id || '')
  const [dueDate, setDueDate] = useState(task?.due_date || '')
  const [priority, setPriority] = useState(task?.priority || 4)

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), project_id: projectId, due_date: dueDate || null, priority: parseInt(priority) })
  }

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{task ? 'Editar tarea' : 'Nueva tarea'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título</label>
            <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título de la tarea" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Proyecto</label>
            <select className="form-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha límite</label>
            <input type="date" className="form-input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="4">Baja</option>
              <option value="3">Media</option>
              <option value="2">Alta</option>
              <option value="1">Crítica</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectModal({ project, colors, selectedColor, onSelectColor, onSave, onClose }) {
  const [name, setName] = useState(project?.name || '')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim())
  }

  return (
    <div className="modal-overlay active" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="modal-title">{project ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del proyecto" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {colors.map(c => (
                <div key={c} className={`color-option ${c === selectedColor ? 'selected' : ''}`} style={{ background: c }} onClick={() => onSelectColor(c)}></div>
              ))}
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App
