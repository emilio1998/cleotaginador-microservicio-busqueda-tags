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

export const mostrarPost = async (req, res) => {
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