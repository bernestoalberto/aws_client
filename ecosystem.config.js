module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [
    // First application
    {
      name      : 'AWS_CLIENT',
      script    : 'CLIENT.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production : {
        NODE_ENV: 'production'
      },
      watch: true,
      // instances: "max",
      // exec_mode: "cluster",
      max_memory_restart : "1000M"
    }

  ]
};
