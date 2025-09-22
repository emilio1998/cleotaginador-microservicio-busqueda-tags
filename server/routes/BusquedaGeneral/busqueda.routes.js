import { Router } from "express";

import { consultarPosts, mostrarPost } from "../../controllers/BusquedaGeneral/busquedaController.js";

const busquedaRoutes = Router();

busquedaRoutes.get("/consultarPosts", consultarPosts)
busquedaRoutes.get("/mostrarPost/:id_post", mostrarPost)

export default busquedaRoutes;