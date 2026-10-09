import {pool} from '../../lib/db.js'
import { REPOSITORIO_ARCHIVOS_CLEO } from '../../lib/config.js'
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { listarPostsCarpetas, listarPostsCarpetasLinux,
    listarArchivosDinamicos, listarArchivosDinamicosLinux
 } from '../../lib/serviciosPosts.js'
import sizeOf from 'image-size';
import fs from 'node:fs';
import sftp from '../../lib/sftpSSH.js'
import { REPOSITORIO_ARCHIVOS_CLEO_LINUX } from '../../lib/config.js'

const EXTENSIONES_IMAGENES = ['jpg', 'jpeg', 'png', 'gif'];
const EXTENSIONES_VIDEOS = ['mp4', 'mov', 'avi', 'mkv'];

export const consultarPosts = async (req, res) => {
    try {
        const [consultarPosts] = await pool.query(`SELECT * FROM POST;`)
        return res.status(200).send({message: "La consulta ha salido con Éxito!!!", datos: consultarPosts})
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar los Posts",
        });
    }
}

export const mostrarPostDetalles = async (req, res) => {
    try {
        const {id_post} = req.params;
        const [postQuery] = await pool.query(`SELECT POST.*, GROUP_CONCAT(TAGS.NOMBRE SEPARATOR ', ') AS TAGS FROM POST 
            INNER JOIN POST_TAGS ON POST.ID = POST_TAGS.ID_POST
            INNER JOIN TAGS ON POST_TAGS.ID_TAG = TAGS.ID
            WHERE POST.ID = ?
            GROUP BY POST.ID;`, [id_post])

        const [creadoresQuery] = await pool.query(`SELECT TAGS.NOMBRE, POST_TAGS.ID_POST, TIPO_TAG FROM TAGS 
            INNER JOIN POST_TAGS ON TAGS.ID = POST_TAGS.ID_TAG
            WHERE ID_GRUPO = 3 AND POST_TAGS.ID_POST = ?
            ORDER BY 
                CASE WHEN TAGS.TIPO_TAG = 'PROPIO' THEN 0 ELSE 1 END;`, [id_post])

        const creadoresPropios = creadoresQuery
            .filter(cre => cre.TIPO_TAG === "PROPIO")
            .map(cre => cre.NOMBRE)
            .join(', ');
        const creadoresCompañia = creadoresQuery
            .filter(cre => cre.TIPO_TAG === "COMPAÑIA")
            .map(cre => cre.NOMBRE)
            .join(', ');
        

        const dataRes = {
            codigo: postQuery[0].ID,
            nombre: postQuery[0].TITULO,
            tags: postQuery[0].TAGS,
            creador_propio: creadoresPropios,
            creadores_compañia: creadoresCompañia,
            unico_archivo: postQuery[0].UNICO_ARCHIVO.readUInt8(0) === 1
            /* peso: postQuery[0].DATOS_ARCHIVO ? postQuery[0].DATOS_ARCHIVO.peso_archivo: null,
            numero_paginas: postQuery[0].DATOS_ARCHIVO ? postQuery[0].DATOS_ARCHIVO.numero_paginas : null */
        }

        if(Object.keys(postQuery[0].DATOS_ARCHIVO).length !== 0) {
            const datosExtra = Object.keys(postQuery[0].DATOS_ARCHIVO);
            for (const dato of datosExtra) {
                dataRes[dato] = postQuery[0].DATOS_ARCHIVO[dato]
            }
        }

        return res.status(200).send({message: "Datos enviados", data: dataRes})
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al mostrar los Posts",
        });
    }
}

