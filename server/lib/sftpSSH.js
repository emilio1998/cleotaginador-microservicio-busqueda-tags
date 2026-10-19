import SftpClient from 'ssh2-sftp-client';
import { ENTORNO } from './config.js';

const sftp = new SftpClient();

const config = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USER,
    password: process.env.SFTP_PASSWORD
}

async function connectSFTP() {
    try {
        await sftp.connect(config);
        console.log('Conexión SFTP establecida correctamente.');
    } catch (error) {
        if (ENTORNO === 'DEV') {
            console.log('Modo desarrollo, corriendo a pesar del error SFTP:', error);
        } else 
            throw new Error(`Error conectando a SFTP: ${error}`);
    }
}

connectSFTP();

export default sftp;