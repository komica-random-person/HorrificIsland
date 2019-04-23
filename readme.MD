# H島？

其實只是想刻一個 K島，並把一些我想要有的功能加上去...

我主要環境是 Linux, nodejs v10.15.3

誠徵會後端的人一起協作

## 預計前端功能

* 星號為需配合後端 API 之功能
- [ ] 預覽小窗窗
    - [x] 討論串下的文章 Reference
        - [x] 在小窗窗時不要觸發關閉
    - [ ] 同討論串下的同ID預覽窗
    - [ ] Recurrence 的 Reference
    - [x] 動態位置
        - [x] 上下邊界
        - [x] 左右
    - [ ] scale image when hover
    - [ ] play webm when hover
- [ ] 點 ID 之後的控製板
    - [ ] ngid*
    - [ ] 複製ID
    - [ ] 查歷史*
- [ ] 討論串的 tag
    - [ ] voting
- [ ] 串主可以折疊回復(非刪除)*
    - [ ] 按鈕來展開該串所有折疊的回復
        * 若有人 reference 折疊的則直接顯示
- [ ] 背景色自訂*
- [ ] Ngid by IP country*
- [ ] Showing the file name on mobile
- [ ] showing sage
- [ ] Mobile version (RWD)
- [x] 引用文字高亮
- [x] 圖片點擊放大
    - [x] webm 顯示

## 預計後端功能 (API server & database)
- [ ] Assign ID to IP
- [ ] 存他媽討論串
    - [ ] 存他媽回復
    * 可能比照 https://homu.homu-api.com/page/0 格式？
- [ ] Register account
    - [ ] 加密 der 密碼 (前端atob, 後端雜湊？)
    - [ ] 存各種 customized 設定
        - [ ] 背景、ngid 名單等等
- [ ] ID Ranking
    * related to thread's tag voting: once you shit yourself, you smell (1 day)
    - [ ] Thread ranking & filtering
- [ ] Fucking Socket


## API 格式
```=
{
    _id: 'mogodb default',
    _type: int[0, 1],         // this document is main thread/reply
    _mainId: int{8},          // number of main thread
    number: int{8},           // number of this thread/reply
    postId: string{8},
    content: string,
    image: {
        thumb: string,
        origin: string
    },
    comments: [
        {
            postId: string{8},
            content: string
        }
    ],
    allowComment: bool,
}
```


