const baseConfig = require('./app.json');

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

module.exports = () => ({
  ...baseConfig.expo,
  experiments: {
    ...(baseConfig.expo.experiments || {}),
    baseUrl: isGitHubPages ? '/jp-mn-dictionary' : '',
  },
});
