/* global $, hljs, ControlPannel, UserStorage, Article */
const getID = id => document.getElementById(id);
const getQuery = (css, ele=document) => ele.querySelector(css);
const getQueries = (css, ele=document) => ele.querySelectorAll(css);
const getQueriesArray = (css, ele=document) => Array.prototype.slice.apply(getQueries(css, ele));
const escape = s => s === null ? '' : s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&quot;').replace(/'/g, '&#039;');
const findParent = (element, pattern) => {
  while(element.parentElement !== null && element.className.match(pattern) === null)
    element = element.parentElement;
  return element.parentElement === null ? null : element;
};
const isMobile = window.innerWidth < 500;
const globalFunction = {};

/**
 * This function determine eitch to view the full image or the thumb of image
 * via the "data-status" attribute of imgContainer.
 * @param {HTMLElement} imgContainer Container of <img> tag
 */
const showImg = (imgContainer) => {
  /* 1. determine whether element is zoomed in by element attribute: data-status
   * 2. check the file format, if is webm, create video element and insert to its parent */
  const e = imgContainer;
  const zoomed = e.dataset.status === 'yes';
  if(zoomed) {
    e.dataset.status = 'no';
    /* e.children[0] refers to <img> */
    e.children[0].setAttribute('src', e.dataset.thumb);
    e.className = e.className.replace(/\s*zoomed\s*/g, '').replace(/\s*video\s*/g, '');
    if(e.children[e.children.length - 1].tagName === 'VIDEO')
      e.removeChild(e.children[e.children.length - 1]);
  } else {
    e.dataset.status = 'yes';
    e.children[0].setAttribute('src', e.dataset.ori);
    e.className += ' zoomed';
    if(e.dataset.ori.match(/webm/) !== null) {
      const video = document.createElement('video');
      video.setAttribute('src', e.dataset.ori);
      video.loop = true;
      video.autoplay = true;
      video.controls = true;
      e.appendChild(video);
      e.className += ' video';
      const scrollEvent = () => {
        /* Stop video playing after element is not visible on screen */
        const position = e.getBoundingClientRect();
        if(position.top > window.innerHeight || position.bottom < -1 * e.children[0].offsetHeight) {
          video.pause();
          window.removeEventListener('scroll', scrollEvent);
        }
      };
      window.addEventListener('scroll', scrollEvent);
    }
  }
};

/**
 * Creates a full-page pop-up window with customized content and button
 * @param {object} options Options of displaying InfoBox
 * @param {string} options.header Text to shown on the header of InfoBox
 * @param {string} options.content Text to shown on the center of InfoBox
 * @param {string} options.className Classname of header to determine the color, including [warning,info,error]
 * @param {boolean} options.isHTML To determine either using jQuery.html or jQuery.text as insertion method
 * @param {callback} options.binding Function to call after infoBox is shown
 * @param {object} options.button Options of button
 * @param {callback} options.button.callback Function to call after button is pressed
 * @param {string} options.button.content Text to shown on button
 * @param {string} options.button.btnClassName Classname of button
 */
const infoBox = options => {
  /* 佔滿整頁的提示訊息，可以定義是否有按鈕及按鈕行為 */
  const { header, className, content, button, isHTML, binding, afterClose=()=>{} } = options;
  const $infoBox = $('#infoBox').removeClass('hidden');
  const $btnContainer = $infoBox.find('.btnContainer');
  const btnContainerHTML = $btnContainer[0].outerHTML; 
  const $main = $infoBox.find('main');
  const infoBoxReset = () => $main.html('<p></p>' + btnContainerHTML);
  $infoBox.on('click', evt => {
    if(findParent(evt.target, 'mainContent') === null) {
      $infoBox.addClass('hidden');
      if(isHTML)
        infoBoxReset();
      afterClose();
    }
  });
  infoBoxReset();

  const $header = $infoBox.find('header h2').text(header).end();
  $header[0].className = className || '';
  if(isHTML) {
    if(button === undefined)
      $main.html(content);
    else
      $main.find('p').text('').end().prepend(content);
    if(binding)
      binding($main);
  } else
    $infoBox.find('main p').text(content);

  if(button !== undefined) {
    const $button = $main.find('.btnContainer button');
    const { content: btnContent, className: btnClassName, callback } = button;
    $button.text(btnContent);
    $button[0].className = 'btn';
    $button.addClass(btnClassName || 'btn-default');
    if(callback === undefined) {
      $button.on('click', () => $infoBox.click());
    } else
      $button.on('click', callback);
  } else if(!isHTML)
    $main.find('button').addClass('hidden');
};

