var express = require('express'),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    https = require('https'),
    app = express(),
    cheerio = require("cheerio"),
    fs = require('fs'),
    rp = require('request-promise');
    
var randomReturn = require('./RandomReturn.json'),
    PunchCard = require('./PunchCard.js'),
    setting = require('./settings.json');

var ChannelAccessKey = 'actVI2pGSgmQ+JYuF2il02qMYH+1+3Q6pvaTjjL4J77uWSuVRoTZnloLqZG39jxfuZAWyS77LfHuQ9rHx4vupzxq3sDLKcwRraRq0F0t9B8aULHlhuO2BYmiIvOFjT6Vs+RFkd3GDQnNB2Ykvo6rlgdB04t89/1O/w1cDnyilFU=';

var event = '',
    meowSwitch = false;

app.set('port', (process.env.PORT || 5000));

app.get('/', async function (req, res) {
    res.send();

    setting.Persons.forEach(async function(p){
        var result = await PunchCard.TrytoPunchIn(p);
        if(result){
            replyMsgToLine('push', 'Cc95c551988b0c687621be2294a5599a8', result);
        }
    });
});

app.post('/', jsonParser, async function (req, res) {
    try{
        event = req.body.events[0];
        var type = event.type;
        
        var replyToken = event.replyToken;
        var replyObj = null;
        
        //初次加入給使用說明訊息
        if (type == 'join' || type == 'follow'){
            var result = await Help();
            if(result.IsSuccess){
                replyMsgToLine('text', replyToken, result.msg);
            }else{
                throw 'Get help content error: ' + e.toString();
            }

        //目前僅針對文字訊息回覆
        }else if (type == 'message' && event.message.type == 'text') {
            console.log('InputStr:', event.message.text);
            replyObj = await parseInput(event.message.text);
            if(replyObj.msg){
                replyMsgToLine(replyObj.type, replyToken, replyObj.msg);
            }
        }

        res.send();
    }catch(e){
        console.log('post error:', e.toString());
    }
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

function replyMsgToLine(outType, rplyToken, rplyVal) {

    let rplyObj;
    
    // test
    //console.log('Do reply to line,', outType, rplyToken, rplyVal)
    //return;

    // push
    if (outType == 'push') {
        v_path = '/v2/bot/message/push';
        rplyObj = {
            to: rplyToken,
            messages: [{
                type: "text",
                text: rplyVal
            }]
        }
    }
	
    //圖片回復
    else if (outType == 'image') {
        v_path = '/v2/bot/message/reply';
        rplyObj = {
            replyToken: rplyToken,
            messages: [
                {
                    type: "image",
                    originalContentUrl: rplyVal,
                    previewImageUrl: rplyVal
                }
            ]
        }
    } 
    
    //貼圖
    else if (outType == 'sticker') {
        v_path = '/v2/bot/message/reply';
        rplyObj = {
            replyToken: rplyToken,
            messages: [rplyVal]
        }
    }
    
    //普通文字訊息
    else {
        v_path = '/v2/bot/message/reply';
        rplyObj = {
            replyToken: rplyToken,
            messages: [
                {
                  type: "text",
                  text: rplyVal
                }
            ]
        }
    }
    let rplyJson = JSON.stringify(rplyObj);
    var options = setOptions();
    var request = https.request(options, function (response) {
        console.log('Status: ' + response.statusCode);
        console.log('Headers: ' + JSON.stringify(response.headers));
        response.setEncoding('utf8');
        response.on('data', function (body) {
            console.log('body:', body);
        });
    });
    request.on('error', function (e) {
        console.log('Request error:', e.message);
    })
    request.end(rplyJson);
}

function setOptions() {
    var option = {
        host: 'api.line.me',
        port: 443,
        path: '/v2/bot/message/reply',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ChannelAccessKey
        }
    }
    return option;
}

// 分析輸入字串
async function parseInput(inputStr) {
    // var _isNaN = function (obj) {
    //     return isNaN(parseInt(obj));
    // }
    try{
        var replyObj = {
            type: 'text',
            msg: ''
        };

        let msgSplitor = (/\S+/ig);
        //定義輸入字串
        let mainMsg = inputStr.match(msgSplitor); 
        //指定啟動詞在第一個詞，轉小寫方便辨識
        let trigger = mainMsg[0].toString().toLowerCase(); 
        
        if (IsKeyWord(trigger, ['蘿莉控', '!3年', '!三年'])) {
            replyObj.type = 'image';
            replyObj.msg = randomReturn.image.lolicon.getRandom();
        }

        else if (trigger == '!臭貓') {
            replyObj.msg = randomReturn.text.author.getRandom();
        } 
        
        // 發票
        else if (IsKeyWord(trigger, ['統一發票', '發票']) && mainMsg.length == 1) {

            var result = await TWticket();
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }

        // 縮網址
        else if (trigger == 'shorten' && mainMsg.length > 1) {
            var result = await shortenUrl(inputStr.substring(inputStr.indexOf(' ')+1));
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }
        
        // google search
        else if(IsKeyWord(trigger, ['google', '搜尋', '尋找']) && mainMsg.length > 1){
            var result = await googleSearch(inputStr.substring(inputStr.indexOf(' ')+1));
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }

        // 日幣
        else if (IsKeyWord(trigger, ['!jp', '!日幣','！jp', '！日幣', '！ＪＰ', '！ｊｐ'])) {
            var result = await JP();
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }

        //梗圖
        else if (trigger.match(/jpg/) != null && mainMsg.length == 1){
            var result = await Neta(mainMsg[0].replace('jpg',''));
            if(result.IsSuccess){
                replyObj.type = 'image';
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }

        //貼圖
        else if(IsKeyWord(trigger, ['打架', '互相傷害r', '來互相傷害', '來互相傷害r'])){
            replyObj.type = 'sticker';
            replyObj.msg = Sticker("2", "517");
        }
        
        else if(IsKeyWord(trigger,['幫QQ', '哭哭', 'QQ'])){
            replyObj.type = 'sticker';
            replyObj.msg = Sticker("1", "9");
        }
        
        else if(trigger == '<3'){
            replyObj.type = 'sticker';
            replyObj.msg = Sticker("1", "410");
        }
        
        else if(trigger == '招財貓'){
            replyObj.type = 'sticker';
            replyObj.msg = Sticker("4", "607");
        }
        
        else if(IsKeyWord(trigger, ['好冷', '很冷', '冷爆啦', '冷死'])){
            replyObj.type = 'sticker';
            replyObj.msg = Sticker("2", "29");
        }
        
        //喵喵叫開關
        else if (IsKeyWord(trigger,['貓咪安靜', '貓咪閉嘴', '貓咪不要吵', '貓咪不要叫'])) {
            meowSwitch = false;
            replyObj.msg = '......';
        }
        else if (trigger == '貓咪在哪裡'){
            meowSwitch = true;
            replyObj.msg = randomReturn.text.meow.getRandom();
        }
        
        //一般功能
        else if (trigger.match(/運氣|運勢/) != null) {
            var result = await Luck(mainMsg[0]);
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }
        else if (trigger.match(/立flag|死亡flag/) != null) {
            replyObj.msg = randomReturn.text.flag.getRandom();
        }    
        else if (IsKeyWord(trigger, ['!貓咪', '！貓咪'])) {
            replyObj.msg = MeowHelp();
        }
        else if (IsKeyWord(trigger, ['!help', '！help', '！ｈｅｌｐ', '！Ｈｅｌｐ', '！ＨＥＬＰ'])) {
            var result = await Help();
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }
        else if (trigger.match(/排序|排列/) != null && mainMsg.length >= 3) {
            replyObj.msg = SortIt(inputStr, mainMsg);
        }
        else if (trigger.match(/choice|隨機|選項|幫我選|幫我挑/) != null && mainMsg.length >= 3) {
            replyObj.msg = Choice(inputStr, mainMsg);
        }
        else if (trigger.match(/喵|貓/) != null && meowSwitch) {
            replyObj.msg = randomReturn.text.meow.getRandom();
        }
        
        return replyObj;

    }catch(e){
        console.log('parse inpur error:', e.toString());
    }
}

//// request functions ////

// 梗圖嵌字 
// 待更新: 調整字體&位置的演算法
function Neta(text){

    return new Promise(function(resolve, reject){
        try{
            var Canvas = require('canvas'),
                font = new Canvas.Font('BrSong', __dirname + '/resource/BrSong.ttc'),
                canvas = new Canvas(174, 147, "png"),
                ctx = canvas.getContext('2d'),
                imgur = require('imgur');
            
            ctx.addFont(font);

            fs.readFile( __dirname + '/resource/neta.png', (err, buf) => {
                if (err) throw err
                var img = new Canvas.Image;
                img.src = buf;

                ctx.drawImage(img, 0, 0, 174, 147);
                //ctx.rotate(-10*Math.PI/180);
                
                var strs= new Array();
                strs = text.split("");

                ctx.font = '20px bold BrSong';
                ctx.fillStyle = "#FFFFFF";
                for (i=0;i<strs.length ;i++ ) { 
                    ctx.fillText(strs[i],132,(32+(i*28)));
                } 

                //ctx.rotate(10*Math.PI/180);

                fs.writeFileSync("test.jpg", canvas.toBuffer());

                imgur.setClientId('59891e0427c16b3');

                imgur.uploadFile( __dirname + '/test.jpg')
                .then(function (json) {
                    resolve({
                        IsSuccess: true,
                        msg: json.data.link
                    });
                })
                .catch(function (error) {
                    throw error.message;
                });
            })
        }catch(e){
            resolve({
                IsSuccess: false,
                msg: 'Neta error": ' + e.toString()
            });
        }
    });
}


// 玉山銀行日幣即期匯率
function JP() {

    return new Promise(function(resolve, reject){
        try{
            var options = {
                uri: "https://www.esunbank.com.tw/bank/personal/deposit/rate/forex/foreign-exchange-rates",
                transform: function (body) {
                    return cheerio.load(body);
                }
            };

            rp(options)
            .then(function ($) {

                var fax = $("#inteTable1 > tbody > .tableContent-light");
                var str = "玉山銀行目前日幣的即期賣出匯率為 " + fax[3].children[5].children[0].data + " 換起來! ヽ(`Д´)ノ";

                resolve({
                    IsSuccess: true,
                    msg: str
                });
            })
            .catch(function (e) {
                throw e.toString();
            });
        }catch(e){
            resolve({
                IsSuccess: false,
                msg: 'Neta error": ' + e.toString()
            });
        }
    });
}

// google search
// 加上縮址
function googleSearch(str){

    return new Promise(function(resolve, reject){
        try{
            let s = GetUrl('https://www.google.com.tw/search', {
                q: str
            });
            
            var rq = require("request");
            rq.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyD8cFQEtnwmlbV-D1MtmvLjc_rVGFZfg6s', {
                json: {
                    'longUrl': s
                }
            }, function (error, response, body) {
                if(error) {
                    throw error.toString();
                } else {
                    s = body.id;
                    resolve({
                        IsSuccess: true,
                        msg: s + '\n' + randomReturn.text.google.getRandom()
                    });
                }
            });
        }catch(e){
            resolve({
                IsSuccess: false,
                msg: 'Neta error": ' + e.toString()
            });
        }
    })
}

