module.exports = {
  screeps: {
    username: process.env.SCREEPS_USERNAME,
    password: process.env.SCREEPS_PASSWORD,
    token: process.env.SCREEPS_TOKEN,
    method: process.env.METHOD, // Valid Options: 'console' 'memory.stats'
    segment: process.env.SCREEPS_SEGMENT,
    shard: process.env.SCREEPS_SHARD || 'shard0',
    connect: {
      host: process.env.SCREEPS_SERVER_HOST || 'screeps.com',
      port: process.env.SCREEPS_SERVER_PORT || 443,
      protocol: process.env.SCREEPS_SERVER_PROTOCOL || 'https',
      path: process.env.SCREEPS_SERVER_PATH || '/'
    }
  },
  service: {
    url: process.env.GRAFANA_URL,
    token: process.env.GRAFANA_AUTH_TOKEN
  },
  // This dumps stats to console on every push if enabled
  showRawStats: process.env.PRINT_RAW_STATS === 'true'
}