$(() => {
  /* 註解大部份都是解釋註解正下方的程式段落或者整個 function 的運作邏輯 */
  const user = new UserStorage();
  user.applySetting();
  user.bindUserPannel();
  /* 控制面板相關 */
  const controlPannel = new ControlPannel(null, user);

  const hoverbox = new HoverBox();
  const updateQuote = (element=document) => {
    /* element 於畫面載入時是 document, 會 global 的進行 event binding，
     * 而在前端 ajax 呼叫時由於需要再度 render, element 會改成該筆新增的元素之相應目標 */
    if(element !== document) {
      /* 重置該串的 binding, 這樣才不會產生重複的 reference. */
      $(element).find('.quotedList').each((_, qL) => {
        while(qL.children.length > 1) {
          qL.removeChild(qL.children[1]);
        }
        qL.querySelector('.quotedNum').innerText = 0;
        qL.dataset.quotedfrom = '';
      }).end().find('span.id').addClass('quotable');
    }
    $(element).find('p.content').each((_, p) => {
      const article = new Article(p);
      article.render();
    });
  };
  updateQuote();
  globalFunction.updateQuote = updateQuote;

  /* 引用類相關的 hoverBox: 包括引用別人、被引用、被引用之列表 */
  const bindHoverBox = (element=document) => {
    $(element).find('.quote').not('.missing').each((index, element) => {
      hoverbox.bindQuoteHoverEvent(element);
    });
    const prefix = element === document ? '.quotedArticle' : '';
    $(element).find(`${prefix} .mainContent p.quotedList, .replyBox.quotedArticle p.quotedList`).each((index, element) => {
      hoverbox.bindQuotedListBox(element);
    });
  };
  bindHoverBox();
  globalFunction.bindHoverBox = bindHoverBox;

  /* 偵測串內的ID */
  const bindIdReference = (element=document) => {
    let $element = '';
    $element = element !== document ? $(element) : $(element).find('.thread');
    $element.each((index, thread) => {
      const table = {};
      const IDs = getQueriesArray('span.id', thread);
      IDs.forEach(idElement => {
        /* count id in thread */
        const id = idElement.dataset.id;
        if(table[id] === undefined)
          table[id] = { num: 1, cnt: 1 };
        else
          table[id].num ++;
      });
      IDs.forEach(idElement => {
        const id = idElement.dataset.id;
        if(table[id].num === 1) {
          /* Remove highlight while the ID only shown once */
          idElement.className = idElement.className.replace(/\s*quotable\s*/g, '');
        } else if(table[id].num >= 2) {
          if(table[id].num >= 3){
            const idNum = Math.floor(table[id].num / 3) * 3;
            idElement.className += ` id_${idNum > 15 ? 15 : idNum}`;
          }
          idElement.innerText = idElement.innerText.replace(/\(.*?\)/g, '') + `(${table[id].cnt}/${table[id].num})`;
          table[id].cnt ++;
        }
      });
      /* bind quotable IDs */
      hoverbox.bindIdReference(thread);
    });
  };
  bindIdReference();
  globalFunction.bindIdReference = bindIdReference;
});

