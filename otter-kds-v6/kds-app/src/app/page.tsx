export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">HHG KDS</h1>
            </div>
            <nav className="flex space-x-4">
              <a href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                Dashboard
              </a>
              <a href="/analytics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                Analytics
              </a>
              <a href="/predictions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                Predictions
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-20">
          <h2 className="text-4xl font-bold mb-4">Welcome to HHG KDS</h2>
          <p className="text-xl text-gray-400 mb-8">
            Real-time kitchen display system with predictive analytics
          </p>
          <div className="space-x-4">
            <a
              href="/auth/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
            >
              Login
            </a>
            <a
              href="/auth/register"
              className="inline-block bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium"
            >
              Register Restaurant
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Real-time Orders</h3>
            <p className="text-gray-400">
              See orders instantly as they come in from HHG and other platforms
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Smart Predictions</h3>
            <p className="text-gray-400">
              AI-powered demand forecasting to reduce waste and improve efficiency
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-gray-400">
              Track prep times, peak hours, and staff performance metrics
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}