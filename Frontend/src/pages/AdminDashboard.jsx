import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { Check, Palette, Settings, Users, FileText, TrendingUp } from 'lucide-react'

const AdminDashboard = () => {
  const { currentTheme, setTheme, getPresets } = useTheme()
  const [activeTab, setActiveTab] = useState('theme')
  const presets = getPresets()

  const tabs = [
    { id: 'theme', label: 'Theme Settings', icon: Palette },
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const ThemePresetCard = ({ preset }) => {
    const isSelected = currentTheme === preset.id
    const { colors } = preset

    return (
      <button
        onClick={() => setTheme(preset.id)}
        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left w-full ${
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }`}
        style={{ backgroundColor: colors.bg }}
      >
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Theme name and description */}
        <h3 className="font-semibold text-sm mb-1" style={{ color: colors.text }}>
          {preset.name}
        </h3>
        <p className="text-xs mb-3 opacity-70" style={{ color: colors.text }}>
          {preset.description}
        </p>

        {/* Color preview swatches */}
        <div className="flex gap-1.5">
          <div
            className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
            style={{ backgroundColor: colors.accent }}
            title="Accent"
          />
          <div
            className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
            style={{ backgroundColor: colors.card }}
            title="Card"
          />
          <div
            className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
            style={{ backgroundColor: colors.text }}
            title="Text"
          />
          <div
            className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
            style={{ backgroundColor: colors.border }}
            title="Border"
          />
        </div>
      </button>
    )
  }

  const ThemeSettingsPanel = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Theme Presets</h2>
        <p className="text-gray-600 mb-6">
          Select a theme preset to customize the look and feel of the application.
          Changes are applied immediately and saved automatically.
        </p>
      </div>

      {/* Current theme indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-blue-800">
            Current theme: <strong>{presets.find(p => p.id === currentTheme)?.name}</strong>
          </span>
        </div>
      </div>

      {/* Theme presets grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <ThemePresetCard key={preset.id} preset={preset} />
        ))}
      </div>

      {/* Theme preview section */}
      <div className="mt-8 p-6 rounded-xl border border-gray-200 bg-card-theme">
        <h3 className="text-lg font-semibold mb-4 text-theme">Live Preview</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-lg text-white transition-colors bg-accent-theme hover:bg-accent-hover-theme">
              Primary Button
            </button>
            <button className="px-4 py-2 rounded-lg border border-theme text-theme bg-theme hover:bg-card-theme transition-colors">
              Secondary Button
            </button>
          </div>
          <div className="p-4 rounded-lg bg-input-theme">
            <p className="text-sm text-theme">
              This is how text and cards will look with the selected theme.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-accent-theme" />
            <span className="text-sm text-accent-theme">Accent color preview</span>
          </div>
        </div>
      </div>
    </div>
  )

  const OverviewPanel = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-600">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">--</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Materials</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">--</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-600">Sessions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">--</p>
        </div>
      </div>
      <p className="text-gray-500 text-sm">Statistics coming soon...</p>
    </div>
  )

  const PlaceholderPanel = ({ title }) => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">This section is under development</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your application settings and customize the experience</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {activeTab === 'theme' && <ThemeSettingsPanel />}
          {activeTab === 'overview' && <OverviewPanel />}
          {activeTab === 'users' && <PlaceholderPanel title="User Management" />}
          {activeTab === 'content' && <PlaceholderPanel title="Content Management" />}
          {activeTab === 'settings' && <PlaceholderPanel title="Application Settings" />}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
