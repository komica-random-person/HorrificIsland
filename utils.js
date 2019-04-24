'use strict';
module.exports = app => {
  const pug = require('pug');
  app.set('render', pageInfo => {
    /* 1. render page with pugInfo
       2. render container with page */
    const page = { basedir: './app/pug' };
    for(var k in pageInfo)
      page[k] = pageInfo[k];
    page.content = pug.renderFile(`./app/pug/${pageInfo.name}.pug`, pageInfo);
    return pug.renderFile('./app/pug/container.pug', page);
  });

  app.set('getUUID', () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  });

  app.set('get_random_a_to_b', (min, max, num) => {
    if(max < min || num < 1) return 0;
    const get_random_int = () => Math.floor(Math.random() * (max - min + 1) + min);
    let r_array = [];

    let break_cnt = 0;
    while(r_array.length < num) {
      const r = get_random_int();
      if(r_array.indexOf(r) == -1)
        r_array.push(r);
      else
        break_cnt += 1;
      if (break_cnt > 50)
        return r_array;
    }
    return r_array;
  });

  app.set('getMainContent', cb => {
    const currentTime = Date.now();
    const prevTime = app.get('time');
    const cacheSecond = process.env.NODE_ENV === 'dev' ? 60 * 60 : 60 * 2;
    if(prevTime === undefined || currentTime - prevTime > 1000 * cacheSecond) {
      /* if currentTime - prevTime > threshold, refresh the content */
      app.set('time', currentTime);
      const request = require('request');
      request('https://homu.homu-api.com/page/0', (error, res, body) => {
        if (res.statusCode === 200) {
          app.set('content', body);
          cb({
            status: 1,
            content: body,
            refresh: true
          });
        } else {
          cb({
            status: false,
            content: app.get('content'),
            refresh: false
          });
        }
      });
    } else {
      /* Had refreshed recently, directly send old content */
      cb({
        status: 1,
        content: app.get('content'),
        refresh: false,
      });
    }
  });
};
