/* global process, __dirname */
module.exports = app => {
  const getIP = req => req.headers['x-forwarded-for'] ||
                       req.connection.remoteAddress ||
                       req.socket.remoteAddress ||
                       req.connection.socket.remoteAddress;
  app.use((req, res, next) => {
    // if(req.cookies.keygen === undefined) {
    app.get('getUserId')(getIP(req), result => {
      if(result.err === null && result.res.statusCode === 200) {
        const uuid = JSON.parse(result.body).uuid;
        res.cookie('keygen', uuid);
        req.cookies.keygen = uuid;
      }
      next();
    });
    // } else
    // next();
  });

  app.get('^/$', (req, res) => {
    req.app.get('getMainContent')(content => {
      const pageInfo = {
        name: 'index',
        title: 'Index',
        description: 'index',
        pageContent: {
          komica: content.content,
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

