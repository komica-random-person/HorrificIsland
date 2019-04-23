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

$(() => {
  /* hover box */
  const hoverbox = new HoverBox();
  const updateRefNum = () => {
    /* Scan every existing content and replace ">>\d{8}" with span.quote */
    $('p.content').each((_, p) => {
      if(p.innerText.match(/>>\d{8}\s*/) !== null) {
        const thread = p.parentElement.parentElement;
        const match = p.innerText.match(/>>\d{8}\s/g);
        match.forEach(_match => {
          /* Since split can't detect \n, slice the \n */
          _match = _match.slice(0, _match.length - 1);
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
      /* damn */
      if(self.showList[evt.target.dataset.num] === true)
        self.e.innerHTML = '';
    });
    element.addEventListener('mouseenter', evt => {
       const parent = findParent(element, /thread/);
       const targetNum = evt.target.dataset.num;
       const reference = parent.dataset.number === targetNum ? parent : getQuery(`.replyBox[data-number="${targetNum}"]`, parent);
       if(reference !== null) {
         const isP = reference.tagName === 'ARTICLE';
         const clone = $(reference).clone(true).find('.replyBox').remove().end()[0];
         console.log(clone)
         self.e.innerHTML = self.mergeContent(clone.outerHTML);
         /* 應該要修改成動態產生，這樣之後才能 recursive */
         self.showList[element.dataset.num] = true;
       }
    });
  mergeContent(...contents) {
    return `<section class="contentSection">${contents.join('')}</section>`;
  }
}


