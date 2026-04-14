module.exports = {
  apps: [
    {
      name: 'thrones-server',
      script: 'src/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
