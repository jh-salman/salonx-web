import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
          return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 max-w-2xl">
            <h1 className="text-2xl font-bold text-red-300 mb-4">
              Something went wrong
            </h1>
            <div className="bg-gray-800 rounded p-4 mb-4">
              <h2 className="text-lg font-semibold text-red-300 mb-2">Error Details:</h2>
              <pre className="text-red-200 text-sm whitespace-pre-wrap overflow-auto">
                {this.state.error && this.state.error.toString()}
              </pre>
            </div>
            <div className="bg-gray-800 rounded p-4">
              <h2 className="text-lg font-semibold text-red-300 mb-2">Component Stack:</h2>
              <pre className="text-red-200 text-sm whitespace-pre-wrap overflow-auto">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary 