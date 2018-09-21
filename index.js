var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var app = express();
var cheerio = require("cheerio");
var rp = require('request-promise');
var request = require('request');
var parser = require('xml2json-light');
var randomReturn = require('./RandomReturn.json');
var ChannelAccessKey = 'actVI2pGSgmQ+JYuF2il02qMYH+1+3Q6pvaTjjL4J77uWSuVRoTZnloLqZG39jxfuZAWyS77LfHuQ9rHx4vupzxq3sDLKcwRraRq0F0t9B8aULHlhuO2BYmiIvOFjT6Vs+RFkd3GDQnNB2Ykvo6rlgdB04t89/1O/w1cDnyilFU=';
var GeocodingKey = 'AIzaSyD8cFQEtnwmlbV-D1MtmvLjc_rVGFZfg6s';

var jsonParser = bodyParser.json();

var outType = 'text';
var event = '';
var v_path = '/v2/bot/message/reply';
var meowSwitch = false;

app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
    res.send('Hello');
});

app.post('/', jsonParser, function (req, res) {
    try{
    event = req.body.events[0];
    let type = event.type;
    
    let rplyToken = event.replyToken;
    let rplyVal = null;
    
    outType = 'text';

    try {
        if (type == 'join' || type == 'follow'){
            rplyVal = Help();
        }else if (type == 'message' && event.message.type == 'text') {
            console.log('InputStr: ' + event.message.text);
            rplyVal = parseInput(rplyToken, event.message.text);
        }
    }catch (e) {
        console.log('catch error: ' + e.toString());
    }
    
    if (rplyVal) {
        replyMsgToLine(outType, rplyToken, rplyVal);
    }

    res.send('ok');
    }catch(e){console.log(e);}
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

function replyMsgToLine(outType, rplyToken, rplyVal) {

    let rplyObj;
    
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
            console.log(body);
        });
    });
    request.on('error', function (e) {
        console.log('Request error: ' + e.message);
    })
    request.end(rplyJson);
}

function setOptions() {
    var options = {
        host: 'api.line.me',
        port: 443,
        path: v_path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ChannelAccessKey
        }
    }
    return options;
}

////////////////////////////////////////
//////////////// 分析開始 //////////////
////////////////////////////////////////
function parseInput(rplyToken, inputStr) {
	
    _isNaN = function (obj) {
        return isNaN(parseInt(obj));
    }
    let msgSplitor = (/\S+/ig);
    let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
    let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞，轉小寫方便辨識
    
    console.log('trigger: ' + trigger);
    
    if (IsKeyWord(trigger, ['蘿莉控', '!3年', '!三年'])) {
        outType = 'image';
        return randomReturn.image.lolicon.getRandom();
    }

    else if (trigger == '!臭貓') {
        return funnyreturn('author');
    } 
    
    // 發票
    else if (IsKeyWord(trigger, ['統一發票', '發票']) && mainMsg.length == 1) {
        return TWticket(rplyToken);
    }

    // 縮網址
    else if (trigger == 'shorten' && mainMsg.length > 1) {
        shortenUrl(inputStr.substring(inputStr.indexOf(' ')+1), rplyToken);
    }
    
    // google search
    else if(IsKeyWord(trigger, ['google', '搜尋', '尋找']) && mainMsg.length > 1){
        googleSearch(inputStr.substring(inputStr.indexOf(' ')+1), rplyToken);
    }

    // 日幣
    else if (IsKeyWord(trigger, ['!jp', '!日幣','！jp', '！日幣', '！ＪＰ', '！ｊｐ'])) {
        JP(rplyToken);
    }

    //貼圖
    else if(IsKeyWord(trigger, ['打架', '互相傷害r', '來互相傷害', '來互相傷害r'])){
        return Sticker("2", "517");
    }
    
    else if(IsKeyWord(trigger,['幫QQ', '哭哭', 'QQ'])){
        return Sticker("1", "9");
    }
    
    else if(trigger == '<3'){
        return Sticker("1", "410");
    }
    
    else if(trigger == '招財貓'){
        return Sticker("4", "607");
    }
    
    else if(IsKeyWord(trigger, ['好冷', '很冷', '冷爆啦', '冷死'])){
        return Sticker("2", "29");
    }
    
    //喵喵叫開關
    else if (IsKeyWord(trigger,['貓咪安靜', '貓咪閉嘴', '貓咪不要吵', '貓咪不要叫'])) {
        meowSwitch = false;
        return '......';
    }
    else if (trigger == '貓咪在哪裡'){
        meowSwitch = true;
        return randomReturn.text.meow.getRandom();
    }
    
    //一般功能
    else if (trigger.match(/運氣|運勢/) != null) {
        return Luck(mainMsg[0], rplyToken); //各種運氣
    }
    else if (trigger.match(/立flag|死亡flag/) != null) {
        return randomReturn.text.flag.getRandom();
    }    
    else if (IsKeyWord(trigger, ['!貓咪', '！貓咪'])) {
        return MeowHelp();
    }
    else if (IsKeyWord(trigger, ['!help', '！help', '！ｈｅｌｐ', '！Ｈｅｌｐ', '！ＨＥＬＰ'])) {
        return Help();
    }
    else if (trigger.match(/排序|排列/) != null && mainMsg.length >= 3) {
        return SortIt(inputStr, mainMsg);
    }
    else if (trigger.match(/choice|隨機|選項|幫我選|幫我挑/) != null && mainMsg.length >= 3) {
        return choice(inputStr, mainMsg);
    }
    else if (trigger.match(/喵|貓/) != null && meowSwitch) {
        return randomReturn.text.meow.getRandom();
    }
    else if (trigger == 'book' && mainMsg.length >= 2){
        Book(inputStr.substring(inputStr.indexOf(' ')+1), rplyToken);
    }
}

//// request functions ////

//test
function Book(text, replyToken){
  var Canvas = require('canvas'),
    canvas = new Canvas(500, 370, "png"),
    font = new Canvas.Font('Kaiu', __dirname + '/kaiu.ttf'),
    ctx = canvas.getContext('2d'),
    fs = require('fs'),
    imgur = require('imgur');
	
  ctx.addFont(font);

  fs.readFile( __dirname + '/image.png', (err, buf) => {
    if (err) throw err
    var img = new Canvas.Image;
    img.src = buf;

    ctx.drawImage(img, 0, 0, 500, 370);
    ctx.rotate(-10*Math.PI/180);
    
    var strs= new Array();
    strs = text.split("");

    ctx.font = '36px "Kaiu"';
    for (i=0;i<strs.length ;i++ ) { 
        ctx.fillText(strs[i],147,(125+(i*16)));
    } 

    ctx.rotate(10*Math.PI/180);

    fs.writeFileSync("test.jpg", canvas.toBuffer());

    imgur.setClientId('59891e0427c16b3');

    imgur.uploadFile( __dirname + '/test.jpg')
         .then(function (json) {
	      replyMsgToLine('image', replyToken, json.data.link);
         })
         .catch(function (err) {
                 console.error(err.message);
         });
  })
}


// JP
function JP(replyToken) {
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
            replyMsgToLine(outType, replyToken, str);
        })
        .catch(function (err) {
            return "Fail to get data.";
        });
}

// google search

function googleSearch(str, rplyToken){
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
            return 'error' + error;
        } else {
            s = body.id;
            replyMsgToLine(outType, rplyToken, s + '\n' + randomReturn.text.google.getRandom());
        }
    });
}

// shorten Url

function shortenUrl(url, replyToken){
    var rq = require("request");
    rq.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyD8cFQEtnwmlbV-D1MtmvLjc_rVGFZfg6s', {
        json: {
            'longUrl': url
        }
    }, function (error, response, body) {
        if(error) {
            return 'error' + error;
        } else {
            url = body.id;
            replyMsgToLine(outType, replyToken, url);
        }
    });
}

// 統一發票

function TWticket(replyToken) {
    
    var options = {
        uri: 'http://invoice.etax.nat.gov.tw/index.html',
        transform: function (body) {
            return cheerio.load(body);
        }
    };
    rp(options).then(function ($) {
        var fax = $(".t18Red");
        
        var s = 
        $("#area1")[0].children[3].children[0].data.halfToFull() +
        '\n特別獎：\n    ' + 
        fax[0].children[0].data.halfToFull() + 
        '\n特獎：\n    ' + 
        fax[1].children[0].data.halfToFull() +
        '\n頭獎～六獎：\n    ' + 
        fax[2].children[0].data.replace(/、/g, '\n    ').halfToFull(false) +
        '\n增開六獎：\n    ' + 
        fax[3].children[0].data.replace(/、/g, '\n    ').halfToFull(false);
        
        replyMsgToLine(outType, replyToken, s);
    })
    .catch(function (err) {
        console.log(err);
    });
}

