/* global: getID, getQuery, getQueries, getQueriesArray, escape, findParent, $ */
const apiUrl = 'http://localhost:8888/';

$(() => {
  const postError = errorCode => {
  
  };
  const postArticle = evt => {
    evt.stopImmediatePropagation();
    const tags = getID('hashtags').value || null;
    const postData = {
      name: getID('postName').value || null,
      title: getID('postTitle').value || null,
      content: getID('postContent').value || null,
      imageurl: getID('imgurl').value || null,
      tags: tags === null ? null : tags.replace(/,\s*/g, ',').split(','),
      allowComment: getID('allowComment').value === 'on',
      documentType: evt.target.dataset.type === 'reply' ? 'reply' : 'post',
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
      postError('NoContent');
    } else {
      postFormAPI('article', data, response => {
        console.log(response)
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
        article.appendChild(q);
      } else {
        q = getQuery('.quickPostTable');
        q.className = q.className.replace(/\s*hidden\s*/g, ' ');
      }

      q.querySelector('textarea').value += `>>${targetNum}\n`;
      /* 設定位置 */
      const coord = [evt.clientX, evt.clientY];
      q.style.position = 'fixed';
      q.style.top = coord[1] + 'px';
      q.style.left = coord[0] + 'px';
      q.querySelector('textarea').focus();

      /* 綁定拖曳事件 */
      q.onmousedown = _evt => {
        evt.stopImmediatePropagation();
        const target = _evt.target;
        const key = ['div', 'section', 'form'];
        const offsetX = _evt.clientX - Number(q.style.left.split('p')[0]);
        const offsetY = _evt.clientY - Number(q.style.top.split('p')[0]);
        if(key.indexOf(target.tagName.toLowerCase()) !== -1 && target.id !== 'submit') {
          /* 由於事件綁定在父元素，必須判定是哪個子元素觸發的 */
          const move = mEvt => {
            const top = -offsetY + mEvt.clientY;
            const left = -offsetX + mEvt.clientX;
            q.style.top = `${top}px`;
            q.style.left = `${left}px`;
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
    });
  });

  /* API 使用之 function */
  const getHeader = () => {
    const header = {};
    header["X-user-id"] = $.cookie('keygen');
    return header;
  };
  const postFormAPI = (func, data, callback) => {
    $.ajax({
      type: 'POST',
      url: apiUrl + func,
      data,
      contentType: false,
      processData: false,
      headers: getHeader(),
      success: (_data, textStatus, jqXHR) => {
        console.log(func);
        console.log(_data);
        callback(_data);
      },
      timeout: 20000,
      error: (jqXHR, textStatus, errorThrown) => {
        console.log('error at:' + func);
        console.log(jqXHR.status);
        console.log(textStatus);
        console.log(errorThrown);
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
        console.log(func);
        console.log(_data);
        callback(_data, textStatus, jqXHR);
      },
      timeout: 20000,
      error: (jqXHR, textStatus, errorThrown) => {
        console.log('error at:' + func);
        console.log(jqXHR.status);
        console.log(textStatus);
        console.log(errorThrown);
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
        console.log('error at:' + func);
        console.log(jqXHR.status);
        console.log(textStatus);
        console.log(errorThrown);
      },
    });
  };
});




