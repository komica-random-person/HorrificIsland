/* global $, hljs, infoBox, getID, getQuery, findParent, escape, getQueriesArray, getQueries, isMobile, globalFunction */
class ControlPannel {
  constructor(element=null, user=null) {
    this.element = element === null ? document : element;
    this.bindPannelSwitch();
    this.bindControFunction();
    this.user = user === null ? new UserStorage() : user;
  }
  bindPannelSwitch() {
    const self = this;
    $(this.element).find('input.pannelSwitch').on('click', e => {
      e.stopPropagation();
      $(self.element).find('input.pannelSwitch:checked').click();
      const target = e.target;
      const contropannel = findParent(target, 'articleControlPannel');
      const element = contropannel.querySelector('.control');
      element.style.display = target.checked ? 'table' : 'none';
      if(target.checked) {
        $(document).unbind('click').on('click', _e => {
          /* 模仿 8ch 行為，點其他地方關閉 control pannel */
          if(target.checked && findParent(_e.target, 'articleControlPannel') === null)
            target.click();
          $(document).unbind('click');
        });
      }
    });
  }
  bindControFunction() {
    const self = this;
    $(this.element).find('li.btn.btn-default').on('click', evt => {
      evt.stopPropagation();
      const element = evt.target;
      /* click input to close pannel */
      if(element.dataset.act === undefined)
        return;
      if(element.dataset.act.toLowerCase().match(/filter/) !== null) {
        const isLocal = element.dataset.act.match(/local/) !== null;
        self.evtFilter(element, isLocal);
      } else if(element.dataset.act === 'hide')
        self.evtHide(element);
      else if(element.dataset.act === 'delete')
        self.evtDelete(element);
      else if(element.dataset.act === 'report')
        self.evtReport(element);
      $(document).click();
    });
  }
  /**
   * Find the parent (either .thread or .replyBox) of input element
   * @param {HTMLElement} element Should be li.btn.btn-default
   * @returns {HTMLElement} Either .thread or .replyBox element
   */
  findMainElement(element) {
    let parent = findParent(element, 'replyBox');
    if(parent === null)
      parent = findParent(element, 'thread');
    return parent;
  }
  evtHide(btn) {
    const self = this;
    const element = self.findMainElement(btn);
    const hidden = element.className.match(/hiddenArticle/) !== null;
    const data = self.user.data.hidden;
    const num = element.dataset.number;
    if(hidden) {
      element.className = element.className.replace(/\s*hiddenArticle\s*/g, ' ');
      btn.innerText = '隱藏本串';
      const index = data.indexOf(num);
      data.splice(index, 1);
      self.user.setKeyVal('hidden', data);
    } else {
      element.className += ' hiddenArticle';
      btn.innerText = '顯示本串';
      data.push(num);
      self.user.setKeyVal('hidden', data);
    }
  }
  evtFilter(btn, local=false) {
    const self = this;
    const element = self.findMainElement(btn);
    const thread = element.className.match(/replyBox/) === null ? element : findParent(element, 'thread');
    const id = element.querySelector('span.id').dataset.id;
    /* You can't filter yourself! */
    if(self.user.data.key.id === id) {
      infoBox({ header: '嘿！', content: '請不要 NGID 自己！', className: 'error' });
      return;
    }
    if(local) {
      const $thread = $(thread).find(`span.id[data-id="${id}"]`).parents('.replyBox').hide().end().end();
      if(thread.querySelector('span.id').dataset.id === id)
        $thread.hide();
      
      const data = self.user.data.filterLocal;
      data.push({ time: new Date().toISOString(), id, thread: $thread[0].dataset.number });
      self.user.setKeyVal('filterLocal', data);
    } else {
      $(`.thread header[data-type="post"] span.id[data-id="${id}"]`).parents('.thread').hide();
      $(`span.id[data-id="${id}"]`).parents('.replyBox').hide().end().end();

      const data = self.user.data.filter;
      data.push({ time: new Date().toISOString(), id });
      self.user.setKeyVal('filter', data);
    }
  }
  evtDelete(btn) {
    infoBox({ header: 'Oh no !', content: '本功能還沒實作', button: { content: '了解惹' }});
  }
  evtReport(btn) {
    infoBox({ header: 'Oh no !', content: '本功能還沒實作', button: { content: '了解惹' }});
  }
}

