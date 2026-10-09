const env = process.env;

export const PORT = env.PORT || 4001;
export const REPOSITORIO_ARCHIVOS_CLEO = env.REPOSITORIO_ARCHIVOS_CLEO || '/home/haiparonic-bd/Documentos/RepositorioBD/CleoTaginador';
export const REPOSITORIO_ARCHIVOS_CLEO_LINUX = env.REPOSITORIO_ARCHIVOS_CLEO_LINUX === 'true';