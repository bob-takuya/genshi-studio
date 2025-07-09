import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import {
  Plus,
  Folder,
  Clock,
  Star,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Image,
  Palette,
} from 'lucide-react'

export default function Sidebar() {
  const { projects, currentProject, createProject, loadProject, deleteProject } = useAppStore()
  const [expandedSections, setExpandedSections] = useState({
    recent: true,
    projects: true,
    templates: false,
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCreateProject = () => {
    const projectName = prompt('Enter project name:')
    if (projectName) {
      createProject(projectName)
    }
  }

  const templates = [
    { id: '1', name: 'Social Media Post', icon: Image },
    { id: '2', name: 'Logo Design', icon: Palette },
    { id: '3', name: 'Document', icon: FileText },
  ]

  return (
    <aside className="h-full w-60 bg-surface border-r border-border overflow-y-auto">
      <div className="p-4">
        {/* New Project Button */}
        <button
          onClick={handleCreateProject}
          className="w-full btn btn-primary flex items-center justify-center space-x-2 mb-6"
        >
          <Plus size={20} />
          <span>New Project</span>
        </button>

        {/* Recent Projects */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('recent')}
            className="w-full flex items-center justify-between text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <div className="flex items-center space-x-2">
              <Clock size={16} />
              <span>Recent</span>
            </div>
            {expandedSections.recent ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <AnimatePresence>
            {expandedSections.recent && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {projects.slice(0, 5).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => loadProject(project.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      currentProject?.id === project.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{project.name}</span>
                      <span className="text-xs opacity-60">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* All Projects */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('projects')}
            className="w-full flex items-center justify-between text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <div className="flex items-center space-x-2">
              <Folder size={16} />
              <span>Projects ({projects.length})</span>
            </div>
            {expandedSections.projects ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <AnimatePresence>
            {expandedSections.projects && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden max-h-64 overflow-y-auto"
              >
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-background transition-all"
                  >
                    <button
                      onClick={() => loadProject(project.id)}
                      className={`flex-1 text-left text-sm truncate ${
                        currentProject?.id === project.id
                          ? 'text-primary font-medium'
                          : ''
                      }`}
                    >
                      {project.name}
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Templates */}
        <div>
          <button
            onClick={() => toggleSection('templates')}
            className="w-full flex items-center justify-between text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <div className="flex items-center space-x-2">
              <Star size={16} />
              <span>Templates</span>
            </div>
            {expandedSections.templates ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <AnimatePresence>
            {expandedSections.templates && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {templates.map((template) => (
                  <button
                    key={template.id}
                    className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm hover:bg-background transition-all"
                  >
                    <template.icon size={16} />
                    <span>{template.name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  )
}