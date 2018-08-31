var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var app = express();
var cheerio = require("cheerio");
var rp = require('request-promise');
var randomReturn = require('./RandomReturn.json');
 
var jsonParser = bodyParser.json();

var outType = 'text';
var event = '';
var v_path = '/v2/bot/message/reply';
var meowSwitch = 'off';
var GroupId = 'C93f521336a66a896e7a95aad5d218057';

var options = {
    host: 'api.line.me',
    port: 443,
    path: v_path,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer actVI2pGSgmQ+JYuF2il02qMYH+1+3Q6pvaTjjL4J77uWSuVRoTZnloLqZG39jxfuZAWyS77LfHuQ9rHx4vupzxq3sDLKcwRraRq0F0t9B8aULHlhuO2BYmiIvOFjT6Vs+RFkd3GDQnNB2Ykvo6rlgdB04t89/1O/w1cDnyilFU='
    }
}
app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
    res.send('Hello');
});

app.post('/', jsonParser, function (req, res) {
    event = req.body.events[0];
    let type = event.type;
    
    let msgType = event.message.type;
    let msg = event.message.text;
    let rplyToken = event.replyToken;

    let rplyVal = null;
    
    outType = 'text';

    console.log(msg);
    if (type == 'message' && msgType == 'text') {
        try {
            rplyVal = parseInput(rplyToken, msg);
        }
        catch (e) {
            console.log('catch error');
        console.log(e.toString());
        }
    }
    
    if (rplyVal) {
        replyMsgToLine(outType, rplyToken, rplyVal);
    } else {
        console.log('Do not trigger');
    }

    res.send('ok');
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

function replyMsgToLine(outType, rplyToken, rplyVal) {

    let rplyObj;
    
    //圖片回復
    if (outType == 'image') {
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
    //發送給特定群組(文字)
    else if (outType == 'push') {
        v_path = '/v2/bot/message/push';
        rplyObj = {
            to: rplyToken,
            messages: [
                {
                  type: "text",
                  text: rplyVal
                }
            ]
        }
    } 
	
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
            'Authorization': 'Bearer actVI2pGSgmQ+JYuF2il02qMYH+1+3Q6pvaTjjL4J77uWSuVRoTZnloLqZG39jxfuZAWyS77LfHuQ9rHx4vupzxq3sDLKcwRraRq0F0t9B8aULHlhuO2BYmiIvOFjT6Vs+RFkd3GDQnNB2Ykvo6rlgdB04t89/1O/w1cDnyilFU='
        }
    }
    return options;
}

////////////////////////////////////////
//////////////// 分析開始 //////////////
////////////////////////////////////////
function parseInput(rplyToken, inputStr) {

    console.log('InputStr: ' + inputStr);
    _isNaN = function (obj) {
        return isNaN(parseInt(obj));
    }
    let msgSplitor = (/\S+/ig);
    let mainMsg = inputStr.match(msgSplitor); //定義輸入字串
    let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞，轉小寫方便辨識
    
    console.log('trigger: ' + trigger);
    
    if (trigger == '!蘿莉控' || trigger == '!3年'  || trigger == '!三年') {
        outType = 'image';
        return randomReturn.image.lolicon.getRandom();
    }
        //各種針對
    // if (trigger == '!二毛') {
        // return funnyreturn('twofur');
    // } 
    // if (trigger == '!阿紫' || trigger == '!紫') {
        // return funnyreturn('purple');
    // } 
    else if (trigger == '!臭貓') {
        return funnyreturn('author');
    } 
    // else if (trigger == '!貓貓' || trigger == '??') {
        // return funnyreturn('ccat');
    // } 
    // else if (trigger == '!miya') {
        // return funnyreturn('miya');
    // }
    // else if (trigger == '!拖拉') {
        // return funnyreturn('slow');
    // }
    // else if (trigger == '!白毛') {
    // return funnyreturn('whitefur');
    // }
    // else if (trigger == '!璃璃' || trigger == '!莉莉') {
    // return funnyreturn('lili');    
    // }
    // else if (trigger == '!蛋糕') {
    // return funnyreturn('cake');    
    //} 
    
    //發票
    else if ((trigger == '統一發票' || trigger == '發票') && mainMsg.length == 1) {
        return TWticket(rplyToken);
    }

    //google
    // 縮網址
    else if (trigger == 'shorten' && mainMsg.length > 1) {
        
        var s = inputStr.substring(inputStr.indexOf(' ')+1);
        
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
                replyMsgToLine(outType, rplyToken, s);
            }
        });
    }
    
    //google search
    else if((trigger == 'google' || trigger == '搜尋' || trigger == '谷哥') && mainMsg.length > 1){
        
        var tmp = inputStr.substring(inputStr.indexOf(' ')+1);
        
        let s = GetUrl('https://www.google.com.tw/search', {
            q: tmp
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
	//日幣
	else if (trigger == '!JP' || trigger == '!日幣') {
        return JP(rplyToken);
    }
	//貼圖
    else if(IsKeyWord(trigger, ['打架', '互相傷害r', '來互相傷害', '來互相傷害r'])){
	    return Sticker("2", "517");
    }
	
	else if(trigger == '幫QQ' || trigger == '哭哭' || mainMsg[0] == 'QQ'){
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
    else if (trigger == '貓咪安靜' || trigger == '貓咪閉嘴' || trigger == '貓咪不要吵' || trigger == '貓咪不要叫') {
        meowSwitch = 'off';
        return '......';
    }
    else if (trigger == '貓咪在哪裡'){
        meowSwitch = 'on';
        return randomReturn.text.meow.getRandom();
    }
    
    //一般功能
    else if (trigger.match(/運氣|運勢/) != null) {
        return Luck(mainMsg[0], rplyToken); //各種運氣
    }
    else if (trigger.match(/立flag|死亡flag/) != null) {
        return randomReturn.text.flag.getRandom();
    }    
    else if (trigger == '!貓咪') {
        return MeowHelp();
    }
    else if (trigger == '!help') {
        return Help();
    }
    else if (trigger.match(/排序|排列/) != null && mainMsg.length >= 3) {
        return SortIt(inputStr, mainMsg);
    }
    else if (trigger.match(/choice|隨機|選項|幫我選|幫我挑/) != null && mainMsg.length >= 3) {
        return choice(inputStr, mainMsg);
    }
    else if (trigger.match(/喵|貓/) != null) {
        return randomReturn.text.meow.getRandom();
    }
}
////////////////////////////////////////
//////////////// jp
////////////////////////////////////////

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
            //str += "\r\n"+fax[3].children[3].attribs["data-name"] + "  " +fax[3].children[3].children[0].data;
            //str += "\r\n"+fax[3].children[5].attribs["data-name"] + "  " +fax[3].children[5].children[0].data;
            //str += "\r\n"+fax[3].children[7].attribs["data-name"] + "  " +fax[3].children[7].children[0].data;
            //str += "\r\n"+fax[3].children[9].attribs["data-name"] + "  " +fax[3].children[9].children[0].data;
            console.log(str);
            replyMsgToLine(outType, replyToken, str);
        })
        .catch(function (err) {
            return "Fail to get data.";
        });
}

