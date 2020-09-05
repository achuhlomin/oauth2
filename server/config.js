const config = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  mongodbHost: process.env.MONGODB_HOST,
  debug: process.env.DEBUG,
};

export default config;