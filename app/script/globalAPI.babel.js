/* global: getID, getQuery, getQueries, getQueriesArray, escape, findParent, $, infoBox */
const apiUrl = 'https://h-island-api.herokuapp.com/';

$(() => {
  const formatNum = (num, length=8) => {
    let base = '';
    for(let i = 0; i < length; i++) base += 0;
    return (base + num).split('').reverse().slice(0, length).reverse().join('');
  };
  const getTimeString = (utcString) => {
    const date = new Date(utcString);
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
  const getArticleHTML = data => {
    data.number = formatNum(data.number, 8);
    data.title = data.title || '無題';
    data.name = data.name || '名無し';
    return `<article class="thread col-xs-12 clearfix" id="${data.number}" data-number="${data.number}" data-articletype="hisland">
    <form>
        ${getImageContent(data.image)}
        <section class="contentSection col-xs-12">
            <header data-type="main">
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
    const d = new Date();
    const postData = {
      name: getQuery('#postName', mainEle).value || null,
      title: isReply ? null : getID('postTitle').value || null,
      time: d.toISOString(),
      content: getQuery('#postContent', mainEle).value || null,
      imageurl: getQuery('#imgurl', mainEle).value || null,
      tags: tags === null ? null : tags.replace(/,\s*/g, ',').split(','),
      allowComment: isReply ? false : getID('allowComment').value === 'on',
      documentType: isReply ? 'reply' : 'post',
      mainNumber: isReply ? Number(mainEle.dataset.number) : -1
    };
    const data = new FormData();
    for(let k in postData)
      data.append(k, postData[k])
    const imgfile = getID('imgfile').files;
    if(imgfile.length > 0)
      data.append('imgfile', imgfile[0]);
    else
      data.append('imgfile', null);

    /* check if the post is OK */
    if(postData.content === null && postData.imageurl === null && imgfile.length === 0) {
      postError({ code: -1, message: '內文和影像不得同時為空' });
    } else {
      postFormAPI('article', data, response => {
        if(response.code === 0) {
          const article = response.data;
          if(isReply) {
            getQuery('.exit', mainEle).click();
          } else {
            const html = getArticleHTML(article);
            $('main.articleContainer').prepend(html);
          }
          target.removeAttribute('disabled');
          target.innerText = tempString;
          $(findParent(target, 'postTable')).find('input, textarea').val('');
        } else
          postError(response);
      }, error => {
        infoBox({ header: 'ERROR', className: 'error', content: error.err });
        target.removeAttribute('disabled');
        target.innerText = tempString;
      });
    }
  };
  getID('submit').addEventListener('click', postArticle);


  /* 貼文時的輔助選單 */
  const bindPostSupplement = (mainElement=document) => {
    $(mainElement).find('input[name="func"]').on('click', evt => {
      /* Reset all */
      $(mainElement).find('input[name="func"]:checked').prop('checked', false);
      $(mainElement).find('.hidden-func').removeClass('active');
      /* set selected function as activate */
      const target = evt.target;
      target.checked = true;
      const targetCss = `.hidden-func.${target.dataset.target}`;
      const targetElement = getQuery(targetCss, mainElement);
      if(targetElement !== null)
        targetElement.className += ' active';
    });
  };
  bindPostSupplement();

  /* 點按文章編號時的快速回復 */
  $('span.num a.quotable').each((index, element) => {
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
      q.style.top = (y ? window.innerHeight - q.offsetHeight : coord[1]) + 'px';
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

  /* API 使用之 function */
  const getHeader = () => {
    const header = {};
    header["X-user-id"] = $.cookie('keygen');
    return header;
  };
  const postFormAPI = (func, data, callback, catchErr=null) => {
    $.ajax({
      type: 'POST',
      url: apiUrl + func,
      data,
      contentType: false,
      processData: false,
      headers: getHeader(),
      success: (_data, textStatus, jqXHR) => {
        callback(_data);
      },
      timeout: 20000,
      error: (jqXHR, textStatus, errorThrown) => {
        console.log(`ERROR at: ${func} (${jqXHR.responseText})`);
        console.log(`ERROR code: ${jqXHR.status}, ERROR thrown: ${errorThrown}`);
        if(catchErr !== null)
          catchErr(jqXHR.responseJSON);
      },
    });
  };
  const postAPI = (func, data, callback) => {
    $.ajax({
      type: 'POST',
      url: apiUrl + func,
      data: JSON.stringify(data),
      contentType: 'application/json;',
      dataType: 'json',
      headers: getHeader(),
      success: (_data, textStatus, jqXHR) => {
        callback(_data, textStatus, jqXHR);
      },
      timeout: 20000,
      error: (jqXHR, textStatus, errorThrown) => {
        console.log(`ERROR at: ${func} (${jqXHR.responseText})`);
        console.log(`ERROR code: ${jqXHR.status}, ERROR thrown: ${errorThrown}`);
      },
    });
  };
  const getAPI = (func, callback) => {
    $.ajax({
      type: 'GET',
      dataType: 'json',
      headers: getHeader(),
      url: apiUrl + func,
      contentType: 'application/json;',
      success: (data, textStatus, jqXHR) => {
        callback(data, textStatus, jqXHR);
      },
      error: (jqXHR, textStatus, errorThrown) => {
        console.log(`ERROR at: ${func} (${jqXHR.responseText})`);
        console.log(`ERROR code: ${jqXHR.status}, ERROR thrown: ${errorThrown}`);
      },
    });
  };

  /* Check if uuid is valid, if not, call API to get uuid */
  getAPI(`user/uuid/${$.cookie('keygen')}`, res => {
    if(!res.isValid) {
      getAPI(`user/id/`, _res => {
        $.cookie('keygen', _res.uuid);
      });
    }
  });
});

