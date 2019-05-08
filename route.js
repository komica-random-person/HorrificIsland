'use strict';
module.exports = app => {
  app.use((req, res, next) => {
  if(req.cookies.keygen === undefined) {
    const uuid = app.get('getUUID')();
    res.cookie('keygen', uuid);
    req.cookies.keygen = uuid;
    next();
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
            komica: JSON.parse(content.content),
          }
      };
      const renderedContent = req.app.get('render')(pageInfo);
      res.send(renderedContent);
    });
  });
};