// shorten Url

function shortenUrl(url){
    return new Promise(function(resolve, reject){
        try{
            var rq = require("request");
            rq.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyD8cFQEtnwmlbV-D1MtmvLjc_rVGFZfg6s', {
                json: {
                    'longUrl': url
                }
            }, function (error, response, body) {
                if(error) {
                    throw error;
                } else {
                    resolve({
                        IsSuccess: true,
                        msg: body.id
                    });
                }
            });
        }catch(e){
            resolve({
                IsSuccess: false,
                msg: 'Neta error": ' + e.toString()
            });
        }
    })
}

// 統一發票

function TWticket() {
    return new Promise(function(resolve, reject){
        try{
            var options = {
                uri: 'http://invoice.etax.nat.gov.tw/index.html',
                transform: function (body) {
                    return cheerio.load(body);
                }
            };
            rp(options).then(function ($) {
                var fax = $(".t18Red");
                
                var s = $("#area1")[0].children[3].children[0].data.halfToFull() +
                    '\n特別獎：\n    ' + 
                    fax[0].children[0].data.halfToFull() + 
                    '\n特獎：\n    ' + 
                    fax[1].children[0].data.halfToFull() +
                    '\n頭獎～六獎：\n    ' + 
                    fax[2].children[0].data.replace(/、/g, '\n    ').halfToFull(false) +
                    '\n增開六獎：\n    ' + 
                    fax[3].children[0].data.replace(/、/g, '\n    ').halfToFull(false);
                
                    resolve({
                        IsSuccess: true,
                        msg: s
                    });
            })
            .catch(function (error) {
                throw(error);
            });
        }catch(e){
            resolve({
                IsSuccess: false,
                msg: 'Neta error": ' + e.toString()
            });
        }
    });
}

