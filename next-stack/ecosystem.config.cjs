module.exports = {
  apps: [
    {
      name: 'nico-api',
      cwd: './apps/api',
      script: './dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
        TRUST_PROXY: '1',
        LOG_HTTP_REQUESTS: '1',
      },
    },
  ],
};

