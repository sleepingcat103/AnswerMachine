var express = require('express'),
    bodyParser = require('body-parser'),
    jsonParser = bodyParser.json(),
    https = require('https'),
    app = express();
    
var randomReturn = require('./RandomReturn.json'),
    setting = require('./settings.json'),
    PunchCard = require('./PunchCard.js'),
    myFunc = require('./MyFunc.js');

var ChannelAccessKey = 'actVI2pGSgmQ+JYuF2il02qMYH+1+3Q6pvaTjjL4J77uWSuVRoTZnloLqZG39jxfuZAWyS77LfHuQ9rHx4vupzxq3sDLKcwRraRq0F0t9B8aULHlhuO2BYmiIvOFjT6Vs+RFkd3GDQnNB2Ykvo6rlgdB04t89/1O/w1cDnyilFU=';

var event = '',
    meowSwitch = false;

app.set('port', (process.env.PORT || 5000));

app.get('/', function (req, res) {
    res.send('hello');
});

app.get('/:punch', async function (req, res) {
    res.send('punch channel');
    if(req.params.punch == 'sc'){
        setting.Persons.forEach(async function(p){
            var result = await PunchCard.TrytoPunchIn(p);
            if(result){
                console.log('Punch:', result);
                replyMsgToLine('push', 'Cc95c551988b0c687621be2294a5599a8', result);
            }
        });
    }
});

app.post('/', jsonParser, async function (req, res) {
    try{
        event = req.body.events[0];
        var type = event.type;
        
        var replyToken = event.replyToken;
        var replyObj = null;
        
        //初次加入給使用說明訊息
        if (type == 'join' || type == 'follow'){
            var result = await myFunc.Help();
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

    var rplyObj, v_path;

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
            messages: [{
                type: "image",
                originalContentUrl: rplyVal,
                previewImageUrl: rplyVal
            }]
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
            messages: [{
                type: "text",
                text: rplyVal
            }]
        }
    }

    let rplyJson = JSON.stringify(rplyObj);

    // // test
    // console.log('Do reply to line,', outType, rplyToken);
    // console.log('rplyObj,', rplyObj);
    // return;

    var options = setOptions(v_path);
    var request = https.request(options, function (response) {
        console.log('Status: ' + response.statusCode);
        //console.log('Headers: ' + JSON.stringify(response.headers));
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

function setOptions(v_path) {
    var option = {
        host: 'api.line.me',
        port: 443,
        path: v_path,
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

            var result = await myFunc.TWticket();
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }

        // 縮網址
        else if (trigger == 'shorten' && mainMsg.length > 1) {
            var result = await myFunc.shortenUrl(inputStr.substring(inputStr.indexOf(' ')+1));
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }
        
        // google search
        else if(IsKeyWord(trigger, ['google', '搜尋', '尋找']) && mainMsg.length > 1){
            var result = await myFunc.googleSearch(inputStr.substring(inputStr.indexOf(' ')+1));
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }

        // 日幣
        else if (IsKeyWord(trigger, ['!jp', '!日幣','！jp', '！日幣', '！ＪＰ', '！ｊｐ'])) {
            var result = await myFunc.JP();
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }

        //梗圖
        else if (trigger.match(/jpg/) != null && mainMsg.length == 1){
            var result = await myFunc.Neta(mainMsg[0].replace('jpg',''));
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
            var result = await myFunc.Luck(mainMsg[0]);
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
            var result = await myFunc.Help();
            if(result.IsSuccess){
                replyObj.msg = result.msg;
            }else{
                throw result.msg;
            }
        }
        else if (trigger.match(/排序|排列/) != null && mainMsg.length >= 3) {
            replyObj.msg = myFunc.SortIt(inputStr, mainMsg);
        }
        else if (trigger.match(/choice|選擇|隨機|選項|幫我選|幫我挑/) != null && mainMsg.length >= 3) {
            replyObj.msg = myFunc.Choice(inputStr, mainMsg);
        }
        else if (trigger.match(/喵|貓/) != null && meowSwitch) {
            replyObj.msg = randomReturn.text.meow.getRandom();
        }
        
        return replyObj;

    }catch(e){
        console.log('parse inpur error:', e.toString());
    }
}

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

function MeowHelp() {
    return randomReturn.text.meow.getRandom() + '\n要做什麼喵?\n\n(輸入 !help 以獲得使用說明)';
}

Array.prototype.getRandom = function (flag) {
    //取得陣列隨機內容
    return this[Math.floor((Math.random() * (this.length)) + 0)];
}
