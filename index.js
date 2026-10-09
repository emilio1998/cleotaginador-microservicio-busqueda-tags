import 'dotenv/config'
import express from 'express'
import cors from 'cors';
import { PORT } from './server/lib/config.js';
import morganLogger from './server/lib/services/logger.js';
import bodyParser from 'body-parser';

import routes from './server/routes/routes.js'

const app = express();

//Middlewares de express
app.use(express.json({ limit: '50mb' }))
//Middleware para logs
app.enable("trust proxy");
app.use(morganLogger);

/* app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: './server/uploads'
})) */

app.use(cors());
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

//Routes

app.use(routes);

app.listen(PORT, () => {
  console.log(`Microservicios de Busqueda de tags está activo en el puerto ${PORT}.`);
});

//Verificar coneccion SFTP
import sftp from './server/lib/sftpSSH.js';
sftp.on('ready', () => {
  console.log('Conexión SFTP establecida correctamente.');
});
sftp.on('error', (err) => {
  console.error('Error en la conexión SFTP:', err);
});