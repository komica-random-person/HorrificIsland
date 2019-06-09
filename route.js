/* global process, __dirname */
module.exports = app => {
  const getThreadPageInfo = (req, { name='index', title='Index', description='index', pageContent={} }) => {
    let themeIndex = req.cookies.theme === undefined ? 0 : Number(req.cookies.theme);
    themeIndex = isNaN(themeIndex) ? 0 : themeIndex;
    pageContent.themeIndex = themeIndex;
    return { name, title, description, pageContent };
  };
  app.get('^/$', (req, res) => {
    req.app.get('getMainContent')(content => {
      const pageInfo = getThreadPageInfo(req, { pageContent: { komica: content.content }});
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
      const pageInfo = getThreadPageInfo(req, { pageContent: { hisland: [result], replyFormat: true } });
      const renderedContent = req.app.get('render')(pageInfo);
      res.send(renderedContent);
    }, error => {
      const { res: response, body, err } = error;
      res.status(500).send(body);
    });
  });
};

