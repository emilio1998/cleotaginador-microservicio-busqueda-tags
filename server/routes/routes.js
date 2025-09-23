import { Router } from "express";
import busquedaRoutes from "./BusquedaGeneral/busqueda.routes.js";

const router = Router();

router
    .use('/busqueda-tags/filtracion', busquedaRoutes)
    .use('/', (req, res) => {
        return res.json("esta api del microservicio busqueda tags no existe")
    })

export default router;