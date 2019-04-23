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
  const e = imgContainer;
  const zoomed = e.dataset.status === 'yes';
  if(zoomed) {
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
  const updateRefNum = () => {
    /* Scan every existing content and replace ">>\d{8}" with span.quote */
    $('p.content').each((_, p) => {
      if(p.innerText.match(/>>\d{8}\s*/) !== null) {
        const thread = findParent(p, /thread/); // p.parentElement.parentElement;
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
    });
  };
  updateRefNum();

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
  bindQuoteHoverEvent(element) {
    const self = this;
    element.addEventListener('mouseleave', evt => {
      evt.stopImmediatePropagation();
      const targetNum = evt.target.dataset.num;
      if(self.showList[targetNum] !== undefined) {
        const onHover = this.e.querySelector(`.hoverBox[data-num="${targetNum}"]:hover`) !== null;
        if(!onHover){
          self.e.removeChild(self.showList[targetNum]);
        } else {
          self.showList[targetNum].addEventListener('mouseleave', _evt => {
            self.e.removeChild(_evt.target);
          });
        }
        delete self.showList[targetNum];
      }
    });
    element.addEventListener('mouseenter', evt => {
      evt.stopImmediatePropagation();
      const coord = [evt.clientX, evt.clientY];
      const parent = findParent(element, /thread/);
      const targetNum = evt.target.dataset.num;
      const reference = parent.dataset.number === targetNum ? parent : getQuery(`.replyBox[data-number="${targetNum}"]`, parent);
      if(reference !== null) {
        const clone = $(reference).clone(true).find('.replyBox').remove().end()[0];
        const hoverBox = document.createElement('div');
        hoverBox.className = 'hoverBox';
        hoverBox.innerHTML = self.mergeContent(clone.outerHTML);
        hoverBox.dataset.num = targetNum;
        self.e.appendChild(hoverBox);
        /* computes offset XY after showing element */
        const showX = coord[0] + hoverBox.offsetWidth < window.innerWidth ? coord[0] : window.innerWidth - hoverBox.offsetWidth;
        const showY = coord[1] + hoverBox.offsetHeight < window.innerHeight ? coord[1] : window.innerHeight - hoverBox.offsetHeight;
        hoverBox.style.left = showX + 'px';
        hoverBox.style.top = showY + 'px';
        self.showList[element.dataset.num] = hoverBox;
      }
    });
  }
  mergeContent(...contents) {
    return `<section class="contentSection">${contents.join('')}</section>`;
  }
}