function Constellation(index, replyToken) {
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
        
        replyMsgToLine(outType, replyToken, s);
    })
    .catch(function (err) {
        console.log("Fail to get data.");
    });
}

//// request functions end ////


////////////////////////////////////////
//////////////// stickers
////////////////////////////////////////
function Sticker(package, sticker){
    outType = 'sticker';
    var stk = {
        type: "sticker",
        packageId: package,
        stickerId: sticker
    };
    return stk;
}

////////////////////////////////////////
//////////////// 恩...
////////////////////////////////////////
function funnyreturn(name) {

    let authorArr = ['↑正直清新不鹹濕，女友募集中！','我要給你一個翻到後腦勺的、無比華麗的、空前絕後的特大號白眼'];

    var rplyArr;
    
    if (name == 'author') {
        rplyArr = authorArr;
    } 
    
     return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
}


/// 運氣運勢相關

function Luck(str, replyToken) {
    var table = ['牡羊座.白羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座.天平座', '天蠍座', '射手座', '魔羯座', '水瓶座', '雙魚座'];
    var target = str.replace('運氣', '').replace('運勢','');
    
    var index = table.indexOf(table.find(function(element){
        if(element.indexOf(target)>-1) return element;
    }));
    
    if(index < 0 || target == ''){
        return str + ' ： ' + randomReturn.text.luck.getRandom();
    }else{
        // call request
        Constellation(index, replyToken);
    }
}

////////////////////////////////////////
//////////////// Others
////////////////////////////////////////

function calcTime(offset) {

    // 建立現在時間的物件
    d = new Date();

    // 取得 UTC time
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // 新增不同時區的日期資料
    nd = new Date(utc + (3600000*offset));

    // 顯示當地時間
    return (nd.getMonth()+1)+'-'+nd.getDate();
}

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

function choice(input, str) {
    let a = input.replace(str[0], '').match(/\S+/ig);
    return str[0] + '[' + a + '] → ' + a[Math.floor((Math.random() * (a.length + 0)))];
}

// 組url
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

////////////////////////////////////////
//////////////// Help
////////////////////////////////////////

function Help() {
    return '【貓咪喵喵】 by臭貓\
\n 主要是娛樂用途 (&各種裱人功能OuOb)\
\n \
\n 使用說明:\
\n *友善回應(OuOb)*\
\n     關鍵字: !臭貓\
\n *玉山銀行日幣匯率*\
\n     關鍵字: !JP/!日幣\
\n *喵喵叫開關*\
\n     關鍵字: 貓咪安靜/貓咪閉嘴/貓咪不要吵\
\n     關鍵字2: 貓咪在哪裡\
\n *選擇功能*\
\n     關鍵字: choice/隨機/選項/幫我選\
\n     例子: 隨機選顏色 紅 黃 藍\
\n *隨機排序*\
\n     關鍵字: 排序\
\n     例子: 吃東西排序 羊肉 牛肉 豬肉\
\n *占卜功能*\
\n     關鍵字: 運氣/運勢/天平運勢\
\n     例子: 今日運勢\
\n *死亡FLAG*\
\n     關鍵字: 立Flag/死亡flag\
\n *其他彩蛋*\
\n     關鍵字: 不告訴你\
';
}

function MeowHelp() {
    return randomReturn.text.meow.getRandom() + '\n要做什麼喵?\n\n(輸入 !help 以獲得使用說明)';
}

//// 打卡test

var setting = require('./settings.json');