export const listarPosts = async (req, res) => {
    try {
        const [postsQuery] = await pool.query(`SELECT ID, TITULO FROM POST;`)
        const [gruposQuery] = await pool.query(`SELECT * FROM GRUPO_TAGS;`)

        for (const p of postsQuery) {
            for (const g of gruposQuery) {
                const [filtrarGruposQuery] = await pool.query(`SELECT TAGS.* FROM POST_TAGS 
                    INNER JOIN TAGS ON POST_TAGS.ID_TAG = TAGS.ID
                    INNER JOIN GRUPO_TAGS ON TAGS.ID_GRUPO = GRUPO_TAGS.ID
                    WHERE ID_POST = ? AND GRUPO_TAGS.ID = ?`, [p.ID, g.ID])

                if (g.ID === 3) {
                    const creadoresPropios = filtrarGruposQuery
                        .filter(cre => cre.TIPO_TAG === "PROPIO")
                        .map(cre => cre.NOMBRE)
                        .join(', ');
                    const creadoresCompañia = filtrarGruposQuery
                        .filter(cre => cre.TIPO_TAG === "COMPAÑIA")
                        .map(cre => cre.NOMBRE)
                        .join(', ');

                    p.creador_propio = creadoresPropios
                    p.creadores_compañia = creadoresCompañia
                }

                const filtracionTags = filtrarGruposQuery
                    .map(cre => cre.NOMBRE)
                    .join(', ');

                p[g.TITULO_GRUPO_TAG] = filtracionTags
            }
        }
        
        return res.status(200).send({message: "OK!!!", data: postsQuery})
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar los Posts",
        });
    }
}

export const listarGruposTags = async (req, res) => {
    try {
        const [gruposTagsQuery] = await pool.query(`SELECT * FROM GRUPO_TAGS;`)
        const [todosLosPosts] = await pool.query(`SELECT DISTINCT P.* FROM POST P
            INNER JOIN (SELECT T.*, PT.ID_POST, GT.TITULO_GRUPO_TAG FROM TAGS T
            INNER JOIN GRUPO_TAGS GT ON T.ID_GRUPO = GT.ID
            INNER JOIN POST_TAGS PT ON T.ID = PT.ID_TAG) TJ ON P.ID = TJ.ID_POST;`)
        return res.status(200).send({message: "Consulat Exitosa!!", grupos: gruposTagsQuery, posts: todosLosPosts})
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar las etiquetas dinámicas",
        });
    }
}

export const listarPostsPorGrupo = async (req, res) => {
    try {
        const { id_grupo } = req.params;
        
        const [postsQuery] = await pool.query(`SELECT DISTINCT P.* FROM POST P
        INNER JOIN (SELECT T.*, PT.ID_POST, GT.TITULO_GRUPO_TAG FROM TAGS T
            INNER JOIN GRUPO_TAGS GT ON T.ID_GRUPO = GT.ID
            INNER JOIN POST_TAGS PT ON T.ID = PT.ID_TAG) TJ ON P.ID = TJ.ID_POST
        WHERE TJ.ID_GRUPO = ?;`, [id_grupo])

        for (const p of postsQuery) {
            const [filtrarTagsQuery] = await pool.query(`SELECT TJ.* FROM POST P
            INNER JOIN (SELECT T.*, PT.ID_POST, GT.TITULO_GRUPO_TAG FROM TAGS T
                INNER JOIN GRUPO_TAGS GT ON T.ID_GRUPO = GT.ID
                INNER JOIN POST_TAGS PT ON T.ID = PT.ID_TAG) TJ ON P.ID = TJ.ID_POST
            WHERE P.ID = ?;`, [p.ID, id_grupo])

            p.etiquetas = filtrarTagsQuery;
        }

        return res.status(200).send({ message: "Consulta Exitosa!!", data: postsQuery })
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar los Posts por grupo",
        });
    }
}