/// 運氣運勢相關

function Luck(str) {
    return new Promise(function(resolve, reject){
        try{
            var table = ['牡羊座.白羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座.天平座', '天蠍座', '射手座', '魔羯座', '水瓶座', '雙魚座'];
            var target = str.replace('運氣', '').replace('運勢','');
            
            var index = table.indexOf(table.find(function(element){
                if(element.indexOf(target)>-1) return element;
            }));
            
            if(index < 0 || target == ''){
                resolve({
                    IsSuccess: true,
                    msg: str + ' ： ' + randomReturn.text.luck.getRandom()
                });

            }else{
                var today = new Date().toISOString().substring(0, 10);
                var options = {
                    uri: 'http://astro.click108.com.tw/daily_' + index + '.php?iAcDay=' + today + '&iAstro=' + index,
                    transform: function (body) {
                        return cheerio.load(body);
                    }
                };
                rp(options).then(function ($) {
                    var fax = $(".TODAY_CONTENT")[0]
                    
                    var s = 
                    fax.children[1].children[0].data + '\n' +
                    fax.children[3].children[0].children[0].data + '\n' +
                    fax.children[4].children[0].data + '\n' +
                    fax.children[6].children[0].children[0].data + '\n' +
                    fax.children[7].children[0].data + '\n' +
                    fax.children[9].children[0].children[0].data + '\n' +
                    fax.children[10].children[0].data + '\n' +
                    fax.children[12].children[0].children[0].data + '\n' +
                    fax.children[13].children[0].data;
                    
                    resolve({
                        IsSuccess: true,
                        msg: s
                    });
                })
                .catch(function (error) {
                    throw error.toString();
                });
            }
            
        }catch(e){
            resolve({
                IsSuccess: false,
                msg: 'Neta error": ' + e.toString()
            });
        }
    });
}
//// request functions end ////


