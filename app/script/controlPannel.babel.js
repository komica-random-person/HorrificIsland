/* global $, infoBox, getID, getQuery, findParent, escape, getQueriesArray, getQueries, isMobile, globalFunction */
class ControlPannel {
  constructor(element=null, user=null) {
    this.element = element === null ? document : element;
    this.bindPannelSwitch();
    this.bindControFunction();
    this.user = user === null ? new UserStorage() : user;
  }

  bindPannelSwitch() {
    $(this.element).find('input.pannelSwitch').on('click', e => {
      e.stopPropagation();
      const target = e.target;
      const contropannel = findParent(target, 'articleControlPannel');
      const element = contropannel.querySelector('.control');
      element.style.display = target.checked ? 'table' : 'none';
      if(target.checked)
        $(document).on('click', _e => {
          /* 模仿 8ch 行為，點其他地方關閉 control pannel */
          if(findParent(_e.target, 'articleControlPannel') === null) {
            target.click();
            $(document).unbind('click');
          }
        });
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

  findMainElement(element) {
    /* element here will be li.btn.btn-default, find the parent (either thread or replyBox) and return */
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
      article: {}
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
      article: {}
    };
    this.storage.setItem(this.name, JSON.stringify(userData));
  }
  applySetting() {
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
          $(`.thread[data-number="${num}"], .replyBox[data-number=${num}]`).addClass('hiddenArticle');
        })
      }
    }
  }
  setKeyVal(key, val) {
    const data = this.data;
    data[key] = val;
    this.data = data;
  }
  deleteKey(key) {
    const data = this.data;
    delete data[key];
    this.data = data;
  }
}