export const listarEtiquetasDinamico = async (req, res) => {
    try {
        const {id_grupo} = req.params;

        const [tags1] = await pool.query(`SELECT T.* FROM TAGS T
            INNER JOIN GRUPO_TAGS GT1 ON T.ID_GRUPO = GT1.ID
            INNER JOIN TAG_RELACIONES T1 ON T.ID = T1.ID_TAG_1
            INNER JOIN (SELECT TA1.*, GT1.TITULO_GRUPO_TAG AS GRUPO_TAG_1 FROM TAGS TA1
                            INNER JOIN GRUPO_TAGS GT1 ON TA1.ID_GRUPO = GT1.ID) TA1 ON T1.ID_TAG_2 = TA1.ID
            WHERE GT1.ID = ?
            GROUP BY T.ID;`, [id_grupo])

        const [tags2] = await pool.query(`SELECT T.* FROM TAGS T
            INNER JOIN GRUPO_TAGS GT2 ON T.ID_GRUPO = GT2.ID
            INNER JOIN TAG_RELACIONES T2 ON T.ID = T2.ID_TAG_2
            INNER JOIN (SELECT TA2.*, GT2.TITULO_GRUPO_TAG AS GRUPO_TAG_2 FROM TAGS TA2
                            INNER JOIN GRUPO_TAGS GT2 ON TA2.ID_GRUPO = GT2.ID) TA2 ON T2.ID_TAG_1 = TA2.ID
            WHERE GT2.ID = ?
            GROUP BY T.ID;`, [id_grupo])

        // Unir ambos arrays y eliminar duplicados por ID
        const tagsUnificados = [...tags1, ...tags2];
        const tagsUnicos = Array.from(
            new Map(tagsUnificados.map(tag => [tag.ID, tag])).values()
        );
        
        let almacenarSubTags = [];
        
        for (const tag of tagsUnicos) {
            const [subTags1] = await pool.query(`SELECT T1.ID AS ID_ASINGNACION, T.*, GT1.TITULO_GRUPO_TAG AS GRUPO_TAG_1, TA1.NOMBRE AS NOMBRE_2, TA1.GRUPO_TAG_2, TA1.ID_GRUPO_2 FROM TAGS T
                INNER JOIN GRUPO_TAGS GT1 ON T.ID_GRUPO = GT1.ID
                INNER JOIN TAG_RELACIONES T1 ON T.ID = T1.ID_TAG_1
                INNER JOIN (SELECT TA1.*, GT1.ID AS ID_GRUPO_2, GT1.TITULO_GRUPO_TAG AS GRUPO_TAG_2 FROM TAGS TA1
                                INNER JOIN GRUPO_TAGS GT1 ON TA1.ID_GRUPO = GT1.ID) TA1 ON T1.ID_TAG_2 = TA1.ID
                WHERE GT1.ID = ? AND T.ID = ? AND T.ID_GRUPO <> TA1.ID_GRUPO_2
                ORDER BY T.ID;`, [id_grupo, tag.ID])

            const [subTags2] = await pool.query(`SELECT T2.ID AS ID_ASINGNACION, T.*, GT2.TITULO_GRUPO_TAG AS GRUPO_TAG_1, TA2.NOMBRE AS NOMBRE_2, TA2.GRUPO_TAG_1 AS GRUPO_TAG_2, TA2.ID_GRUPO_1 AS GRUPO_2 FROM TAGS T
                INNER JOIN GRUPO_TAGS GT2 ON T.ID_GRUPO = GT2.ID
                INNER JOIN TAG_RELACIONES T2 ON T.ID = T2.ID_TAG_2
                INNER JOIN (SELECT TA2.*, GT2.ID AS ID_GRUPO_1, GT2.TITULO_GRUPO_TAG AS GRUPO_TAG_1 FROM TAGS TA2
                                INNER JOIN GRUPO_TAGS GT2 ON TA2.ID_GRUPO = GT2.ID) TA2 ON T2.ID_TAG_1 = TA2.ID
                WHERE GT2.ID = ? AND T.ID = ? AND T.ID_GRUPO <> TA2.ID_GRUPO_1
                ORDER BY T.ID;`, [id_grupo, tag.ID])

            const subTagsUnificados = [...subTags1, ...subTags2];
            almacenarSubTags.push(...subTags1, ...subTags2);
            const subTagsUnicos = Array.from(
                new Map(subTagsUnificados.map(subTag => [subTag.ID_ASINGNACION, subTag])).values()
            );
            tag.subTags = subTagsUnicos;
        }

        return res.status(200).send({message: "OK!!", data: tagsUnicos})
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar las etiquetas dinámicas",
        });
    }
}

export const listarTags = async (req, res) => {
    try {
        const {excluirGrupos} = req.body; // Ids de los grupos a excluir, separados por comas (Where dinamico)
        let whereDinamico = "";
        
        if (excluirGrupos) {
            const ids = excluirGrupos.split(",");
            whereDinamico = `WHERE GRUPO_TAGS.ID NOT IN (${ids.join(",")})`;
        }

        const [tagsQuery] = await pool.query(`SELECT TAGS.ID, TAGS.NOMBRE AS title, COLOR_TEXTO AS color FROM TAGS
            INNER JOIN GRUPO_TAGS ON TAGS.ID_GRUPO = GRUPO_TAGS.ID ${whereDinamico};`)
        return res.status(200).send({message: "OK!!", data: tagsQuery})
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar las etiquetas",
        });
    }
}

