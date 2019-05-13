/* global process, __dirname */
module.exports = app => {
  const getIP = req => req.headers['x-forwarded-for'] ||
                       req.connection.remoteAddress ||
                       req.socket.remoteAddress ||
                       req.connection.socket.remoteAddress;
  app.use((req, res, next) => {
    if(req.cookies.keygen === undefined) {
      app.get('getUserId')(getIP(req), result => {
        if(result.err === null) {
          const uuid = JSON.parse(result.body).uuid;
          res.cookie('keygen', uuid);
          req.cookies.keygen = uuid;
          next();
        } else
          res.status(404).send('Fail to get userId');
      });
    } else
      next();
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
        pageInfo.pageContent.hisland = JSON.parse(result.body);
        const renderedContent = req.app.get('render')(pageInfo);
        res.send(renderedContent);
      });
    });
  });
};

