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

});

class HoverBox {
  constructor() {
    this.e = getID('hoverBox');
  }
  getReplyBox(info) {
    return `<section class="replyBox clearfix">
  <header>
    <span class="name">${info.name}</span>
    <span class="date">${info.date}</span>
    <span class="time">${info.time}</span>
    <span class="id" data-id="${info.id}">ID:${info.id}</span>
    <span class="num" data-num="${info.num}">
      <a class="link">No.${info.num}</a>
    </span>
    <span class="del"><a class="link">刪除</a></span>
    <span class="res"><a class="link">回覆</a></span>
  </header>
  <p class="content">${info.content}</p>
</section>`;
  }
}