////////////////////////////////////////
//////////////// 統一發票
////////////////////////////////////////
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
////////////////////////////////////////
//////////////// test //////////////
////////////////////////////////////////

if (calcTime(8) == '10-3'){
    replyMsgToLine('push', GroupId, '臭貓生日 祝臭貓生日快樂喵ΦωΦ/');
}

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
    let twofurArr = ['使出挖地洞!!','你們..傷了二毛的心','嘿嘿..嘿嘿嘿嘿嘿...(口水)','(看著黑絲套裝OL流口水中)','JK! 不是，我是說，大家好','\
才不是跟蹤狂呢! 不過是自發性的警備作業而已!','我..我才沒有覺得一直被機器人玩很開心呢! 哼! (臉紅)','(不是在小學就是在往小學的途中)'];
    let purpleArr = ['--阿紫打滾中請稍後--','打魔神!','0 3 0','=皿=','大家晚安~','等等要睡覺啦','快睡著了'];
    let authorArr = ['↑正直清新不鹹濕，女友募集中！','我要給你一個翻到後腦勺的、無比華麗的、空前絕後的特大號白眼'];
    let ccatArr = ['這件...好像...也不錯......','走走走逛一中街~','今天也放假OuOb'];
    let miyaArr = ['妹妹你讀哪裡阿~','今年剛升大1 (閃亮)','還不請安'];
    let slowArr = ['二毛我抽到這隻怎麼樣...恩?你怎不說話?','加班中勿擾 -_-','前往加班的路上QAQ','貓貓是對的','恩阿那個今天不太舒服不適合逛街阿唉呀真沒辦法(棒讀)'];
    let whitefurArr = ['使出異次元攻擊！扭轉故事！','可以開始十八禁話題了嗎','(小劇場運作中)','阿阿來了!!又有靈感了!','希望..我以外的人都能幸福..(悲壯)'];
    let liliArr = ['看我的金雞獨莉!', '一條腿也很帥(發亮)','喔是喔','。','???(黑人問號臉)'];
    let cakeArr = ['\超帥/','今天有個女生跟我要電話 @ @','吃垮他!!╰（‵□′╰','死都不曝照030','白毛你這樣不行'];
    
    var rplyArr;
    
    if (name == 'twofur') {
        rplyArr = twofurArr;
    } 
    else if (name == 'purple') {
        rplyArr = purpleArr;
    } 
    else if (name == 'author') {
        rplyArr = authorArr;
    } 
    else if (name == 'ccat') {
        rplyArr = ccatArr;
    } 
    else if (name == 'miya') {
        rplyArr = miyaArr;
    }
    else if (name == 'slow') {
        rplyArr = slowArr;
    }
    else if (name == 'whitefur') {
        rplyArr = whitefurArr;    
    }
    else if (name == 'lili') {
        rplyArr = liliArr;
    }
    else if (name == 'cake') {
        rplyArr = cakeArr;
    }
    
     return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
}

