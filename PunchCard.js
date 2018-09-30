var setting = require('./settings.json'),
    request = require('request'),
    parser = require('xml2json-light'),
    GeocodingKey = 'AIzaSyD8cFQEtnwmlbV-D1MtmvLjc_rVGFZfg6s';

exports.TrytoPunchIn = function(p) {
    return new Promise(function(resolve, reject){
        var result = {
            msg: ''
        };

        try{
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

                        if(error) throw error;

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
                                    if(error) throw error;

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

                                            if(error) throw error;

                                            try{
                                                var data = parser.xml2json(body);
                                                resolve(person.Name + ' - ' + data.FunctionExecResult.ReturnMessage);
                                            }catch(e){
                                                console.log(person.Name + ', 打卡失敗(打卡): ' + e.toString());
                                                resolve(person.Name + ' - 打卡失敗(打卡)');
                                            }
                                        })
                                    }catch(e){
                                        console.log(person.Name + ', 打卡失敗(地址): ' + e.toString());
                                        resolve(person.Name + ' - 打卡失敗(地址)');
                                    }
                                })
                            }
                        }catch(e){
                            console.log(person.Name + ', 打卡失敗(登入): ' + e.toString());
                            resolve(person.Name + ' - 打卡失敗(登入)');
                        }
                    })
                }
                else{
                    throw 'Not punch time '+ date + ', ' +  hour + '點' + '(' + (day == 0 ? 7 : day) + ')';
                }
            }

            doInit();
            doPunchIn(doValidate(), p);
        }catch(e){
            console.log(p.Name + ', Punch error: ' + e.toString());
            resolve();
        }
    });
};

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