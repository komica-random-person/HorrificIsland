/* global globalFunction, ControlPannel, getID, getQuery, getQueries, isMobile, escape, findParent, $, infoBox, UserStorage */
$(() => {
  /**
   * Formatting number to prefix with N zeros.
   * @param {Number} num Number to be format
   * @param {Number} length Target length
   * @returns {String}
   */
  const formatNum = (num, length=8) => {
    let base = '';
    for(let i = 0; i < length; i++) base += 0;
    return (base + num).split('').reverse().slice(0, length).reverse().join('');
  };
  /**
   * Formatting ISO string into YYYY/MM/DD, HH:mm:ms
   * @param {String} timeString ISO time string to be formatted.
   * @returns {Array.<String>} [YYYY/MM/DD, HH:mm:ms]
   */
  const getTimeString = (timeString) => {
    const date = new Date(timeString);
    const d = {
      year: date.getFullYear(),
      mon: formatNum(date.getMonth() + 1, 2),
      date: formatNum(date.getDate(), 2),
      hour: formatNum(date.getHours(), 2),
      min: formatNum(date.getMinutes(), 2),
      millisecond: formatNum(date.getMilliseconds(), 3)
    };
    return [`${d.year}/${d.mon}/${d.date}`, ` ${d.hour}:${d.min}:${d.millisecond}`];
  };
  /**
   * Generates image header or tag HTML code by image data.
   * @param {{url: String, thumb: String}} imgData Image data to be parse into HTML.
   * @param {String} type Should be either [header,img] determine either to get header or <a><img></a>
   */
  const getImageContent = (imgData, type='header') => {
    if(imgData.url === null) {
      return '';
    } else {
      const s = imgData.url.split('/');
      const content = type === 'header' ? 
        `<header class="col-xs-12 imgInfo"><h4 class="info">檔名: <a class="link" href="${imgData.url}" target="_blank">${s[s.length - 1]}</a></h4></header>`
        :
        `<a class="imgContainer" onclick="showImg(this)" data-ori="${imgData.url}" data-thumb="${imgData.thumb}"><img src="${imgData.thumb}"></a>`;
      return content;
    }
  };
  const getControlPannelHTML = () => document.querySelector('.articleControlPannel').outerHTML;
  const getReplyHTML = data => {
    let html = `<section class="replyBox clearfix" id="${formatNum(data.number, 8)}" data-number="${formatNum(data.number, 8)}">
    <header data-type="reply">
      ${getControlPannelHTML()}
      <span class="articleType">【H-Island】</span>
      <span class="name">${escape(data.name) || '名無し'}</span>
      <span class="date">${getTimeString(data.time)[0]}</span>
      <span class="time">${getTimeString(data.time)[1]}</span>
      <span class="id quotable" data-quotetype="id" data-id="${data.id}">ID:${data.id}</span>
      <span class="num" data-num="${formatNum(data.number, 8)}"><a class="link quotable" data-quotetype="num" data-num="${formatNum(data.number, 8)}">No.${formatNum(data.number, 8)}</a></span>
      <span class="del"><a class="link">刪除</a></span>
      <span class="res">[<a class="link">回覆</a>]</span>
    </header>`;
    if(data.image.url !== null) {
      const s = data.image.url.split('/');
      html += `<section class="col-xs-12 imgInfo">
        <h4 class="info">檔名: <a class="link" href="${data.image.url}" target="_blank">${s[s.length - 1]}</a></h4>
    </section>
    <a class="imgContainer" onclick="showImg(this)" data-ori="${data.image.url}" data-thumb="${data.image.thumb}"><img src="${data.image.thumb}"></a>`;
    }
    html +=`<p class="content">${escape(data.content).split('\n').map(e => `<span>${e}</span>`).join('<br>')}</p>
    <p class="quotedList"><span class="text">Replies(<span class="quotedNum">0</span>):</span></p>
</section>`;
    return html;
  };
  const getArticleHTML = data => {
    data.number = formatNum(data.number, 8);
    data.title = data.title || '無題';
    data.name = data.name || '名無し';
    return `<article class="thread col-xs-12 clearfix" id="${data.number}" data-number="${data.number}" data-articletype="hisland">
    <form>
        ${getImageContent(data.image)}
        <section class="contentSection col-xs-12">
            <header data-type="post">
              ${getControlPannelHTML()}
              ${getImageContent(data.image, 'img')}
              <span class="articleType">【H-Island】</span>
              <span class="title">${escape(data.title)}</span>
              <span class="name">${escape(data.name)}</span>
              <span class="date">${getTimeString(data.time)[0]}</span>
              <span class="time">${getTimeString(data.time)[1]}</span>
              <span class="id" data-quotetype="id" data-id="${data.id}">ID:${data.id}</span>
              <span class="num" data-num="${data.number}"><a class="link quotable" data-quotetype="num" data-num="${data.number}">No.${data.number}</a></span>
              <span class="del"><a class="link">刪除</a></span>
              <span class="res">[<a class="link">回覆</a>]</span>
            </header>
            <section class="mainContent">
                <p class="content show" style="">${escape(data.content).split('\n').map(e => `<span>${e}</span>`).join('<br>')}</p>
                <p class="quotedList"><span class="text">Replies(<span class="quotedNum">0</span>):</span>
                </p>
            </section>
        </section>
    </form>
</article>`;
  };
  const postError = error => {
    infoBox({
      header: `ERROR: code ${error.code}`,
      content: error.message,
      className: 'error',
    });
  };
  const postArticle = evt => {
    evt.stopImmediatePropagation();
    const target = evt.target;
    if(target.getAttribute('disabled') === 'true')
      return;
    /* 傳送時的按鈕屬性 */
    target.setAttribute('disabled', true);
    const tempString = target.innerText;
    target.innerText = '傳送中...';
    const tags = getID('hashtags').value || null;
    /* 傳送資料整理 */
    const mainEle = findParent(target, 'postContainer');
    const isReply = target.dataset.type === 'reply';
    const postData = {
      name: getQuery('#postName', mainEle).value || null,
      title: isReply ? null : getID('postTitle').value || null,
      content: getQuery('#postContent', mainEle).value || null,
      imageurl: getQuery('#imgurl', mainEle).value || null,
      tags: tags === null ? null : tags.replace(/,\s*/g, ',').split(','),
      allowComment: isReply ? false : getID('allowComment').value === 'on',
      documentType: isReply ? 'reply' : 'post',
      mainNumber: isReply ? Number(mainEle.dataset.number) : -1
    };
    const data = new FormData();
    for(let k in postData)
      data.append(k, postData[k]);
    const imgfile = getID('imgfile').files;
    if(imgfile.length > 0)
      data.append('imgfile', imgfile[0]);
    else
      data.append('imgfile', null);

    /**
     * Resume the post table since clicking 'post' would disable the submit button
     * @param {Boolean} success Determine either to clear the post table or not.
     */
    const resumePostTable = (success=false) => {
      target.removeAttribute('disabled');
      target.innerText = tempString;
      if(success)
        $(findParent(target, 'postTable')).find('input, textarea').val('');
    };
    /* check if the post is OK */
    if(postData.imageurl !== null && postData.imageurl.toLowerCase().match(/http[s]*:\/\/.+(\.jpg$|\.png$|\.jpeg$|\.gif$)/) === null) {
      infoBox({ header: 'ERROR', content: '圖片網址要以 http 開頭，jpg, png, jpeg, gif 做結尾', className: 'error' });
      resumePostTable();
      return;
    }
    if(postData.content === null && postData.imageurl === null && imgfile.length === 0) {
      postError({ code: -1, message: '內文和影像不得同時為空' });
      resumePostTable();
    } else {
      api.postForm('article', data).then(response => {
        const responseData = response.data;
        if(responseData.code === 0) {
          const article = responseData.data;
          if(isReply) {
            const html = getReplyHTML(article);
            const $article = $(`article[data-number="${mainEle.dataset.number}"]`);
            $article.find('.contentSection').append(html);
            globalFunction.updateQuote($article[0]);
            globalFunction.bindHoverBox($article[0]);
            globalFunction.bindIdReference($article[0]);
            globalFunction.bindQuickReply($article[0]);
            getQuery('.exit', mainEle).click();
            new ControlPannel($article[0]);
          } else {
            const html = getArticleHTML(article);
            const $articleContainer = $('main.articleContainer');
            $articleContainer.prepend(html);
            globalFunction.bindQuickReply($articleContainer[0].children[0]);
            new ControlPannel($articleContainer[0].children[0]);
          }
          resumePostTable(true);
        } else {
          resumePostTable();
          postError(responseData);
        }
      }).catch(error => {
        infoBox({ header: 'ERROR', className: 'error', content: error.jqXHR.responseText });
        resumePostTable();
      });
    }
  };
  getID('submit').addEventListener('click', postArticle);

  /**
   * Bind the subfunctions of posting articles.
   * @param {HTMLElement} mainElement Documnet or the container of quickReply
   */
  const bindPostSupplement = (mainElement=document) => {
    /* 使用類似閉包的方式來判斷是否要進行 subfunction 的啟用 */
    let lastChecked = null;
    $(mainElement).find('input[name="func"]').on('click', evt => {
      /* Reset all */
      $(mainElement).find('input[name="func"]:checked').prop('checked', false);
      $(mainElement).find('.hidden-func').removeClass('active');
      const target = evt.target;
      /** 若該 subfunction 開關被點擊兩次則關閉該 subfunction */
      if(lastChecked !== target) {
        target.checked = true;
        const targetCss = `.hidden-func.${target.dataset.target}`;
        const targetElement = getQuery(targetCss, mainElement);
        if(targetElement !== null)
          targetElement.className += ' active';
        lastChecked = target;
      } else {
        lastChecked = null;
      }
    });
  };
  bindPostSupplement();

  /**
   * 綁定點按文章編號時的快速回復相關功能
   * @param {HTMLElement} element Document to bind with
   */
  const bindQuickReply = (element=document) => {
    $(element).find('span.num a.quotable').each((index, element) => {
      const article = findParent(element, 'thread');
      element.addEventListener('click', evt => {
        evt.stopImmediatePropagation();
        const mainNumber = article.dataset.number;
        const targetNum = element.dataset.num;
        /* 如果已經存在則僅改變位置，不用初始化 */
        let q = null;
        if(getQuery('.quickPostTable') === null) {
          q = document.createElement('div');
          q.className = 'quickPostTable postContainer';
          const quickPostHTML = getID('postTable').outerHTML;
          q.innerHTML = quickPostHTML;
          /* 綁定功能 */
          bindPostSupplement(q);
          /* 整理版面 */
          q.querySelector('#submit').innerText = '回復';
          q.querySelector('#submit').dataset.type = 'reply';
          getQueries('.postInfo[data-id="postTitle"], section.addition', q).forEach(e => e.parentElement.removeChild(e));
          q.style.position = 'fixed';
          article.appendChild(q);
        } else {
          q = getQuery('.quickPostTable');
          q.className = q.className.replace(/\s*hidden\s*/g, ' ');
        }

        q.dataset.number = mainNumber;
        q.querySelector('textarea').value += `>>${targetNum}\n`;
        /* 設定位置 */
        const coord = [evt.clientX, evt.clientY];
        const x = coord[0] + q.offsetWidth > window.innerWidth;
        const y = coord[1] + q.offsetHeight > window.innerHeight;
        q.style.top = (isMobile ? 5 : (y ? window.innerHeight - q.offsetHeight : coord[1])) + 'px';
        q.style.left = (x ? window.innerWidth - q.offsetWidth - 15 : coord[0]) + 'px';
        q.querySelector('textarea').focus();

        /* 綁定拖曳事件 */
        q.onmousedown = _evt => {
          evt.stopImmediatePropagation();
          const target = _evt.target;
          const key = ['div', 'section', 'form'];
          const offsetX = _evt.clientX - Number(q.style.left.split('p')[0]);
          const offsetY = _evt.clientY - Number(q.style.top.split('p')[0]);
          /* 由於事件綁定在父元素，必須判定是哪個子元素觸發的 */
          if(key.indexOf(target.tagName.toLowerCase()) !== -1 && target.id !== 'submit') {
            const move = mEvt => {
              const top = -offsetY + mEvt.clientY;
              const left = -offsetX + mEvt.clientX;
              const x = (left + q.offsetWidth > window.innerWidth) ? window.innerWidth - q.offsetWidth - 15 :
                (left < 0 ? 0 : left);
              const y = (top + q.offsetHeight > window.innerHeight) ? window.innerHeight - q.offsetHeight :
                (top < 0 ? 0 : top);
              q.style.top = `${y}px`;
              q.style.left = `${x}px`;
            };
            const main = document.querySelector('main');
            main.addEventListener('mousemove', move);
            const unbind = e => {
              e.stopImmediatePropagation();
              main.removeEventListener('mousemove', move);
              main.onmouseup = null;
            };
            main.onmouseup = unbind;
          }
        };
        /* 綁定結束事件 */
        q.querySelector('.exit').addEventListener('click', () => {
          q.className += ' hidden';
        });
        q.querySelector('#submit').addEventListener('click', postArticle);
      });
    });
  };
  bindQuickReply();
  globalFunction.bindQuickReply = bindQuickReply;

  const api = new API();
  globalFunction.api = api;
  api.get('user/uuid').then(res => {
    $.cookie('keygen', res.uuid);
    const user = new UserStorage();
    /* Check if ID belongs to today */
    const getTodayString = date => `${date.getFullYear()}${date.getMonth()}${date.getDate()}`;
    const getCompareDate = () => getTodayString(new Date(user.data.key.time)) !== getTodayString(new Date());
    const notDefined = (user.data.key === null) || (user.data.key === undefined) || (user.data.key.id === undefined) || (user.data.key.uuid === undefined) || (user.data.key.time === undefined);
    if(notDefined || user.data.key.uuid !== res.uuid || getCompareDate()) {
      api.get('user/id').then(_res => {
        user.setKeyVal('key', { uuid: res.uuid, id: _res.id, time: new Date() });
        $('#userPannel #userId').text(user.data.key.id);
      }).catch(api.onError);
    } else
      $('#userPannel #userId').text(user.data.key.id);
    $('#APIstatus').addClass('show').find('.fail').remove();
  }).catch(api.onError);
});

