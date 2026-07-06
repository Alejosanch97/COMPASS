// Import necessary components and functions from react-router-dom.

import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Dashboard } from "./pages/Dashboard";
import { CreadorRetos } from "./pages/CreadorRetos";
import { GestionEmpresasUsuarios } from "./pages/GestionEmpresasUsuarios";
import { AsignacionRetos } from "./pages/AsignacionRetos";
import { ResponderFormularios } from "./pages/ResponderFormularios"; // <-- Nueva Importación
import { FaseAuditar } from "./pages/FaseAuditar";
import { EjecutarReto } from "./pages/EjecutarReto"; // <-- Nueva Importación
import { FaseTransformar } from "./pages/FaseTransformar";
import FaseLiderar from "./pages/FaseLiderar";
import RetosLiderar from "./pages/RetosLiderar";
import AnalisisLiderazgo from "./pages/AnalisisLiderazgo";
import FaseAsegurar from "./pages/FaseAsegurar";
import TallerMejoraAsegurar from "./pages/TallerMejoraAsegurar";
import ModuloDirectivoEstrategico from "./pages/ModuloDirectivoEstrategico";
import FaseSostener from "./pages/FaseSostener";
import ModuloSostener from "./pages/ModuloSostener";
import ModuloSostenerDirectivo from "./pages/ModuloSostenerDirectivo";





export const router = createBrowserRouter(
    createRoutesFromElements(
        // CreateRoutesFromElements function allows you to build route elements declaratively.
        // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
        // Root, on the contrary, create a sister Route, if you have doubts, try it!
        // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
        // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

        // Root Route: All navigation will start from here.
        <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

            {/* Nested Routes: Defines sub-routes within the BaseHome component. */}
            <Route path="/" element={<Home />} />
            <Route path="/single/:theId" element={<Single />} />  {/* Dynamic route for single items */}
            <Route
                path="/dashboard"
                element={<Dashboard onLogout={() => {
                    localStorage.removeItem("userATLAS");
                    localStorage.removeItem("token");
                }} />}
            />
            <Route path="/demo" element={<Demo />} />
            <Route path="/creador-retos" element={<CreadorRetos />} />
            <Route path="/gestion-empresas-usuarios" element={<GestionEmpresasUsuarios />} />
            <Route path="/asignacion-retos" element={<AsignacionRetos />} />
            <Route path="/responder-formularios" element={<ResponderFormularios />} />
            <Route path="/fase-auditar" element={<FaseAuditar />} />
            <Route path="/ejecutar-reto" element={<EjecutarReto />} />
            <Route path="/fase-transformar" element={<FaseTransformar />} />
            <Route path="/fase-liderar" element={<FaseLiderar />} />
            <Route path="/retos-liderar" element={<RetosLiderar />} />
            <Route path="/analisis-liderazgo" element={<AnalisisLiderazgo />} />
            <Route path="/fase-asegurar" element={<FaseAsegurar />} />
            <Route path="/taller-asegurar" element={<TallerMejoraAsegurar />} />
            <Route path="/modulo-directivo-estrategico" element={<ModuloDirectivoEstrategico />} />

            <Route path="/fase-sostener" element={<FaseSostener />} />
            <Route path="/modulo-sostener" element={<ModuloSostener />} />
            <Route path="/modulo-sostener-directivo" element={<ModuloSostenerDirectivo />} />
        </Route>
    )
);