class HoverBox {
  constructor() {
    this.e = getID('hoverBox');
    this.showList = {};
    this.activeEvt = isMobile ? 'click' : 'mouseenter';
    this.inactiveEvt = isMobile ? 'click' : 'mouseleave';
  }
  bindQuoteHoverEvent(element, recursive=false) {
    const self = this;
    element.addEventListener(self.activeEvt, self.mouseEnterHoverBox({ element, recursive }));
    element.addEventListener(self.inactiveEvt, self.mouseLeaveHoverBox({ element, recursive }));
  }
  bindIdReference(element, recursive=false) {
    /* element: thread element or hoverBox element, depends on recursive
     *  運作：由於 recursive 時 element 為 hoverBox, 此時需先找到 thread, 透過 thread 再找到該 id 發言的內容.
     * idElements: 要綁入事件的span.id, 因此時接對 element 變數查找 */
    const self = this;
    const idElements = getQueriesArray('span.id.quotable', element);
    const thread = recursive ? getQuery(`.articleContainer > article[data-number="${element.dataset.number}"]`) : element;
    if(idElements.length > 0) {
      const mainCss = 'header[data-type="post"]';
      const replyCss = '.replyBox header[data-type="reply"]';
      idElements.forEach(idElement => {
        const id = idElement.dataset.id;
        const $articles = $(thread).find(`${mainCss} span.id.quotable[data-id="${id}"], ${replyCss} span.id.quotable[data-id="${id}"]`);
        const $idEle = $(idElement).unbind();
        $idEle.on(self.activeEvt, self.mouseEnterHoverBox({ element: idElement, recursive, articles: $articles }));
        $idEle.on(self.inactiveEvt, self.mouseLeaveHoverBox({ element: idElement, recursive }));
      });
    }
  }
  mouseLeaveHoverBox({ element, recursive }) {
    const mouseLeaveEvt = (self => {
      return evt => {
        evt.stopImmediatePropagation();
        const threadNum = findParent(evt.target, recursive ? /hoverBox/ : /thread/).dataset.number;
        if(self.showList[threadNum] !== undefined) {
          /* just to make sure that self.showList works well. */
          const onHover = () => self.e.querySelector('.hoverBox:hover') !== null;
          if(!onHover()) {
            /* 滑鼠沒有在任何 hoverBox 上，移除所有 hoverBox */
            self.e.removeChild(self.showList[threadNum].element);
            delete self.showList[threadNum];
          } else {
            if(recursive) {
              /* 若為 hoverBox 中觸發的事件，檢查滑鼠是否位於觸發層級的子層級上，若否則刪除子層級 */
              const element = findParent(evt.target, /hoverBox/);
              const elementTree = self.showList[threadNum].findChild(element);
              if(elementTree !== null) {
                if(elementTree.child === null || !elementTree.child.element.matches(':hover'))
                  self.showList[threadNum].removeChildFromElement(element);
              }
            }
            /* 由於滑鼠離開 span 卻沒有刪除 hoverBox，加入偵測滑鼠離開 hoverBox 的事件來判斷是否進行 hoverBox 的刪除 */
            const lastChild = self.showList[threadNum].lastChild;
            lastChild.element.addEventListener('mouseleave', _evt => {
              _evt.stopImmediatePropagation();
              if(self.showList[threadNum] === undefined)
                return false;
              if(!onHover()) {
                self.e.removeChild(self.showList[threadNum].element);
                delete self.showList[threadNum];
              } else {
                /* 將觸發離開 hoverBox 事件之 hoverBox 刪除 */
                const target = self.showList[threadNum].findChild(_evt.target);
                if(target !== null)
                  target.removeNode();
              }
            });
          }
        }
      };
    })(this);
    if(!isMobile)
      return mouseLeaveEvt;
    else
      return () => { };
  }
  mouseEnterHoverBox({ element, recursive, articles=null }) {
    /* element: 事件觸發者(span元素), 
     * recursive: 觸發者是否為 hoverBox 內的 span, 
     * articles: search by ID or replies, which may have multiple contents */
    const mouseEnterEvt = (self => {
      /* 用閉包將 this 綁定至 self 變數中 */
      return evt => {
        evt.stopImmediatePropagation();
        evt.preventDefault();
        const coord = [evt.clientX, evt.clientY];
        const targetNum = evt.target.dataset.num;
        let parentElement = null;
        let [threadElement, reference] = [null, null];
        if(articles === null) {
          /* 僅有單個元素會出現在 hoverBox 中，搜尋該串後複製、顯示 */
          parentElement = findParent(element, recursive ? /hoverBox/ : /thread/);
          threadElement = parentElement;
          if(recursive) {
            /* 由於 recursive 關係，hoverBox 之 parentElement 會是 hoverBox,
             * 要找到對應 thread 上的元素才能進行 quote */
            threadElement = $(`article[data-number="${parentElement.dataset.number}"]`);
            reference = threadElement[0].dataset.number === targetNum ? threadElement[0] : threadElement.find(`*[data-number="${targetNum}"]`)[0];
          } else
            reference = threadElement.dataset.number === targetNum ? threadElement : getQuery(`.replyBox[data-number="${targetNum}"]`, threadElement);
        } else {
          /* hoverBox 會顯示多個文章，文章都在 articles 中存為 jQuery 的格式 */
          reference = articles;
          parentElement = findParent(articles[0], /thread/);
          threadElement = recursive ? $(`.articleContainer > article[data-number="${parentElement.dataset.number}"]`) : parentElement;
        }

        if(reference !== null) {
          /* If reference exists in current thread, show hoverBox */
          //const clone = $(reference).addClass('quoted').clone(true).find('.replyBox').remove().end()[0];
          let content = '';
          if(articles === null)
            content = $(reference).clone(true).find('.replyBox').remove().end()[0];
          else {
            reference.each((_, e) => {
              /* e is span.id.quoted */
              const isMain = e.parentElement.dataset.type === 'post';
              let parent = isMain ? findParent(e, /thread/) : findParent(e, /replyBox/);
              parent = isMain ? $(parent).clone(true).removeClass('col-xs-12').find('.replyBox').remove().end()[0] : parent;
              content += parent.outerHTML;
            });
            content = { outerHTML: content };
          }
          self.createHoverBox({
            content: content.outerHTML,
            targetNum,
            coord,
            threadNum: recursive ? threadElement[0].dataset.number : threadElement.dataset.number,
            parentElement: recursive ? parentElement : null
          });
        } else
          console.log('Reference element not found.');
      };
    })(this);
    return mouseEnterEvt;
  }
  bindQuotedListBox(element, recursive=false) {
    /* element: p.quotedList */
    const self = this;
    const $quotedElement = $(element).find('.quoted');
    $quotedElement.each((index, e) => {
      /* 綁定個別的 quoted */
      e.addEventListener(self.activeEvt, self.mouseEnterHoverBox({ element: e, recursive }));
      e.addEventListener(self.inactiveEvt, self.mouseLeaveHoverBox({ element: e, recursive }));
    });

    /* 綁定 replies, 一樣透過 recursive 判斷是否要回到 .container 找到 thread */
    if(element.dataset.quotedfrom !== undefined) {
      const quotedFrom = element.dataset.quotedfrom.split(', ');
      const thread = recursive ? findParent(element, /hoverBox/) : findParent(element, /thread/);
      const $thread = recursive ? $(`.container article[data-number="${thread.dataset.number}"]`) : $(thread);
      const queryString = quotedFrom.map(number => `span.num[data-num="${number}"]`).join(', ');
      /* 這邊直接用 jQuery 跟 queryString 結合來一次選所有文章 */
      const $articles = $thread.find(queryString);
      const mouseEnterEvt = self.mouseEnterHoverBox({ element, recursive, articles: $articles });
      const mouseLeaveEvt = self.mouseLeaveHoverBox({ element, recursive });
      const $triggerElement = $(element.children[0]);
      $triggerElement.unbind();
      $triggerElement.on(self.activeEvt, mouseEnterEvt);
      $triggerElement.on(self.inactiveEvt, mouseLeaveEvt);
    }
  }
  createHoverBox({ content, targetNum, coord, threadNum, parentElement=null }) {
    const self = this;
    if(parentElement !== null) {
      /* 若存在相同層級的 hoverBox, 刪除之(倒裝三小w) */
      const p = self.showList[threadNum].findChild(parentElement);
      if(p !== null)
        p.removeChild();
    }
    const hoverBox = document.createElement('div');
    hoverBox.className = 'hoverBox';
    hoverBox.innerHTML = self.mergeContent(content);
    hoverBox.dataset.number = threadNum;
    hoverBox.dataset.origin = targetNum;

    let lastChild = { element: self.e };
    let zindex = 1;
    if(self.showList[threadNum] !== undefined) {
      lastChild = self.showList[threadNum].lastChild;
      zindex = lastChild.zindex + 1;
      lastChild.child = new ElementTree(hoverBox, lastChild, null, zindex);
    } else
      self.showList[threadNum] = new ElementTree(hoverBox, null, null);
    hoverBox.style.zIndex = zindex;
    lastChild.element.appendChild(hoverBox);

    /* computes offset XY after showing element */
    const showX = coord[0] + hoverBox.offsetWidth < window.innerWidth ? coord[0] : coord[0] - hoverBox.offsetWidth;
    hoverBox.style.left = showX > 0 ? showX + 'px' : 0;
    /* 必須先移動 X 來避免由於 X overflow 的 line break 改變 offsetHeight */
    const showY = isMobile ? 25 : coord[1] + hoverBox.offsetHeight < window.innerHeight ? coord[1] : coord[1] - hoverBox.offsetHeight;
    hoverBox.style.top = showY > 0 ? showY + 'px' : 0;

    /* recursively bind */
    const $hoverBox = $(hoverBox).find('.quote').not('.missing').each((index, element) => self.bindQuoteHoverEvent(element, true)).end().end();
    $hoverBox.find('.replyBox.quotedArticle p.quotedList, .mainContent p.quotedList').each((index, element) => self.bindQuotedListBox(element, true));
    if(isMobile) {
      /* 手機版直接將所有 popup 刪除 */
      $hoverBox[0].style.maxHeight = '75%';
      getID('hoverBox').style.zIndex = 3;
      $('#mask').removeClass('hidden').one('click', _evt => {
        self.e.innerHTML = '';
        for(let key in self.showList)
          delete self.showList[key];
        getID('hoverBox').style.zIndex = '';
        _evt.target.className += ' hidden';
      });
      $hoverBox.find('.quoted, .quote').one('click', () => getID('mask').click());
    }

    /* If hoverBox is referenced from id, do not bind id */
    if(content.match(/id quotable/g) === null || content.match(/id quotable/g).length <= 1) {
      self.bindIdReference(hoverBox, true);
    }
    $hoverBox.mCustomScrollbar({ scrollInertia: 0 });
  }
  mergeContent(...contents) {
    return `<section class="contentSection">${contents.join('')}</section>`;
  }
}
class ElementTree {
  constructor(element, parent, child, zindex=1) {
    this.element = element;
    this.parent = parent;
    this.child = child;
    this.zindex = zindex;
  }
  get lastChild() {
    let tree = this;
    while(tree.child !== null)
      tree = tree.child;
    return tree;
  }
  removeNode() {
    if(this.parent !== null && this.parent.element !== undefined) {
      this.parent.element.removeChild(this.element);
      this.parent.child = null;
      return true;
    } else return false;
  }
  removeChild() {
    if(this.child !== null) {
      this.element.removeChild(this.child.element);
      this.child = null;
    } else return false;
  }
  removeChildFromElement(element) {
    const child = this.findChild(element);
    if(child !== null) {
      child.child.removeNode();
      return true;
    } else return false;
  }
  findParent(targetElement) {
    let tree = this;
    while(tree.parent !== null && targetElement !== tree.element)
      tree = tree.parent;
    return tree.element !== targetElement ? null : tree;
  }
  findChild(targetElement) {
    let tree = this;
    while(tree.child !== null && targetElement !== tree.element)
      tree = tree.child;
    return tree.element !== targetElement ? null : tree;
  }
}



