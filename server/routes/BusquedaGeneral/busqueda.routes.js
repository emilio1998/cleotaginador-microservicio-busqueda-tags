import { Router } from "express";

import { consultarPosts, mostrarPostDetalles, listarPosts } from "../../controllers/BusquedaGeneral/busquedaController.js";

const busquedaRoutes = Router();

busquedaRoutes.get("/consultarPosts", consultarPosts)
busquedaRoutes.get("/mostrarPostDetalles/:id_post", mostrarPostDetalles)
busquedaRoutes.get("/listarPosts", listarPosts)

export default busquedaRoutes;