var PunchCard = function() {
    var needPunchedIn = true;

    var d, utc, today, date, hour, day;

    var card = {
        key: '',
        groupUBINo: "20939790",
        companyID: "1",
        account: "",
        language: "zh-tw",
        longitude: "",
        latitude: "",
        address: "",
        memo: "",
        mobile_info: ""
    };

    var doInit = function(){
        d = new Date();
        utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        today = new Date(utc + (3600000*8));
        date = today.getFullYear()+'/'+(today.getMonth()+1)+'/'+today.getDate();
        hour = today.getHours();
        day = today.getDay();
    };

    var doValidate = function(){
        needPunchedIn = function(){
            if(setting.Dates.ReturnDays.includes(date)){
                return true;
            }
            else if(day == 6 || day == 0){
                return false;
            }
            else if(setting.Dates.Holidays.includes(date)){
                return false;
            }else{
                return true;
            }
        };
        if(needPunchedIn()){
            if(hour == 8||hour == 18){
                return true;
            }else{
                return false;
            }
        }
    }

    var doPunchIn = function(onWork, person){
	    
	console.log('Punch: doPunchIn' + ' - ' + person.Name);
	var position = setting.Positions[person.Place];
	    
        if(onWork){
            // 抓session key
            request.post({
                url: "https://workflow.pershing.com.tw/WFMobileWeb/Service/eHRFlowMobileService.asmx/Login",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest"
                },
                body: GetUrlEncodeJson({
                    groupUBINo: 20939790,
                    companyID: 1,
                    account: person.Account,
                    password: person.Password})
            },function(error, response, body){
                try{
                    var data = parser.xml2json(body);
                    if(data.FunctionExecResult.IsSuccess){
                        card.key = data.FunctionExecResult.ReturnObject["_@ttribute"];
			card.account = person.Account;
                        card.latitude = position.lat_base + Math.floor((Math.random() * position.lat_offset + position.lat_more));
                        card.longitude = position.long_base + Math.floor((Math.random() * position.long_offset) + position.long_more);
			    
                        // 抓地址
                        request.post({
                            url: "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + card.latitude + "," + card.longitude + "&language=zh-TW&key=" +GeocodingKey
                        },function(error, response, body){
                            try{
                                var result = JSON.parse(body);
                                card.address = result.results[0].formatted_address;
                
                                request.post({
                                    url: "https://workflow.pershing.com.tw/WFMobileWeb/Service/eHRFlowMobileService.asmx/InsertCardData",
                                    headers: {
                                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                                        "X-Requested-With": "XMLHttpRequest"
                                    },
                                    body: encodeURI(GetUrlEncodeJson(card))
                                },function(error, response, body){
                                    try{
                                        var data = parser.xml2json(body);
					replyMsgToLine('push', 'Cc95c551988b0c687621be2294a5599a8', person.Name + '(' + person.Place + ') - ' + data.FunctionExecResult.ReturnMessage);
                                        console.log(person.Name + ' - ' + data.FunctionExecResult.ReturnMessage);
                                    }catch(e){
                                        replyMsgToLine('push', 'Cc95c551988b0c687621be2294a5599a8', person.Name + ' - 打卡失敗(打卡)');
					console.log(person.Name + ' - Punch error: ' + e);
                                    }
                                })
                            }catch(e){
                                 replyMsgToLine('push', 'Cc95c551988b0c687621be2294a5599a8', person.Name + ' - 打卡失敗(地址)');
				 console.log(person.Name + ' - Punch error: ' + e);
                            }
                        })
                    }
                }catch(e){
                    replyMsgToLine('push', 'Cc95c551988b0c687621be2294a5599a8', person.Name + ' - 打卡失敗(登入)');
		    console.log(person.Name + ' - Punch error: ' + e);
                }
            })
        }
        else{
            console.log(person.Name + ' - Punch error: Not punch time', date, hour + '點', '(' + day + ')');
        }
    }

    return {
        TrytoPunchIn: function(p){
            var _self = this;
	    doInit();
            doPunchIn(doValidate(), p);
            setTimeout(function(){ 
                _self.TrytoPunchIn(p);
            }, 3600000);
        }
    }
}();

//所有人打卡
setting.Persons.forEach(function(p){
    PunchCard.TrytoPunchIn(p);
});

function GetUrlEncodeJson(data) {
    var str = '';
    if (data != "" && typeof data != "undefined") {
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            var dataName = keys[i];
            if (data.hasOwnProperty(dataName)) {
                str += (i == 0) ? "" : "&";
                str += dataName + "=" + data[dataName];
            }
        }
    }
    return str;
}


////////////////////////////////////////
////////////////prototype
////////////////////////////////////////

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
