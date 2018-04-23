export default {
  name: 'ETH Transaction Explorer',
  logging: {
    debugSQL: false,
    apolloLogging: ['test', 'production'].indexOf(process.env.NODE_ENV) < 0
  },
  // Check here for Windows and Mac OS X: https://code.visualstudio.com/docs/editor/command-line#_opening-vs-code-with-urls
  // Use this protocol handler for Linux: https://github.com/sysgears/vscode-handler
  stackFragmentFormat: 'vscode://file/{0}:{1}:{2}'
};
