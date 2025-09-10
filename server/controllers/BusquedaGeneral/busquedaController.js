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