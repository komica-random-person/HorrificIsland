/* global process */
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

  const request = require('request');
  const APIURL = 'http://localhost:8888/';

  app.set('getUserId', (clientIp, cb) => {
    const url = `${APIURL}user/id/${clientIp}`;
    request(url, (err, res, body) => {
      if(!err && res.statusCode === 200) {
        cb({ err, res, body });
      } else {
        cb({ err, res, body });
      }
    });
  });

  const getIP = req => req.headers['x-forwarded-for'] ||
                       req.connection.remoteAddress ||
                       req.socket.remoteAddress ||
                       req.connection.socket.remoteAddress;

  const threadAPI = (uri, userid, resolve, reject=(() => null)) => {
    const url = `${APIURL}${uri}`;
    const headers = { 'X-user-id': userid };
    request({ url, headers }, (err, res, body) => {
      if(err === null && res.statusCode === 200) {
        resolve(body);
      } else {
        reject({ err, res, body });
      }
    });
  };
  app.set('API', { threadAPI, getIP });

  app.set('getHIContent', (userid, cb) => {
    const contentCoolDown = process.env.CACHE_TIME || 30000;
    const requestData = {
      url: `${APIURL}thread/list/`,
      headers: { 'X-user-id': userid }
    };
    if(app.get('contentCoolDown') === undefined) {
      app.set('contentCoolDown', Date.now());
    }
    if(Date.now() - app.get('contentCoolDown') < contentCoolDown && app.get('HIsland-content') !== undefined) {
      /* Under cache cool down, directly send content. */
      cb({ err: null, res: 200, body: app.get('HIsland-content') });
    } else if(app.get('HIsland-content') !== undefined) {
      /* Over cache cool down, directly send content and update content */
      cb({ err: null, res: 200, body: app.get('HIsland-content') });
      request(requestData, (err, res, body) => {
        if(res.statusCode === 200) {
          app.set('HIsland-content', body);
          app.set('contentCoolDown', Date.now());
        }
      });
    } else {
      /* First lunch app, get content and save to cache */
      request(requestData, (err, res, body) => {
        if(res.statusCode === 200) {
          app.set('HIsland-content', body);
          app.set('contentCoolDown', Date.now());
          cb({ err, res: 200, body });
        } else {
          if(app.get('HIsland-content') === undefined)
            cb({ err, res: res.statusCode });
          else
            cb({ err, res: 200, body: app.get('HIsland-content') });
        }
      });
    }
  });

  const homu2hisland = datas => {
    datas = JSON.parse(datas).map(data => {
      const imgBase = 'http://ram.komica2.net/00/src/';
      const imgThumb = 'http://ram.komica2.net/00/thumb/';
      const convert = article => {
        const { Title: title, Name: name, Id: id, No: number, Content: content } = article;
        const withImg = article.Picture !== undefined;
        return {
          title, name, id, number, content, mainNumber: number,
          time: (new Date(article.Date + ' ' + article.Time)).toUTCString(),
          image: {
            url: !withImg ? null : imgBase + article.Picture,
            thumb: !withImg ? null : `${imgThumb}${article.Picture.replace(/^(.+?)\..+$/, '$1s.jpg')}`
          },
          tags: []
        };
      };
      data.post = convert(data.Head);
      data.replies = data.Bodies.map(e => convert(e));
      delete data.Head;
      delete data.Bodies;
      return data;
    });
    return datas;
  };

  app.set('getMainContent', cb => {
    const currentTime = Date.now();
    const prevTime = app.get('komica-time');
    const cacheSecond = process.env.NODE_ENV === 'dev' ? 60 * 180 : 60 * 2;

    if(prevTime === undefined || currentTime - prevTime > 1000 * cacheSecond) {
      /* if currentTime - prevTime > threshold, refresh the content */
      app.set('komica-time', currentTime);
      request('https://homu.homu-api.com/page/0', (error, res, body) => {
        if (res.statusCode === 200) {
          body = homu2hisland(body);
          app.set('komica-content', body);
          cb({
            status: 1,
            content: body,
            refresh: true
          });
        } else {
          cb({
            status: false,
            content: app.get('komica-content'),
            refresh: false
          });
        }
      });
    } else {
      /* Had refreshed recently, directly send old content */
      cb({
        status: 1,
        content: app.get('komica-content'),
        refresh: false,
      });
    }
  });
};

