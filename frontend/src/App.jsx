import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Organs from "./pages/Organs";
import Recipients from "./pages/Recipients";
import Hospitals from "./pages/Hospitals";
import Matching from "./pages/Matching";
import TransportOptimization from "./pages/TransportOptimization";  

function App() {
  return (
    <BrowserRouter>
      <Sidebar />

      <Routes>
        <Route path="/" element={<Dashboard />} />

        <Route path="/organs" element={<Organs />} />
        <Route path="/recipients" element={<Recipients />} />

        <Route
          path="/hospitals"
          element={<Hospitals />} />
        

        <Route
          path="/matching"
          element={<Matching />} />
        

        <Route
  path="/transport"
  element={<TransportOptimization />}
/>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;