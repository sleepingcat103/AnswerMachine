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
    else if (trigger == 'test'){
        outType = 'image';
	return 'data:image/png;base64,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';
    }
}

//// request functions ////

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
