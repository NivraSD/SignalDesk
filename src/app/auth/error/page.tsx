export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Authentication Error</h1>
        <p className="text-gray-400 mb-8">
          There was an error signing you in. Please try again.
        </p>
        <a
          href="/auth/login"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Back to Sign In
        </a>
      </div>
    </div>
  )
}
