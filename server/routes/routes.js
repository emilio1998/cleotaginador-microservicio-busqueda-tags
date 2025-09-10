import { Router } from "express";
import busquedaRoutes from "./BusquedaGeneral/busqueda.routes.js";

const router = Router();

router
    .use('/XXX3PROJECT/busqueda', busquedaRoutes)
    .use('/', (req, res) => {
        return res.json("XXX3PROJECT")
    })

export default router;