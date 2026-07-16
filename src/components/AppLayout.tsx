import { Component } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

class SafeSidebar extends Component<{ children: React.ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) {
    console.error('[SafeSidebar] Sidebar crashed:', error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

class AppSectionError extends Component<{ name: string; children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[AppLayout:${this.props.name}] crash:`, error.name, error.message, info.componentStack?.slice(0, 300));
  }
  render() {
    if (this.state.error) {
      return this.props.name === 'outlet' ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-sm font-semibold">Page failed to load</p>
            <p className="text-xs text-muted-foreground mt-1">{this.state.error.message || 'Unknown error'}</p>
          </div>
        </div>
      ) : null;
    }
    return <>{this.props.children}</>;
  }
}

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SafeSidebar>
        <Sidebar />
      </SafeSidebar>
      <main className="flex-1 overflow-y-auto">
        <AppSectionError name="outlet">
          <Outlet />
        </AppSectionError>
      </main>
    </div>
  );
}
