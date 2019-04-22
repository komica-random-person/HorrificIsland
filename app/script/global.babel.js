'use strict';
const getID = id => document.getElementById(id);
const getQuery = css => document.querySelector(css);
const getQueries = css => document.querySelectorAll(css);
const getQueriesArray = css => Array.prototype.slice.apply(getQueries(css));
const escape = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

$(() => {
  /* hover box */
  const hoverbox = new HoverBox();
  const updateRefNum = () => {
    $('p.content').each((_, p) => {
      if(p.innerText.match(/>>\d{8}\s/) !== null){
        const match = p.innerText.match(/(>>\d{8})\s/)[1];
        p.innerHTML = p.innerHTML.split(escape(match)).join(`<span class="quote" data-quoteType="num" data-num="${match.slice(2)}">${escape(match)}</span>`);
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


