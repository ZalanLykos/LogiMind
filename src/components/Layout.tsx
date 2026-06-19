interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="LogiMind" className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">LogiMind</h1>
                <p className="text-xs text-gray-500">Logistics Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">v1.0.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1">
            <p className="text-sm text-gray-500">
              Made by <span className="font-medium text-gray-700">Zalan Lykos</span>
            </p>
            <span className="text-sm text-gray-400">•</span>
            <a
              href="https://zalanlykos.github.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              zalanlykos.github.io
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