////////////////////////////////////////
//////////////// 運氣運勢相關
////////////////////////////////////////
function Luck(str, replyToken) {
    var table = ['牡羊.白羊.牡羊座.白羊座', '金牛.金牛座', '雙子.雙子座', '巨蟹.巨蟹座', '獅子.獅子座', '處女.處女座', '天秤.天平.天秤座.天平座', '天蠍.天蠍座', '射手.射手座', '魔羯.魔羯座', '水瓶.水瓶座', '雙魚.雙魚座'];
    var target = str.replace('運氣', '').replace('運勢','');
    
    var index = table.indexOf(table.find(function(element){
        if(element.indexOf(target)>-1) return element;
    }));
    
    if(index>-1){
        Constellation(index, replyToken);
        return;
    }else{
        return str + ' ： ' + randomReturn.text.luck.getRandom();
    }
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
\n    關鍵字: !臭貓\
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

// function Meow() {
    // let rplyArr = ['喵喵?', '喵喵喵', '喵?', '喵~', '喵喵喵喵!', '喵<3', '喵喵.....', '喵嗚~', '喵喵! 喵喵喵!', '喵喵', '喵', '喵喵!', '喵喵....喵?', '喵!!!', '喵~喵~'];
    // if(meowSwitch == 'on'){
    // return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
    // }
// };

// function Google(){
    // let rplyArr = ['google很難嗎喵?', '(用腳踩)', '才..才不是特地為你去找的喵!', '找好了!\n酬勞就罐罐10個就好了喵<3', '這..這批很純...' + '\
// 虐貓!!本貓要罷工喵!!', '(投以鄙視的眼神)', '下次叫狗去找好喵?', '以上內容兒童不宜喵 >///<', '本網站內容只適合18歲或以上人士觀看喵', '\
// 小學生才叫貓google喵', '搜尋這甚麼鬼東西喵!! (炸毛)', '好不容易幫你搜尋了，心懷感激的看吧喵!', '居然搜尋這種東西真的是擔心你的腦袋喵...'];
    // return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
// }

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
