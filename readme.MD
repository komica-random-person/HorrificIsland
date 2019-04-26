# H. Island
Version: 0.0.1

一個手刻的 k島，並嘗試實作我想要的功能

我主要的環境是 `Linux, nodejs v10.15.3`，誠徵會後端的一起協做

# How to use
1. 安裝 [nodejs](https://nodejs.org/en/)
2. 到資料夾下使用 `npm install` 指令安裝所有套件
3. 使用 `npm run start` 可以開啟 `localhost:9999` 伺服器
4. 使用 `npm run dev` 可以開啟 `localhost:5000` 伺服器，並會偵測檔案改動來進行 live reload.

# API SPEC
* https://app.swaggerhub.com/apis-docs/komica-random-person/HorrificIsland/1.0.0#/

# Todos
## 預計前端功能
* 星號為需配合後端 API 之功能
- [ ] 預覽小窗窗
    - [x] 討論串下的文章 Reference
        - [x] 在小窗窗時不要觸發關閉
    - [ ] 同討論串下的同ID預覽窗
        - [x] Same ID display
        - [ ] Same ID reference
    - [ ] Referenced list
        - [x] Each reference
        - [ ] Every reference
    - [x] Recurrence 的 Reference
    - [x] 動態位置
        - [x] 上下邊界
        - [x] 左右
    - [ ] Bug: 影片點擊放大時重新計算座標
- [ ] 功能性預覽小窗窗
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
- [ ] showing SAGE*
- [ ] hyper links on https://[\S]+
- [ ] 引用文字高亮
    - [ ] \s 的問題?
- [x] Showing the file name on mobile
- [x] Mobile version (RWD)
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

