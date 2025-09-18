declare namespace NodeJS {
  interface ProcessEnv {
    JWT_SECRET: string;
    DATABASE_URL: string;
    PORT?: string;
    NODE_ENV?: string;
  }
}