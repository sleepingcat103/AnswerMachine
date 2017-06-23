var express = require('express');
var bodyParser = require('body-parser');
var https = require('https');
var app = express();
 
var jsonParser = bodyParser.json();

var outType = 'text';
var event = '';
var v_path = '/v2/bot/message/reply';


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
    } else {
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
    let trigger = mainMsg[0].toString().toLowerCase(); //指定啟動詞在第一個詞&把大階強制轉成細階
	
    console.log('trigger: ' + trigger);

    	//各種針對
    if (trigger == '!二毛') {
        return twofur();
    } 
    else if (trigger == '!臭貓') {
        return author();
    } 
	
	
	//正常功能
    else if (trigger.match(/運氣|運勢|运势|运气/) != null) {
        return randomLuck(mainMsg); //占卜運氣
    }
    else if (trigger.match(/立flag|死亡flag/) != null) {
        return BStyleFlagSCRIPTS();
    }    
    else if (trigger == '!貓咪') {
        return MeowHelp();
    }
    else if (trigger.match(/喵/) != null) {
        return Meow();
    }
    else if (trigger.match(/貓/) != null) {
        return Cat();
    }
    else if (trigger == '!help') {
        return Help();
    }
    else if (trigger.match(/排序|排列/) != null && mainMsg.length >= 3) {
        return SortIt(inputStr, mainMsg);
    }   
        //生科火大圖指令開始於此
    else if (trigger == '!生科') {
        outType = 'image';
        return 'https://i.imgur.com/jYxRe8wl.jpg';
    }
        //choice 指令開始於此
    else if (trigger.match(/choice|隨機|選項|幫我選/) != null && mainMsg.length >= 3) {
        return choice(inputStr, mainMsg);
    }
	

	
}
////////////////////////////////////////
//////////////// 占卜&其他
////////////////////////////////////////


function BStyleFlagSCRIPTS() {
    let rplyArr = ['\
「打完這仗我就回老家結婚」', '\
「打完這一仗後我請你喝酒」', '\
「你、你要錢嗎！要什麼我都能給你！/我可以給你更多的錢！」', '\
「做完這次任務，我就要結婚了。」', '\
「幹完這一票我就金盆洗手了。」', '\
「好想再XXX啊……」', '\
「已經沒什麼好害怕的了」', '\
「我一定會回來的」', '\
「差不多該走了」', '\
「我只是希望你永遠不要忘記我。」', '\
「我只是希望能永遠和你在一起。」', '\
「啊啊…為什麼會在這種時候、想起了那些無聊的事呢？」', '\
「能遇見你真是太好了。」', '\
「我終於…為你們報仇了！」', '\
「等到一切結束後，我有些話想跟妳說！」', '\
「這段時間我過的很開心啊。」', '\
把自己的寶物借給其他人，然後說「待一切結束後記得還給我。」', '\
「真希望這份幸福可以永遠持續下去。」', '\
「我們三個人要永永遠遠在一起！」', '\
「這是我女兒的照片，很可愛吧？」', '\
「請告訴他/她，我永遠愛他/她」', '\
「聽好，在我回來之前絕不要亂走動哦」', '\
「要像一個乖孩子一樣等著我回來」', '\
「我去去就來」', '\
「快逃！」', '\
「對方只有一個人，大家一起上啊」', '\
「我就不信，這麼多人還殺不了他一個！」', '\
「幹，幹掉了嗎？」', '\
「身體好輕」', '\
「可惡！你給我看著！（逃跑）」', '\
「躲在這裡就應該不會被發現了吧。」', '\
「我不會讓任何人死的。」', '\
「可惡！原來是這麼回事！」', '\
「跑這麼遠應該就行了。」', '\
「我已經甚麼都不怕了」', '\
「這XXX是什麼，怎麼之前沒見過」', '\
「什麼聲音……？就去看一下吧」', '\
「是我的錯覺嗎？/果然是錯覺/錯覺吧/可能是我（看/聽）錯了」', '\
「二十年後又是一條好漢！」', '\
「大人/將軍武運昌隆」', '\
「這次工作的報酬是以前無法比較的」', '\
「我才不要和罪犯呆在一起，我回自己的房間去了！」', '\
「其實我知道事情的真相…（各種廢話）…犯人就是……」', '\
「我已經天下無敵了~~」', '\
「大人！這邊就交給小的吧，請快離開這邊吧」', '\
「XX，這就是我們流派的最終奧義。這一招我只會演示一次，你看好了！」', '\
「誰敢殺我？」', '\
「從來沒有人能越過我的劍圍。」', '\
「就算殺死也沒問題吧？」', '\
「看我塔下強殺！」', '\
「騙人的吧，我們不是朋友嗎？」', '\
「我老爸是....你有種就....」', '\
「我可以好好利用這件事」'];

    return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
}


