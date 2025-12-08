import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import Adm_register from "./pages/adm_register/adm_register";
import Dashboard from "./pages/dashboard/Dashboard";
import Vehicles from "./pages/vehicles/Vehicles";
import Users from "./pages/users/Users";
import RoutesPage from "./pages/routes/Routes";
import Assignments from "./pages/assignments/Assignments";
import Executions from "./pages/executions/Executions";
import RouteMapView from "./pages/route-map/RouteMapView";
import ExecutionReports from "./pages/execution-reports/ExecutionReports";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/adm_register" element={<Adm_register />} />
                
                {/* Rotas protegidas */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/vehicles"
                    element={
                        <ProtectedRoute>
                            <Vehicles />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <Users />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/routes"
                    element={
                        <ProtectedRoute>
                            <RoutesPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/assignments"
                    element={
                        <ProtectedRoute>
                            <Assignments />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/executions"
                    element={
                        <ProtectedRoute>
                            <Executions />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/execution-reports"
                    element={
                        <ProtectedRoute>
                            <ExecutionReports />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/reports/map"
                    element={
                        <ProtectedRoute>
                            <RouteMapView />
                        </ProtectedRoute>
                    }
                />
                
                {/* Rotas legadas (mantidas para compatibilidade) */}
                <Route path="/lista_caminhoes" element={<Navigate to="/vehicles" />} />
                <Route path="/cadastrar_caminhao" element={<Navigate to="/vehicles" />} />
            </Routes>
        </Router>
    );
}

export default App;
