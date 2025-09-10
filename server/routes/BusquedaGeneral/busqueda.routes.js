import { Router } from "express";

import { consultarPosts } from "../../controllers/BusquedaGeneral/busquedaController.js";

const busquedaRoutes = Router();

busquedaRoutes.get("/consultarPosts", consultarPosts)

export default busquedaRoutes;