function randomLuck(TEXT) {
    let rplyArr = ['超大吉', '大吉', '大吉', '中吉', '中吉', '中吉', '小吉', '小吉', '小吉', '小吉', '凶', '凶', '凶', '大凶', '大凶', '你還是，不要知道比較好'];
    return TEXT[0] + ' ： ' + rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
}

////////////////////////////////////////
//////////////// 恩...
////////////////////////////////////////
function twofur() {
    let rplyArr = ['使出挖地洞!!', '你們..傷了二毛的心'];
    return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
}
function author() {
    let rplyArr = ['↑正直清新不鹹濕，女友募集中！'];
    return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
}
////////////////////////////////////////
//////////////// Others
////////////////////////////////////////

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
    return str[0] + '[' + a + '] → ' + a[Math.floor((Math.random() * (a.length - 1)) + 1)];
}

////////////////////////////////////////
//////////////// Help
////////////////////////////////////////

function Help() {
    return '【貓咪喵喵】 by臭貓\
\n 主要是娛樂用途 (&各種裱人功能OuOb)\
\n \
\n 使用說明:\
\n *選擇功能*\
\n 	關鍵字: choice/隨機/選項/幫我選\
\n 	例子: 隨機選顏色 紅 黃 藍\
\n *隨機排序*\
\n 	關鍵字: 排序\
\n 	例子: 吃東西排序 羊肉 牛肉 豬肉\
\n *占卜功能*\
\n 	關鍵字: 運氣/運勢\
\n 	例子: 今日運勢\
\n *死亡FLAG*\
\n 	關鍵字: 立Flag/死亡flag\
';
}

function MeowHelp() {
    return Meow() + '\n要做什麼喵?\n\n(輸入 !help 以獲得資訊)';
}

function Meow() {
    let rplyArr = ['喵喵?', '喵喵喵', '喵?', '喵~', '喵喵喵喵!', '喵<3', '喵喵.....', '喵嗚~', '喵喵! 喵喵喵!', '喵喵', '喵', '\
喵喵?', '喵喵喵', '喵?', '喵~', '喵喵喵喵!', '喵<3', '喵喵.....', '喵嗚~', '喵喵! 喵喵喵!', '喵喵', '喵', '\
喵喵?', '喵喵喵', '喵?', '喵~', '喵喵喵喵!', '喵<3', '喵喵.....', '喵嗚~', '喵喵! 喵喵喵!', '喵喵', '喵', '\
喵喵!', '喵喵....喵?', '喵!!!', '喵~喵~'];
    return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
}

function Cat() {
    let rplyArr = ['喵喵?', '喵喵喵', '喵?', '喵~', '喵喵喵喵!', '喵<3', '喵喵.....', '喵嗚~', '喵喵! 喵喵喵!', '喵喵', '喵', '\
喵喵?', '喵喵喵', '喵?', '喵~', '喵喵喵喵!', '喵<3', '喵喵.....', '喵嗚~', '喵喵! 喵喵喵!', '喵喵', '喵', '\
喵喵?', '喵喵喵', '喵?', '喵~', '喵喵喵喵!', '喵<3', '喵喵.....', '喵嗚~', '喵喵! 喵喵喵!', '喵喵', '喵', '\
喵喵!', '喵喵....喵?', '喵!!!', '喵~喵~'];
    return rplyArr[Math.floor((Math.random() * (rplyArr.length)) + 0)];
};
