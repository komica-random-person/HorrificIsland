/* global process, __dirname */
module.exports = app => {
  app.get('^/$', (req, res) => {
    let themeIndex = req.cookies.theme === undefined ? 0 : Number(req.cookies.theme);
    themeIndex = isNaN(themeIndex) ? 0 : themeIndex;
    req.app.get('getMainContent')(content => {
      const pageInfo = {
        name: 'index',
        title: 'Index',
        description: 'index',
        pageContent: {
          komica: content.content,
          themeIndex,
        }
      };
      const userid = req.cookies.keygen;
      req.app.get('getHIContent')(userid, result => {
        if(result.res === 200)
          pageInfo.pageContent.hisland = JSON.parse(result.body);
        const renderedContent = req.app.get('render')(pageInfo);
        res.send(renderedContent);
      });
    });
  });

  app.get('^/thread/:num', (req, res) => {
    const api = req.app.get('API');
    const articleNum = req.params.num;
    api.threadAPI(`thread/${articleNum}`, req.cookies.keygen, result => {
      result = JSON.parse(result);
      const pageInfo = {
        name: 'index',
        title: result.post.content,
        description: 'index',
        pageContent: {
          hisland: [result],
          replyFormat: true
        },
      };
      const renderedContent = req.app.get('render')(pageInfo);
      res.send(renderedContent);
    }, error => {
      const { res: response, body, err } = error;
      res.status(500).send(body);
    });
  });
};

