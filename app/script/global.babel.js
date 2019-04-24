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
  /* 1. determine whether element is zoomed in by attribute: data-status
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
        });
      }
      /* change the color of quote text */
      if(p.innerText.match(/(?:[^\S]|^)\>[^\s|\>]+/) !== null) {
        /* REGEX 講解: 
         * (1) (?: $pattern1 | $pattern2) 代表 $pattern1 跟 $pattern2 其中一個成立即可
         * (2)[^$pattern] 代表 not $pattern */
        const match = p.innerText.match(/(?:[^\S]|^)\>[^\s|\>]+/g);
        match.forEach(_match => {
          _match = _match.replace(/\s/g, '');
          p.innerHTML = p.innerHTML.split(escape(_match)).join(`<span class="quoteText">${escape(_match)}</span>`)
        });
      }
    });
  };
  updateQuote();

  /* Bind .quote with hoverbox */
  const bindHoverBox = () => {
    $('.quote').each((index, element) => {
      hoverbox.bindQuoteHoverEvent(element);
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
    element.addEventListener('mouseleave', evt => {
      evt.stopImmediatePropagation();
      const threadNum = findParent(evt.target, recursive ? /hoverBox/ : /thread/).dataset.number;
      if(self.showList[threadNum] !== undefined) {
        const onHover = () => self.e.querySelector(`.hoverBox:hover`) !== null;
        if(!onHover()) {
          self.e.removeChild(self.showList[threadNum].element);
          delete self.showList[threadNum];
        } else {
          let lastChild = self.showList[threadNum];
          while(lastChild.child !== null)
            lastChild = lastChild.child;
          lastChild.element.addEventListener('mouseleave', _evt => {
            _evt.stopImmediatePropagation();
            if(!onHover()) {
              // self.e.removeChild(self.showList[threadNum].element);
              // delete self.showList[threadNum];
            } else {
              const element = getQuery('.hoverBox:hover');
              let target_level = self.showList[threadNum];
              while(target_level.child !== null && target_level.element !== element)
                target_level = target_level.child;
              target_level.parent.element.removeChild(target_level.element);
              target_level.parent.child = null;
            }
          });
        }
      }
    });
    element.addEventListener('mouseenter', evt => {
      evt.stopImmediatePropagation();
      const coord = [evt.clientX, evt.clientY];
      const targetNum = evt.target.dataset.num;
      let parentElement = findParent(element, recursive ? /hoverBox/ : /thread/);
      let [threadElement, reference] = [parentElement, null];
      if(recursive) {
        threadElement = $(`article[data-number="${parentElement.dataset.number}"]`);
        reference = threadElement[0].dataset.number === targetNum ? threadElement[0] : threadElement.find(`*[data-number="${targetNum}"]`)[0];
      } else
        reference = threadElement.dataset.number === targetNum ? threadElement : getQuery(`.replyBox[data-number="${targetNum}"]`, threadElement);
      if(reference !== null && getQuery(`.hoverBox[data-origin="${targetNum}"]`) === null) {
        const clone = $(reference).clone(true).find('.replyBox').remove().end()[0];
        self.createHoverBox({
          content: clone.outerHTML,
          targetNum,
          coord,
          threadNum: recursive ? threadElement[0].dataset.number : threadElement.dataset.number,
          parentElement: recursive ? parentElement : null
        });
      } else
        console.log(reference === null ? 'Reference element not found.' : getQuery(`.hoverBox[data-origin="${targetNum}"]`))
    });
  }
  createHoverBox({ content, targetNum, coord, threadNum, parentElement=null }) {
    const self = this;
    /* Check if hoverBox to this target is already exist */
    let appendElement = self.e;
    if(parentElement !== null) {
      let p = self.showList[threadNum];
      if(p.child !== null) {
        while(p.element !== parentElement && p.child !== null)
          p = p.child;
        p.element.removeChild(p.child.element);
        p.child = null;
      }
    }
    const hoverBox = document.createElement('div');
    hoverBox.className = 'hoverBox';
    hoverBox.innerHTML = self.mergeContent(content);
    hoverBox.dataset.number = threadNum;
    hoverBox.dataset.origin = targetNum;

    let lastChild = { element: self.e };
    if(self.showList[threadNum] !== undefined) {
      lastChild = self.showList[threadNum];
      while(lastChild.child !== null)
        lastChild = lastChild.child;
      lastChild.child = { element: hoverBox, parent: lastChild, child: null };
    } else
      self.showList[threadNum] = { element: hoverBox, parent: null, child: null };
    lastChild.element.appendChild(hoverBox);

    /* computes offset XY after showing element */
    const showX = coord[0] + hoverBox.offsetWidth < window.innerWidth ? coord[0] : window.innerWidth - hoverBox.offsetWidth;
    const showY = coord[1] + hoverBox.offsetHeight < window.innerHeight ? coord[1] : window.innerHeight - hoverBox.offsetHeight;
    hoverBox.style.left = showX > 0 ? showX + 'px' : 0;
    hoverBox.style.top = showY > 0 ? showY + 'px' : 0;


    $(hoverBox).find('.quote').each((index, element) => {
      self.bindQuoteHoverEvent(element, true);
    });
  }
  mergeContent(...contents) {
    return `<section class="contentSection">${contents.join('')}</section>`;
  }
}


