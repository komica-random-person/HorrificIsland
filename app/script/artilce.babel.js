/* global $, hljs, getID, getQuery, escape, findParent */

class Article {
  constructor(element) {
    this.e = element;
  }
  get rendered () {
    return this.e.className.match(/rendered/) !== null;
  }
  render() {
    const self = this;
    if(!self.rendered) {
      self.renderMarkDown();
      self.renderQuotedText();
      self.renderHyperLink();
      self.renderQuote();
      self.renderHeight();
      self.e.className += ' rendered';
    }
  }
  renderQuotedText() {
    const p = this.e;
    /* Change the color of quoted text */
    const quoteReg = /(?:^|\n)(>[^>|\n]\s*[^\n]+)/g;
    if(p.innerText.match(quoteReg) !== null) {
      /* REGEX 說明:
        * (1) (?: $pattern1 | $pattern2) 代表 $pattern1 跟 $pattern2 其中一個成立即可
        * (2)[^$pattern] 代表 not $pattern */
      const match = p.innerText.match(quoteReg);
      match.forEach(_match => {
        _match = _match.replace(/^\s/g, '');
        p.innerHTML = p.innerHTML.replace(/ {2}/g, ' ');
        p.innerHTML = p.innerHTML.replace(escape(_match), `<span class="quoteText">${escape(_match)}</span>`);
      });
    }
  }
  renderHyperLink() {
    const p = this.e;
    /* Replace ^http into a tag with regex. Notably, pug already escape most of the < or >
      * 之後有推播，前端 append 可能要注意這部份 */
    if(p.innerHTML.match(/(https?:\/\/[^\s]+)/))
      p.innerHTML = p.innerHTML.replace(/(http[s]*:\/\/[^\s|>|<]+?)([\s|<|^|@])/g, '<a class="link" rel="noopener" target="_blank" href="$1">$1</a>$2');

    p.querySelectorAll('a.link').forEach(e => {
      const youtubeRegex = /https:\/\/(?:youtu.be|www.youtube.com)\/(?:watch\?v=|embed\/|)([^&\s"/<]+)/;
      const match = e.innerText.match(youtubeRegex);
      if(match) {
        const youtubeEmbedUrl = `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${match[1]}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        const hiddenYoutubeBlock = document.createElement('div');
        hiddenYoutubeBlock.innerHTML = `${youtubeEmbedUrl}`;
        e.parentElement.insertBefore(hiddenYoutubeBlock, e.nextSibling);
      }
    });
  }
  renderMarkDown() {
    const p = this.e;
    /* Markdown 相關, 注意這邊 \n 已經都被替換成 br 了 */
    const markdownRegex = [
      /\*\*([^\s].*?[^\s])\*\*/, 
      /\*([^\s].*?[^\s])\*/, 
      /~~([^\s].*?[^\s])~~/, 
      /==([^\s].*?[^\s])==/, 
      /__([^\s].*?[^\s])__/,
      /(?:^|>)# (.*?)(?:\n|$)/,
      /```(\w+)(?:<\/span>)\n(.+?)```(?:<\/span>)/s,
    ];
    const markdownClass = ['bold', 'italic', 'del', 'spoiler', 'underline', 'title', 'code'];
    let pHTML = p.innerHTML.replace(/\n/g, '').replace(/<br>/g, '\n');
    markdownRegex.forEach((r, index) => {
      const rMatch = () => pHTML.match(r);
      while(rMatch() !== null) {
        if(markdownClass[index] === 'italic')
          pHTML = pHTML.replace(r, `<i class="${markdownClass[index]}">$1</i>`);
        else if(markdownClass[index] === 'code') {
          const result = rMatch();
          const langName = result[1];
          let content = result[2];
          /* 由於 code 區塊可能會已經存在其他 markdown, 需將其消除 */
          const regexList = (tagName, post='') => new RegExp(`<${tagName}${post}>(.+?)</${tagName}>`, 's');
          const regexTags = [['span', ''], ['span', ' class=".+?"'], ['i', ''], ['i', ' class=".+?"']].map(e => regexList(e[0], e[1]));
          regexTags.forEach(reg => {
            while(content.match(reg) !== null) {
              content = content.replace(reg, content.match(reg)[1]);
            }
          });
          const pre = document.createElement('pre');
          pre.innerHTML = `<code class="language-${langName}">${content}</code>`;
          hljs.highlightBlock(pre.children[0]);
          pHTML = pHTML.replace(result[0], pre.outerHTML);
          break;
        } else
          pHTML = pHTML.replace(r, `${index === markdownClass.indexOf('title') ? '>' : ''}<span class="${markdownClass[index]}">$1</span>${index === markdownClass.indexOf('title') ? '\n' : ''}`);
      }
    });
    p.innerHTML = pHTML.replace(/\n/g, '<br>');
  }
  renderQuote() {
    const p = this.e;
    /* 偵測每篇文章的內容，若有引用則將其由 >>\d{8} 代換成 span.quote 元素 */
    if(p.innerText.match(/>>\d{8}\s*/) !== null) {
      const thread = findParent(p, /thread/);
      const match = p.innerText.match(/>>\d{8}\s*/g);
      /* match 為所有比對到的字串之陣列, _match 則為每個比對到的字串 (如 ">>12345678") */
      match.forEach(_match => {
        // 偵測是否有換行符號, 若有則將其消去
        _match = _match.slice(_match.length - 1).match(/\s/) === null ? _match :  _match.replace(/\s/g, '');
        const num = _match.slice(2);
        /* 從 thread 物件中找尋引用的文章是否存在，若不存在則加入 missing 的類別 */
        const refExist = getQuery(`.quotable[data-num="${num}"]`, thread) !== null;
        p.innerHTML = p.innerHTML.split(escape(_match)).join(`<a href="#${num}"><span class="quote link ${refExist ? '' : 'missing'}" data-quoteType="num" data-num="${num}">${escape(_match)}</span></a>`);
        /* Add number to quoted article for css to show quotedList */
        const $quotedArticle = $(`*[data-number="${num}"]`).not('.quickPostTable, .postContainer').addClass('quotedArticle');
        $quotedArticle.each((index, ele) => {
          /* 在被引用文章的串中找到引用者的編號, 將其加入 quotedList 中顯示，並加入 quotedList 的 data-quotefrom 屬性中 */
          const quotedList = getQuery('.quotedList', ele);
          const quoter = findParent(p, /replyBox/);
          const quotedNumElement = quotedList.querySelector('.quotedNum');
          const quotedCount = Number(quotedNumElement.innerText);
          quotedNumElement.innerText = quotedCount + 1;
          const $container = $(document.createElement('a')).addClass('link').attr('href', `#${quoter.dataset.number}`).append(document.createElement('span'));
          const $span = $($container[0].children[0]);
          $span.addClass('quoted').attr('data-num', quoter.dataset.number).text('>>' + quoter.dataset.number);
          quotedList.appendChild($container[0]);
          /* set quotedfrom attr for showing hoverBox */
          quotedList.dataset.quotedfrom = quotedList.dataset.quotedfrom === undefined ? quoter.dataset.number : quotedList.dataset.quotedfrom + `, ${quoter.dataset.number}`;
        });
      });
    }
  }
  renderHeight() {
    const p = this.e;
    /* 將超過固定高度的元素隱藏，並綁定按鈕來顯示 */
    const replyMode = getQuery('.container').dataset.replymode === 'true';
    const offset = 200;
    let flag = false;
    if(p.offsetHeight > offset) {
      let height = 0;
      Array.prototype.slice.apply(p.children).forEach(e => {
        /* If the content is (1) already expanded or (2) the post in reply mode, don't close it again. */
        if((replyMode && findParent(p, 'mainContent') !== null) || p.className.match(/show/) !== null)
          return true;
        /* Remove last binding button to prevent duplicate binding */
        if(e.className.match(/showContentTrigger/) !== null)
          e.parentElement.removeChild(e);
        /* <br> element have offsetHeight=0, but in browser it have 4 px height */
        const eHeight = e.offsetHeight > 0 ? e.offsetHeight : 4;
        if(height + eHeight <= offset && !flag)
          height += eHeight;
        else {
          if(!flag) {
            /* Create show button when its not created */
            const br = document.createElement('br');
            const showButton = document.createElement('span');
            showButton.className = 'link showContentTrigger';
            showButton.innerText = '展開文章...';
            p.appendChild(br);
            p.appendChild(showButton);
            showButton.addEventListener('click', () => {
              $(p).addClass('show').find('.hidden').removeClass('hidden');
              p.removeChild(showButton);
            });
            /* 隱藏內容時若有多個 br 或沒內容的 span 會導致真正的高度和計算的不同 */
            let prevEle = e.previousElementSibling;
            while(prevEle !== null && prevEle.innerText === '') {
              prevEle.className += ' hidden';
              prevEle = prevEle.previousElementSibling;
            }
            flag = true;
          }
          e.className += ' hidden';
        }
      });
    }
  }
}


