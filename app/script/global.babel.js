'use strict';
const getID = id => document.getElementById(id);
const getQuery = (css, ele=document) => ele.querySelector(css);
const getQueries = (css, ele=document) => ele.querySelectorAll(css);
const getQueriesArray = css => Array.prototype.slice.apply(getQueries(css));
const escape = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const findParent = (element, pattern) => {
  while(element.parentElement !== null && element.className.match(pattern) === null)
    element = element.parentElement;
  return element.parentElement === null ? null : element;
};

const showImg = (imgContainer) => {
  /* This function is for onclick event on IMG tag.
   * 1. determine whether element is zoomed in by attribute: data-status
   * 2. check the file format, if is webm, create video element and insert to its parent */
  const e = imgContainer;
  const zoomed = e.dataset.status === 'yes';
  if(zoomed) {
    /* if image is zoomed */
    e.dataset.status = 'no';
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
    }
  }
};

$(() => {
  /* hover box */
  const hoverbox = new HoverBox();
  const updateQuote = () => {
    /* Scan every existing content and replace ">>\d{8}" with span.quote */
    $('p.content').each((_, p) => {
      if(p.innerText.match(/>>\d{8}\s*/) !== null) {
        const thread = findParent(p, /thread/);
        const match = p.innerText.match(/>>\d{8}\s*/g);
        match.forEach(_match => {
          /* Since split can't detect \n, slice the \n */
          _match = _match.slice(_match.length - 1).match(/\s/) === null ? _match :  _match.replace(/\s/g, '');
          const num = _match.slice(2);
          if(getQuery(`.quotable[data-num="${num}"]`, thread) !== null)
            p.innerHTML = p.innerHTML.split(escape(_match)).join(`<span class="quote" data-quoteType="num" data-num="${num}">${escape(_match)}</span>`);
          else
            p.innerHTML = p.innerHTML.split(escape(_match)).join(`<span class="quote missing" data-quoteType="num" data-num="${num}">${escape(_match)}</span>`);
          /* add number to quoted article */
          const quotedArticle = $(`*[data-number="${num}"]`).addClass('quotedArticle');
          quotedArticle.each((index, ele) => {
            const quotedList = getQuery('.quotedList', ele);
            const quoter = findParent(p, /replyBox/);
            const quotedNumElement = quotedList.querySelector('.quotedNum');
            const quotedCount = Number(quotedNumElement.innerText);
            quotedNumElement.innerText = quotedCount + 1;
            const span = $(document.createElement('span')).addClass('quoted').attr('data-num', quoter.dataset.number).text('>>' + quoter.dataset.number);
            quotedList.appendChild(span[0]);
            /* set quotedfrom attr for showing hoverBox */
            quotedList.dataset.quotedfrom = quotedList.dataset.quotedfrom === undefined ? quoter.dataset.number : quotedList.dataset.quotedfrom + `, ${quoter.dataset.number}`;
          });
        });
      }
      /* change the color of quote text */
      if(p.innerText.match(/(?:[^\S]|^)\>[^\s|\>]+/) !== null) {
        /* REGEX 說明:
         * (1) (?: $pattern1 | $pattern2) 代表 $pattern1 跟 $pattern2 其中一個成立即可
         * (2)[^$pattern] 代表 not $pattern */
        const match = p.innerText.match(/(?:[^\S]|^)\>[^\s|\>]+/g);
        match.forEach(_match => {
          _match = _match.replace(/\s/g, '');
          p.innerHTML = p.innerHTML.split(escape(_match)).join(`<span class="quoteText">${escape(_match)}</span>`)
        });
      }
      /* Replace ^http into a tag with regex. Notably, pug already escape most of the < or >
       * 之後有推播，前端 append 可能要注意這部份 */
      p.innerHTML = p.innerHTML.replace(/(http[s]*\:\/\/[^\s|\>|\<]+?)([\s|\<|\^|\@])/g, '<a class="link" href="$1">$1</a>$2');
    });
  };
  updateQuote();

  /* Bind .quote with hoverbox */
  const bindHoverBox = () => {
    $('.quote').each((index, element) => {
      hoverbox.bindQuoteHoverEvent(element);
    });
    $('.quotedArticle p.quotedList').each((index, element) => {
      hoverbox.bindQuotedListBox(element);
    });
  };
  bindHoverBox();
});

