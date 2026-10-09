import { REPOSITORIO_ARCHIVOS_CLEO } from './config.js'
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import sftp from './sftpSSH.js'

export const listarPostsCarpetas = async () => {
    const urlRepo = join(REPOSITORIO_ARCHIVOS_CLEO, 'posts');
    const entradas = await readdir(urlRepo, { withFileTypes: true });
    const carpetas = entradas
        .filter((entrada) => entrada.isDirectory())
        .map((entrada) => entrada.name);

    return carpetas;
}

export const listarCarpetasDinamicas = async (urlRepo) => {
    const entradas = await readdir(urlRepo, { withFileTypes: true });
    const carpetas = entradas
        .filter((entrada) => entrada.isDirectory())
        .map((entrada) => entrada.name);

    return carpetas;
}

export const listarArchivosDinamicos = async (urlRepo) => {
    const entradas = await readdir(urlRepo, { withFileTypes: true });
    const archivos = entradas
        .filter((entrada) => entrada.isFile())
        .map((entrada) => entrada.name);

    return archivos;
}

export const listarPostsCarpetasLinux = async () => {
    const urlRepo = `${REPOSITORIO_ARCHIVOS_CLEO}/Posts`;
    const entradas = await sftp.list(urlRepo);
    const carpetas = entradas
        .filter((entrada) => entrada.type === 'd')
        .map((entrada) => entrada.name);
    return carpetas;
}

export const listarCarpetasDinamicasLinux = async (urlRepo) => {
    const entradas = await sftp.list(urlRepo);
    const carpetas = entradas
        .filter((entrada) => entrada.type === 'd')
        .map((entrada) => entrada.name);
    return carpetas;
}

export const listarArchivosDinamicosLinux = async (urlRepo) => {
    const entradas = await sftp.list(urlRepo);
    const archivos = entradas
        .filter((entrada) => entrada.type === '-')
        .map((entrada) => entrada.name);
    return archivos;
}