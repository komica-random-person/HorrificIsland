'use strict';
const getID = id => document.getElementById(id);
const getQuery = (css, ele=document) => ele.querySelector(css);
const getQueries = (css, ele=document) => ele.querySelectorAll(css);
const getQueriesArray = css => Array.prototype.slice.apply(getQueries(css));
const escape = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

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
      let parent = element;
      while(parent.className.match(/thread/) === null)
        parent = parent.parentNode;
      const targetNum = evt.target.dataset.num;
      const reference = parent.dataset.number === targetNum ? parent : getQuery(`.replyBox[data-number="${targetNum}"]`, parent);
      if(reference !== null) {
        const isP = reference.tagName === 'ARTICLE';
        const hEle = reference.querySelector(isP ? 'header[data-type="main"]' : 'header[data-type="reply"]');
        const imgHeadElement = reference.querySelector(isP ? 'header.imgInfo' : 'section.imgInfo');
        const imgElement = imgHeadElement === null ? null : isP ? imgHeadElement.nextSibling.children[0] : imgHeadElement.nextSibling;
        const info = {
          name: hEle.children[0 + (isP ? 1 : 0)].innerText,
          date: hEle.children[1 + (isP ? 1 : 0)].innerText,
          time: hEle.children[2 + (isP ? 1 : 0)].innerText,
          id:   hEle.children[3 + (isP ? 1 : 0)].innerText,
          num:  hEle.children[4 + (isP ? 1 : 0)].innerText,
          img: imgHeadElement === null ? null : {
            name: imgHeadElement.querySelector('a').innerText,
            ori: imgElement.getAttribute('href'),
            thumb: imgElement.children[0].getAttribute('src')
          },
          content: reference.querySelector('p.content').innerHTML
        };
        const content = self.getReplyBox(info);
        self.e.innerHTML = self.mergeContent(content);
        /* 應該要修改成動態產生，這樣之後才能 recursive */
        self.showList[element.dataset.num] = true;
      }
    });
  }
  getReplyBox(info) {
    const getImgBox = (img) => {
      return `<section class="col-xs-12 imgInfo">
            <h4 class="info">檔名: <a href="${img.ori}" target="_blank">${img.name}</a></h4>
          </section>
          <a class="imgContainer"><img src="${img.thumb}"></a>`;
    };
    return `<section class="replyBox clearfix">
      <header>
        <span class="name">${info.name}</span>
        <span class="date">${info.date}</span>
        <span class="time">${info.time}</span>
        <span class="id" data-id="${info.id}">ID:${info.id}</span>
        <span class="num" data-num="${info.num}">
          <a class="link">No.${info.num}</a>
        </span>
        ${info.img === null ? '' : getImgBox(info.img)}
        <span class="del"><a class="link">刪除</a></span>
        <span class="res"><a class="link">回覆</a></span>
      </header>
      <p class="content">${info.content}</p>
    </section>`;
  }
  mergeContent(...contents) {
    return `<section class="contentSection">${contents.join('')}</section>`;
  }
}


