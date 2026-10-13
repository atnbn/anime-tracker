import { Component, type ErrorInfo, type ReactNode } from "react";
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("Application render failed", error.message, info.componentStack); }
  render() {
    if (this.state.failed) return <main className="empty-state m-6" role="alert"><h1>Something went wrong.</h1><p>Reload the app to try again.</p><button onClick={() => window.location.reload()}>Reload →</button></main>;
    return this.props.children;
  }
}
