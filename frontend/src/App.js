import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Dashboard from "@/pages/Dashboard";
import ProjectView from "@/pages/ProjectView";
import NewProject from "@/pages/NewProject";
import "@/App.css";

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/new" element={<NewProject />} />
          <Route path="/project/:id/*" element={<ProjectView />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#0a0a0a', border: '1px solid #27272a', color: '#fafafa', fontFamily: 'Manrope, sans-serif' },
        }}
      />
    </div>
  );
}

export default App;
