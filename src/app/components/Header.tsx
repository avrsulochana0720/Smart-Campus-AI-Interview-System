export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-4">
      <div 
        className="max-w-7xl mx-auto rounded-2xl px-6 py-4 backdrop-blur-md border border-white/10"
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="text-white font-bold text-lg">SmartCampus AI</span>
          </div>
          
          <nav className="flex items-center gap-8">
            <a href="#home" className="text-gray-300 hover:text-white transition-colors">Home</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
          </nav>
        </div>
      </div>
    </header>
  );
}