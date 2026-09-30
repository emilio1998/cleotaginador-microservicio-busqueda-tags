import { REPOSITORIO_ARCHIVOS_CLEO } from './config.js'
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const listarPostsCarpetas = async () => {
    const urlRepo = join(REPOSITORIO_ARCHIVOS_CLEO, 'posts');
    const entradas = await readdir(urlRepo, { withFileTypes: true });
    const carpetas = entradas
        .filter((entrada) => entrada.isDirectory())
        .map((entrada) => entrada.name);

    return carpetas;
}