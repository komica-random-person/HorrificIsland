# H島？

其實只是想刻一個 K島，並把一些我想要有的功能加上去...
我主要環境是 Linux, nodejs v10.15.3
誠徵會後端的人一起協作

## 預計前端功能
* 星號為需配合後端 API 之功能
- [ ] 預覽小窗窗
    - [ ] 同討論串下的同ID預覽窗
    - [ ] 討論串下的文章 Reference 以及 Recurrence 的 Reference
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