export const listarPostsPorTag = async (req, res) => {
    try {
        const { id_tag } = req.params;

        //Buscar archivos en el repositorio
        const urlRepo = REPOSITORIO_ARCHIVOS_CLEO_LINUX ? `${REPOSITORIO_ARCHIVOS_CLEO}/Posts` : join(REPOSITORIO_ARCHIVOS_CLEO, 'posts');
        const carpetas = REPOSITORIO_ARCHIVOS_CLEO_LINUX ? await listarPostsCarpetasLinux() : await listarPostsCarpetas();


        // Filtros dinámicos para la consulta de posts en la base de datos

        const filtrosPostQuery = []
        const filtrosPostQueryValues = []

        filtrosPostQuery.push(`p.ESTADO = ?`);
        filtrosPostQueryValues.push(1); // Agregar el valor correspondiente para el estado del post

        if (id_tag != 0) {
            filtrosPostQuery.push(`tj.ID_TAG = ?`);
            filtrosPostQueryValues.push(id_tag);
        }

        let query = "";
        if (filtrosPostQuery.length > 0) {
            query = filtrosPostQuery.join(" AND ");
            query = "WHERE " + query;
        }

        const [postsQuery] = await pool.query(`SELECT DISTINCT p.* FROM POST p
            INNER JOIN (SELECT t.ID AS ID_TAG, pt.ID_POST, t.NOMBRE AS title, COLOR_TEXTO FROM TAGS t
                INNER JOIN GRUPO_TAGS gt ON t.ID_GRUPO = gt.ID
                INNER JOIN POST_TAGS pt ON t.ID = pt.ID_TAG
                WHERE gt.ID NOT IN (1, 10)) tj ON p.ID = tj.ID_POST
            ${query};`, filtrosPostQueryValues);

        const postsArray = [];

        for (const p of postsQuery) {

            const unicoArchivo = p.UNICO_ARCHIVO.readUInt8(0) === 1;
            const jsonDatosArchivo = p.DATOS_ARCHIVO;

            const [filtrarTagsQuery] = await pool.query(`SELECT tj.* FROM POST p
                INNER JOIN (SELECT t.ID AS ID_TAG, pt.ID_POST, t.NOMBRE AS title, COLOR_TEXTO FROM TAGS t
                    INNER JOIN GRUPO_TAGS gt ON t.ID_GRUPO = gt.ID
                    INNER JOIN POST_TAGS pt ON t.ID = pt.ID_TAG
                    WHERE gt.ID NOT IN (1, 10)) tj ON p.ID = tj.ID_POST
                WHERE p.ID = ?;`, [p.ID]);
            p.tags = filtrarTagsQuery;

            if (!unicoArchivo) {
                const nombreCarpeta = jsonDatosArchivo.nombreCarpeta;
                const verificarCarpeta = carpetas.includes(nombreCarpeta);

                if (!verificarCarpeta) {
                    return res.status(404).json({
                        message: "La carpeta del post no existe",
                    });
                }

                const urlCarpeta = REPOSITORIO_ARCHIVOS_CLEO_LINUX ? `${urlRepo}/${nombreCarpeta}` : join(urlRepo, nombreCarpeta);

                //Imagenes
                const urlImagenes = REPOSITORIO_ARCHIVOS_CLEO_LINUX ? `${urlCarpeta}/Imagenes` : join(urlCarpeta, 'Imagenes');
                const imgsCarpetas = REPOSITORIO_ARCHIVOS_CLEO_LINUX ? await listarArchivosDinamicosLinux(urlImagenes) : await listarArchivosDinamicos(urlImagenes);

                const cantidadImagenes = imgsCarpetas.length;

                //Sacar primera imagen
                const primeraImagen = imgsCarpetas.length > 0 ? imgsCarpetas[0] : null;

                const urlPrimeraImagen = primeraImagen ? (REPOSITORIO_ARCHIVOS_CLEO_LINUX ? `${urlImagenes}/${primeraImagen}` : join(urlImagenes, primeraImagen)) : null;
                const archivoBuffer = REPOSITORIO_ARCHIVOS_CLEO_LINUX ? await sftp.get(urlPrimeraImagen) : fs.readFileSync(urlPrimeraImagen);
                const dimensiones = sizeOf(archivoBuffer);

                const extension = primeraImagen.split('.').pop();
                const base64Data = archivoBuffer.toString('base64');

                const srcBase64 = `data:image/${extension};base64,${base64Data}`;
                

                p.IMAGENES = {
                    carpeta: nombreCarpeta,
                    fotos: cantidadImagenes,
                    imagenPrincipal: {
                        nombre: primeraImagen,
                        ancho: dimensiones.width,
                        alto: dimensiones.height,
                        srcBase64
                    }
                }

                postsArray.push(p);
            }
        }
        return res.status(200).send({message: "OK!!", data: postsArray});
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar los Posts por tag",
        });
    }
}