class UserStorage {
  constructor(storage=localStorage, name='user') {
    this.storage = storage;
    this.name = name;
    const data = storage.getItem(this.name) === null ? {} : JSON.parse(storage.getItem(this.name));
    const userData = {
      hidden: [],
      filter: [],
      filterLocal: [],
      article: {},
      key: null
    };
    for(let k in data)
      userData[k] = data[k];
    storage.setItem(this.name, JSON.stringify(userData));
  }
  get data() {
    const data = this.storage.getItem(this.name);
    return data === null ? {} : JSON.parse(data);
  }
  set data(_data={}) {
    this.storage.setItem(this.name, JSON.stringify(_data));
  }
  update() {
    const filterFunc = (obj) => {
      const current = new Date();
      const getDayString = timeObj => `${timeObj.getFullYear()}${timeObj.getMonth()}${timeObj.getDate()}`;
      const t = new Date(obj.time);
      return getDayString(current) === getDayString(t);
    };
    const filter = this.data.filter.filter(filterFunc);
    const filterLocal = this.data.filterLocal.filter(filterFunc);
    this.setKeyVal('filter', filter);
    this.setKeyVal('filterLocal', filterLocal);
  }
  clear() {
    const userData = {
      hidden: [],
      filter: [],
      filterLocal: [],
      article: {},
      key: null
    };
    this.storage.setItem(this.name, JSON.stringify(userData));
  }
  applySetting() {
    /* Read the data stored in storage, parse to JSON and apply to browser */
    const data = this.data;
    for(let key in data) {
      if(key === 'filter') {
        /* NGID */
        data[key].forEach(_data => {
          const { id } = _data;
          $(`.thread header[data-type="post"] span.id[data-id="${id}"]`).parents('.thread').hide();
          $(`.replyBox span.id[data-id="${id}"]`).parents('.replyBox').hide();
        });
      } else if(key === 'filterLocal') {
        /* NGID under specific thread */
        const temp = {};
        data[key].forEach(_data => {
          const { thread: num, id } = _data;
          const $thread = temp[num] === undefined ? $(`.thread[data-number="${num}"]`) : temp[num];
          $thread.find(`.replyBox span.id[data-id="${id}"]`).parents('.replyBox').hide();
          $thread.find(`header[data-type="post"] span.id[data-id="${id}"]`).parents('.thread').hide();
          temp[num] = $thread;
        });
      } else if(key === 'hidden') {
        /* hide article */
        data[key].forEach(num => {
          const $articles = $(`.thread[data-number="${num}"], .replyBox[data-number=${num}]`).addClass('hiddenArticle');
          $articles.find('li[data-act="hide"]').text('顯示本文');
        });
      }
    }
  }
  bindUserPannel() {
    const self = this;
    const $switch = $('#userPannelSwitch');
    $switch.on('click', evt => {
      /* 點擊任意地點關閉 UserPannel */
      evt.stopPropagation();
      if($switch[0].checked)
        $(document).on('click', _evt => {
          if($switch[0].checked && findParent(evt.target, 'UserPannel') === null) {
            $(document).unbind('click');
            $switch.click();
          }
        });
    });
    /* Functions of userPannel */
    const $triggers = $('.userFuncContainer .userPannel li');
    $triggers.on('click', evt => {
      const func = evt.target.dataset.target;
      if(func === undefined)
        return;
      else if(func === 'hidden') {
        /* Hidden articles */
        self.setKeyVal('hidden', []);
        $('.hiddenArticle').removeClass('hiddenArticle');
      } else if(func.match(/ngid/) !== null) {
        let data = self.data;
        if(func === 'ngid_list') {
          /* 可視化 NGID LIST，並加上刪除鈕、刪除事件 */
          if(data.filter.length === 0 && data.filterLocal.length == 0) {
            infoBox({ header: 'NGID List', content: '今天島上一片和平沒有智障ㄛ(或者你還沒看到w)', className: 'success' });
            return;
          }
          const table = document.createElement('table');
          table.className = 'table table-bordered';
          table.innerHTML = `<thead>
            <tr>
              <th>NGID</th>
              <th>Thread</th>
              <th>Action</th>
            </tr>
          </thead>`;
          const tbody = document.createElement('tbody');
          const getFilterContent = (id, thread='*') => {
            return `<tr class="NGID">
              <td data-name="id" data-id="${id}">${id}</td>
              <td data-name="thread" data-number="${thread}">${thread}</td>
              <td>
                <button class="btn btn-default">刪除</button>
              </td>
            </tr>`;
          };
          data.filter.forEach(e => { tbody.innerHTML += getFilterContent(e.id); });
          data.filterLocal.forEach(e => { tbody.innerHTML += getFilterContent(e.id, e.thread); });
          table.appendChild(tbody);
          let reloadSwitch = false;
          const binding = $main => {
            /* 每個刪除鈕被按下後的事件，若有按鈕被按下 離開 infoBox 時將會重新載入網頁 */
            $main.find('table .btn').on('click', _evt => {
              _evt.stopPropagation();
              const parent = findParent(_evt.target, 'NGID');
              const id = parent.querySelector('td[data-name="id"]').dataset.id;
              const thread = parent.querySelector('td[data-name="thread"]').dataset.number;
              const _data = self.data;
              if(thread === '*') {
                /* Global filter */
                const filtered = _data.filter.filter(e => e.id !== id);
                self.setKeyVal('filter', filtered);
              } else {
                /* Local filter */
                const filtered = _data.filterLocal.filter(e => { return e.id !== id || e.thread !== thread; });
                self.setKeyVal('filterLocal', filtered);
              }
              parent.parentElement.removeChild(parent);
              reloadSwitch = true;
            });
          };
          const afterClose = () => reloadSwitch ? location.reload() : '';
          infoBox({ content: table.outerHTML, isHTML: true, header: 'NGID 一覽', className: 'info', binding, afterClose });
        } else if(func === 'ngid_export') {
          if(data.filter.length === 0 && data.filterLocal.length == 0) {
            infoBox({ header: 'NGID List', content: '你還沒有 NGID 別人，所以也沒什麼好輸出的ㄛ', className: 'success' });
            return;
          }
          const container = document.createElement('section');
          const pre = document.createElement('pre');
          pre.style.textAlign = 'left';
          const mapping = each => { delete each.time; return each; };
          const jsoncontent = JSON.stringify({ filter: data.filter.map(mapping), filterLocal: data.filterLocal.map(mapping) });
          pre.innerHTML = `<code class="language-javascript">${jsoncontent}</code>`;
          container.appendChild(pre);
          const binding = $main => {
            const code = $main.find('code')[0];
            hljs.highlightBlock(code);
          };
          infoBox({ header: 'NGID export', content: container.outerHTML, className: 'info', isHTML: true, binding });
        } else if(func === 'ngid_import') {
          /* NGID_LIST_IMPORT */
          const container = document.createElement('section');
          container.innerHTML = '<textarea id="NGID_import" placeholder="於此處輸入 NGID" style="padding: .5em; width: 100%; min-height: 150px; border: 1px solid #333;"></textarea>';
          let reloadSwitch = false;
          const button = {
            content: '引入 NGID',
            callback: () => {
              const jsonString = getID('NGID_import').value;
              if(jsonString === '')
                return;
              try {
                const { filter, filterLocal } = JSON.parse(jsonString);
                const _data = self.data;
                if(filter !== undefined && filter.length > 0) {
                  filter.forEach(_f => {
                    if(_data.filter.filter(existData => existData.id === _f.id).length === 0)
                      _data.filter.push(_f);
                  });
                }
                if(filterLocal !== undefined && filterLocal.length > 0) {
                  filterLocal.forEach(_f => {
                    if(_data.filterLocal.filter(existData => existData.id === _f.id).length === 0)
                      _data.filterLocal.push(_f);
                  });
                }
                self.setKeyVal('filter', _data.filter);
                self.setKeyVal('filterLocal', _data.filterLocal);
                reloadSwitch = true;
                $('#infoBox').click();
              } catch(e) {
                infoBox({ header: 'Failed', content: '引入 NGID 失敗，可能複製錯了？', className: 'error' });
              }
            }
          };
          const afterClose = () => reloadSwitch ? location.reload() : '';
          infoBox({ header: 'NGID import', content: container.outerHTML, className: 'info', isHTML: true, button, afterClose });
        }
      } else if(func === 'article_library') {
        /* TODO: article library configuration */
      }
    });
  }
  setKeyVal(key, val) {
    const data = this.data;
    if(key.match(/filter/) !== null && this.data.key.id !== undefined) {
      /* DO NOT filter yourself */
      val = val.filter(e => e.id !== this.data.key.id);
    }
    data[key] = val;
    this.data = data;
  }
  deleteKey(key) {
    const data = this.data;
    delete data[key];
    this.data = data;
  }
}



