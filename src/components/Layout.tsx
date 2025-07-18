import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showSearch?: boolean;
}

export function Layout({ children, title, subtitle, showSearch = true }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} showSearch={showSearch} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}