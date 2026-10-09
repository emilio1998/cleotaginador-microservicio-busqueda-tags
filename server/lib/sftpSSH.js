import SftpClient from 'ssh2-sftp-client';

const sftp = new SftpClient();

const config = {
    host: process.env.SFTP_HOST,
    port: process.env.SFTP_PORT,
    username: process.env.SFTP_USER,
    password: process.env.SFTP_PASSWORD
}

sftp.connect(config);

export default sftp;