class API {
  /**
   * @param {String} url Url to API server
   */
  constructor(url='http://localhost:8888/') {
    this.url = url;
  }
  /**
   * Get basic header from cookie
   * @returns {{ 'X-user-id': string }} headers Object contains mutiple customized headers.
   */
  get header () {
    const header = {};
    header['X-user-id'] = $.cookie('keygen');
    return header;
  }
  /**
   * Bind basic header with customized headers.
   * @param {Object} headers Object contains mutiple customized headers.
   */
  advanceHeader(headers) {
    const header = this.header;
    for(let key in headers)
      header[key] = headers[key];
    return header;
  }
  /**
   * @param {String} func Url to GET. Should NOT be start with /.
   * @returns {Promise}
   */
  get(func) {
    const self = this;
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'GET',
        dataType: 'json',
        headers: self.header,
        url: self.url + func,
        contentType: 'application/json;',
        success: (data, textStatus, jqXHR) => {
          resolve(data, textStatus, jqXHR);
        },
        error: (jqXHR, textStatus, errorThrown) => {
          console.log(`ERROR at: ${func} (${jqXHR.responseText})`);
          console.log(`ERROR code: ${jqXHR.status}, ERROR thrown: ${errorThrown}`);
          reject({ jqXHR, textStatus, errorThrown });
        },
      });
    });
  }
  /**
   * Post formData to requested url
   * @param {string} func 
   * @param {FormData} data 
   */
  postForm (func, data) {
    const self = this;
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'POST',
        url: self.url + func,
        data,
        contentType: false,
        processData: false,
        headers: self.header,
        success: (_data, textStatus, jqXHR) => {
          resolve({ data: _data, textStatus, jqXHR });
        },
        timeout: 20000,
        error: (jqXHR, textStatus, errorThrown) => {
          console.log(`ERROR at: ${func} (${jqXHR.responseText})`);
          console.log(`ERROR code: ${jqXHR.status}, ERROR thrown: ${errorThrown}`);
          reject({ jqXHR, textStatus, errorThrown });
        },
      });
    });
  }
  /**
   * Post data to requested url
   * @param {string} func 
   * @param {FormData} data 
   */
  post (func, data) {
    const self = this;
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'POST',
        url: self.header + func,
        data: JSON.stringify(data),
        contentType: 'application/json;',
        dataType: 'json',
        headers: self.header,
        success: (_data, textStatus, jqXHR) => {
          resolve({ data: _data, textStatus, jqXHR });
        },
        timeout: 20000,
        error: (jqXHR, textStatus, errorThrown) => {
          console.log(`ERROR at: ${func} (${jqXHR.responseText})`);
          console.log(`ERROR code: ${jqXHR.status}, ERROR thrown: ${errorThrown}`);
          reject({ jqXHR, textStatus, errorThrown });
        },
      });
    });
  }
  onError(res) {
    console.log(res);
    $('#APIstatus').addClass('show').find('.success').remove();
  }
}