class HoverBox {
  constructor() {
    this.e = getID('hoverBox');
    this.showList = {};
  }
  bindQuoteHoverEvent(element, recursive=false) {
    const self = this;
    element.addEventListener('mouseleave', self.mouseLeaveHoverBox({ element, recursive }));
    element.addEventListener('mouseenter', self.mouseEnterHoverBox({ element, recursive }));
  }
  mouseLeaveHoverBox({ element, recursive }) {
    const mouseLeaveEvt = (self => {
      return evt => {
        evt.stopImmediatePropagation();
        const threadNum = findParent(evt.target, recursive ? /hoverBox/ : /thread/).dataset.number;
        if(self.showList[threadNum] !== undefined) {
          /* just to make sure that self.showList works well. */
          const onHover = () => self.e.querySelector(`.hoverBox:hover`) !== null;
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
      }
    })(this);
    return mouseLeaveEvt;
  }
  mouseEnterHoverBox({ element, recursive }) {
    /* 用閉包將 this 綁定至 self 變數中 */
    const mouseEnterEvt = (self => {
      return evt => {
        evt.stopImmediatePropagation();
        const coord = [evt.clientX, evt.clientY];
        const targetNum = evt.target.dataset.num;
        let parentElement = findParent(element, recursive ? /hoverBox/ : /thread/);
        let [threadElement, reference] = [parentElement, null];
        if(recursive) {
          /* 由於 recursive 關係，hoverBox 之 parentElement 會是 hoverBox, 要找到對應 thread 上的元素才能進行 quote */
          threadElement = $(`article[data-number="${parentElement.dataset.number}"]`);
          reference = threadElement[0].dataset.number === targetNum ? threadElement[0] : threadElement.find(`*[data-number="${targetNum}"]`)[0];
        } else
          reference = threadElement.dataset.number === targetNum ? threadElement : getQuery(`.replyBox[data-number="${targetNum}"]`, threadElement);
        // console.log({threadElement, reference, targetNum});

        if(reference !== null) {
          /* If reference exists in current thread and there's no existing hoverBox about same reference, show hoverBox */
          const clone = $(reference).addClass('quoted').clone(true).find('.replyBox').remove().end()[0];
          self.createHoverBox({
            content: clone.outerHTML,
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
    /* Input is p.quotedList  */
    const self = this;
    const $quotedElement = $(element).find('.quoted');
    $quotedElement.each((index, e) => {
      e.addEventListener('mouseenter', self.mouseEnterHoverBox({ element: e, recursive }));
      e.addEventListener('mouseleave', self.mouseLeaveHoverBox({ element: e, recursive }));
    });
  }
  createHoverBox({ content, targetNum, coord, threadNum, parentElement=null }) {
    const self = this;
    /* Check if hoverBox to this target is already exist */
    let appendElement = self.e;
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
    if(self.showList[threadNum] !== undefined) {
      lastChild = self.showList[threadNum].lastChild;
      lastChild.child = new ElementTree(hoverBox, lastChild, null);
    } else
      self.showList[threadNum] = new ElementTree(hoverBox, null, null);
    lastChild.element.appendChild(hoverBox);

    /* computes offset XY after showing element */
    const showX = coord[0] + hoverBox.offsetWidth < window.innerWidth ? coord[0] : coord[0] - hoverBox.offsetWidth;
    hoverBox.style.left = showX > 0 ? showX + 'px' : 0;
    /* 必須先移動 X 來避免由於 X overflow 的 line break 改變 offsetHeight */
    const showY = coord[1] + hoverBox.offsetHeight < window.innerHeight ? coord[1] : coord[1] - hoverBox.offsetHeight;
    hoverBox.style.top = showY > 0 ? showY + 'px' : 0;

    /* recursively bind */
    $(hoverBox).find('.quote').each((index, element) => self.bindQuoteHoverEvent(element, true)).end()
      .find('p.quotedList').each((index, element) => self.bindQuotedListBox(element, true));
  }
  mergeContent(...contents) {
    return `<section class="contentSection">${contents.join('')}</section>`;
  }
}
class ElementTree {
  constructor(element, parent, child) {
    this.element = element;
    this.parent = parent;
    this.child = child;
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
      return true
    } else return false;
  }
  removeChild() {
    if(this.child !== null) {
      this.element.removeChild(this.child.element);
      this.child = null;
    } else return false
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

