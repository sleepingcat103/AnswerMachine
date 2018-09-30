var cheerio = require("cheerio"),
    fs = require('fs'),
    rp = require('request-promise');
    imgur = require('imgur');

var randomReturn = require('./RandomReturn.json'),

exports = module.exports = {};

//// request functions ////

// 梗圖嵌字 
// 待更新: 調整字體&位置的演算法
exports.Neta = function(text){

    return new Promise(function(resolve, reject){
        try{
            var Canvas = require('canvas'),
                font = new Canvas.Font('BrSong', __dirname + '/resource/BrSong.ttc'),
                canvas = new Canvas(174, 147, "png"),
                ctx = canvas.getContext('2d');
                
            
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
exports.JP = function() {

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
exports.googleSearch = function(str){

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

exports.shortenUrl = function(url){
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

exports.TWticket = function() {
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

exports.Luck = function(str) {
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


/// 排列
exports.SortIt = function(input, mainMsg) {

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
exports.Choice = function(input, str) {
    let a = input.replace(str[0], '').match(/\S+/ig);
    return str[0] + '[' + a + '] → ' + a[Math.floor((Math.random() * (a.length + 0)))];
}

// Help

exports.Help = function() {
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