//貼圖回覆
function Sticker(package, sticker){
    var msg = {
        type: "sticker",
        packageId: package,
        stickerId: sticker
    };
    return msg;
}


/// Others

// 計算當地時間
// function calcTime(offset) {

//     // 建立現在時間的物件
//     d = new Date();

//     // 取得 UTC time
//     utc = d.getTime() + (d.getTimezoneOffset() * 60000);

//     // 新增不同時區的日期資料
//     nd = new Date(utc + (3600000*offset));

//     // 顯示當地時間
//     return (nd.getMonth()+1)+'-'+nd.getDate();
// }

// 排列
function SortIt(input, mainMsg) {

    let a = input.replace(mainMsg[0], '').match(/\S+/ig);
    for (var i = a.length - 1; i >= 0; i--) {
        var randomIndex = Math.floor(Math.random() * (i + 1));
        var itemAtIndex = a[randomIndex];
        a[randomIndex] = a[i];
        a[i] = itemAtIndex;
    }
    return mainMsg[0] + ' → [' + a + ']';
}

//選擇
function Choice(input, str) {
    let a = input.replace(str[0], '').match(/\S+/ig);
    return str[0] + '[' + a + '] → ' + a[Math.floor((Math.random() * (a.length + 0)))];
}

// 組 get url
function GetUrl(url, data) {
    if (data != "" && typeof data != "undefined") {
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            var dataName = keys[i];
            if (data.hasOwnProperty(dataName)) {
                url += (i == 0) ? "?" : "&";
                url += dataName + "=" + data[dataName];
            }
        }
    }
    return url;
}

//對應關鍵字
function IsKeyWord(target, strs){
    if(target==null||strs==null){
        return false;
    }
    
    if(target == strs)
    return true;
    
    for(i=0; i<strs.length; i++){
        if(target == strs[i]){
            return true;
        }
    }
    return false;
}

// Help

function Help() {
    return new Promise(function(resolve, reject){
        try{
            fs.readFile( __dirname + '/README.txt', function(err, buf) {
                if(err) throw err.toString();

                resolve({
                    IsSuccess: true,
                    msg: buf.toString()
                })
            });
        }catch(e){
            resolve({
                IsSuccess: false,
                msg: e.toString()
            })
        }
    });
}

function MeowHelp() {
    return randomReturn.text.meow.getRandom() + '\n要做什麼喵?\n\n(輸入 !help 以獲得使用說明)';
}


///////////// prototype /////////////////

String.prototype.halfToFull = function (flag) {
    //半形轉全形
    var temp = "";
    for (var i = 0; i < this.toString().length; i++) {
        var charCode = this.toString().charCodeAt(i);
        if (charCode <= 126 && charCode >= 33) {
            charCode += 65248;
        } else if (charCode == 32) { // 半形空白轉全形
            if(flag){
                charCode = 12288;
            }
        }
        temp = temp + String.fromCharCode(charCode);
    }
    return temp;
};

Array.prototype.getRandom = function (flag) {
    //取得陣列隨機內容
    return this[Math.floor((Math.random() * (this.length)) + 0)];
}