export const listarImagenesPorPosts = async (req, res) => {
    try {
        const { UNICO_ARCHIVO, DATOS_ARCHIVO } = req.body;

        //Buscar archivos en el repositorio
        const urlRepo = join(REPOSITORIO_ARCHIVOS_CLEO, 'posts');
        const carpetas = await listarPostsCarpetas();
        
        const unicoArchivo = UNICO_ARCHIVO === 1;
        const jsonDatosArchivo = DATOS_ARCHIVO;

        if (!unicoArchivo) {
            const nombreCarpeta = jsonDatosArchivo.nombreCarpeta;
            const verificarCarpeta = carpetas.includes(nombreCarpeta);
            if (!verificarCarpeta) {
                return res.status(404).json({
                    message: "La carpeta del post no existe",
                });
            }

            const urlCarpeta = join(urlRepo, nombreCarpeta);

            //Imagenes
            const urlImagenes = join(urlCarpeta, 'Imagenes');
            const archivosImagenes = await readdir(urlImagenes, { withFileTypes: true });
            const imgsCarpetas = archivosImagenes
                .filter((archivo) => archivo.isFile())
                .map((archivo) => archivo.name);

            const datosImagenes = []
            for (const img of imgsCarpetas) {
                const urlImagen = join(urlImagenes, img);
                const archivoBuffer = fs.readFileSync(urlImagen);
                const dimensiones = sizeOf(archivoBuffer);

                const extension = img.split('.').pop();
                const base64Data = archivoBuffer.toString('base64');

                const srcBase64 = `data:image/${extension};base64,${base64Data}`;
                datosImagenes.push({
                    nombre: img,
                    ancho: dimensiones.width,
                    alto: dimensiones.height,
                    srcBase64
                });
            }
            return res.status(200).send({message: "OK!!", data: datosImagenes.slice(0,7)});
        }
        return res.status(404).json({
            message: "El post no tiene imágenes o no existe",
        });
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar las imágenes por posts",
        });
    }
}

export const listarTagsPorPost = async (req, res) => {
    try {
        const { postId } = req.params;

        if (!postId) {
            return res.status(400).json({
                message: "El ID del post es requerido",
            });
        }

        // Aquí iría la lógica para listar los tags del post según el postId
        // Por ejemplo, podrías consultar la base de datos o el repositorio correspondiente

        const filtrostagQuery = []
        const filtrostagQueryValues = []

        if (postId) {
            filtrostagQuery.push("pt.ID_POST = ?");
            filtrostagQueryValues.push(postId);
        }

        let query = "";
        if (filtrostagQuery.length > 0) {
            query = filtrostagQuery.join(" AND ");
            query = "WHERE " + query;
        }

        const [tagsQuery] = await pool.query(`SELECT t.*, gt.COLOR_TEXTO AS color FROM TAGS t
            INNER JOIN GRUPO_TAGS gt ON t.ID_GRUPO = gt.ID
            INNER JOIN POST_TAGS pt ON t.ID = pt.ID_TAG ${query}`, filtrostagQueryValues);

        if (!tagsQuery || tagsQuery.length === 0) {
            return res.status(404).json({
                message: "No se encontraron tags para el post",
            });
        }

        return res.status(200).json({
            message: "OK!!",
            data: tagsQuery,
        });
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar los tags por post",
        });
    }
}