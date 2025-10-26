import {pool} from '../../lib/db.js'

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
        const [tagsQuery] = await pool.query(`SELECT TAGS.ID, TAGS.NOMBRE AS title, COLOR_TEXTO AS color FROM TAGS
            INNER JOIN GRUPO_TAGS ON TAGS.ID_GRUPO = GRUPO_TAGS.ID;`)
        return res.status(200).send({message: "OK!!", data: tagsQuery})
    } catch (err) {
        console.log("error", err);
        return res.status(500).json({
            message: "Ha ocurrido un error al listar las etiquetas",
        });
    }
}