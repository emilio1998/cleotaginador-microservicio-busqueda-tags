import { Router } from "express";

import { consultarPosts, mostrarPostDetalles, listarPosts, listarGruposTags, listarEtiquetasDinamico, listarTags, listarPostsPorGrupo } from "../../controllers/BusquedaGeneral/busquedaController.js";

const busquedaRoutes = Router();

busquedaRoutes.get("/consultarPosts", consultarPosts)
busquedaRoutes.get("/mostrarPostDetalles/:id_post", mostrarPostDetalles)
busquedaRoutes.get("/listarPosts", listarPosts)
busquedaRoutes.get("/listarGruposTags", listarGruposTags)
busquedaRoutes.get("/listarEtiquetasDinamico/:id_grupo", listarEtiquetasDinamico)
busquedaRoutes.get("/listarTags", listarTags)
busquedaRoutes.get("/listarPostsPorGrupo/:id_grupo", listarPostsPorGrupo)

export default busquedaRoutes;