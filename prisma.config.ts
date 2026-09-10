import * as dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env para o process.env
dotenv.config();

const prismaConfig = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};

export default prismaConfig;