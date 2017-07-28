import {LocalStorage, stableFetcher} from "./utils";
import {__await} from "tslib";

const g_storage = new LocalStorage('h5plr');

declare global{
    let responsiveVoice:any
}

export class GoogleTranslates{
    storage = g_storage;
//缓存已经翻译过的信息内容
    transCache:any = [];
    transLanguageCache:any = [];
//国家与语言代码字符串
//国家
    uLanguageNames = ["中文", "中文", "中文", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "芬兰语", "英语", "丹麦语", "英语", "希伯来语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "韩文", "日语", "荷兰语", "荷兰语", "葡萄牙语", "葡萄牙语", "法语", "法语", "法语", "法语", "法语", "西班牙语", "西班牙语", "西班牙语", "西班牙语", "西班牙语", "西班牙语", "西班牙语", "德语", "德语", "德语", "俄语", "意大利语", "希腊语", "挪威语", "匈牙利语", "土耳其语", "捷克语", "斯洛文尼亚语", "波兰语", "瑞典语", "西班牙语"];
//国家所对应的地区
    uRegionNames = ["简体", "繁体台湾", "繁体香港", "香港", "美国", "英国", "全球", "加拿大", "澳大利亚", "爱尔兰", "芬兰", "芬兰", "丹麦", "丹麦", "以色列", "以色列", "南非", "印度", "挪威", "新加坡", "新西兰", "印度尼西亚", "菲律宾", "泰国", "马来西亚", "阿拉伯", "韩国", "日本", "荷兰", "比利时", "葡萄牙", "巴西", "法国", "卢森堡", "瑞士", "比利时", "加拿大", "拉丁美洲", "西班牙", "阿根廷", "美国", "墨西哥", "哥伦比亚", "波多黎各", "德国", "奥地利", "瑞士", "俄罗斯", "意大利", "希腊", "挪威", "匈牙利", "土耳其", "捷克共和国", "斯洛文尼亚语", "波兰", "瑞典", "智利"];
//最终代码
    uLanguageCode = ["zh-cn", "zh-tw", "zh-hk", "en-hk", "en-us", "en-gb", "en-ww", "en-ca", "en-au", "en-ie", "en-fi", "fi-fi", "en-dk", "da-dk", "en-il", "he-il", "en-za", "en-in", "en-no", "en-sg", "en-nz", "en-id", "en-ph", "en-th", "en-my", "en-xa", "ko-kr", "ja-jp", "nl-nl", "nl-be", "pt-pt", "pt-br", "fr-fr", "fr-lu", "fr-ch", "fr-be", "fr-ca", "es-la", "es-es", "es-ar", "es-us", "es-mx", "es-co", "es-pr", "de-de", "de-at", "de-ch", "ru-ru", "it-it", "el-gr", "no-no", "hu-hu", "tr-tr", "cs-cz", "sl-sl", "pl-pl", "sv-se", "es-cl"];
//google翻译api变量
    UA = navigator.userAgent;
    tK:string = null;
    googleDomain = "translate.google.com";
    private dictURL = "https://" + this.googleDomain + "/translate_a/single?client=t";
    private ttsURL = "http://" + this.googleDomain + "/translate_tts?client=t";
    constructor(){
        this.tK= this.storage.getItem('google_value_tk', null);
    }

    public GetLanguageCodesHtml(){
        let rst:string="<p><i>国家-地区</i><a>英文代码</a>&emsp;&emsp;<i>国家-地区</i><a>英文代码</a>&emsp;&emsp;<i>国家-地区</i><a>英文代码</a></p>";
        for (let i=0;i<this.uLanguageCode.length;i++) {
            rst += `<p><i>${this.uLanguageNames[i]}-${this.uRegionNames[i]}</i><a>${this.uLanguageCode[i]}</a>`;
            if (this.uLanguageNames[++i]) rst += `&emsp;&emsp;<i>${this.uLanguageNames[i]}-${this.uRegionNames[i]}</i><a>${this.uLanguageCode[i]}</a>`;
            else {
                rst += "</p>";
                break;
            }
            if (this.uLanguageNames[++i]) rst += `&emsp;&emsp;<i>${this.uLanguageNames[i]}-${this.uRegionNames[i]}</i><a>${this.uLanguageCode[i]}</a>`;
            else {
                rst += "</p>";
                break;
            }
        }
        return rst;
    }

    async init_google_value_tk(){
        stableFetcher("https://" + this.googleDomain,{
           method:"GET",
           headers: {
               "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"
           }
        },15, init_google_value_tk_parse);
    }

    async GetGoogleTranslate(queryStr:string, srcLanguage:string,dstLanguage:string,callbackFunc:Function){
        dstLanguage= this.GetDstLanguage(dstLanguage);
        let ans:string =this.searchInTranslateCache(dstLanguage, queryStr);
        if(ans){
            callbackFunc(ans[0][0][0], ans[0][1] ? ans[0][1][2] ? ans[0][1][2] : null : null,15);
            this.ReadText(dstLanguage,ans[0][0][0]);
        }
        else{
            await this.RequestTranslate(queryStr, srcLanguage, dstLanguage, (arrayTxt:any, lan:string) => {
                let __this = this;
                if (arrayTxt) {
                    try {
                        ans =eval(arrayTxt);
                        console.log("GetGoogleTranslate RequestTranslate ans", ans);
                        if (ans[0]) {
                            if (ans[0][0]) {
                                if (ans[0][0][0]) {
                                    __this.transCache.push(arrayTxt);
                                    __this.transLanguageCache.push(lan);
                                    __this.ReadText(dstLanguage, ans[0][0][0]);
                                    callbackFunc(ans[0][0][0], ans[0][1] ? ans[0][1][2] ? ans[0][1][2] : null : null,15);
                                    //console.log(`翻译缓存长度为：${transCache.length}，语言缓存长度为：${transLanguageCache.length} 当前加入缓存的内容为${transCache[transCache.length-1]}  ${transLanguageCache[transLanguageCache.length-1]}`);
                                }
                            }
                        }
                    }
                    catch (e) {
                        console.log("错误:" + e);
                    }
                }

            });
        }
    }

    protected  GetDstLanguage(lanStr:string){
        //默认将内容翻译成中文
        if (lanStr===""||lanStr==='undefined'||lanStr==null)return "zh-cn";
        let dstLanguage = "zh-cn";
        try {
            //如果已经用字母准确指出，则直接获取
            if (/^[A-Za-z]{2}-[A-Za-z]{2}$/.test(lanStr)) {
                for (var i = 0; i < this.uLanguageCode.length; i++) {
                    var dt = lanStr.toLowerCase();
                    if (this.uLanguageCode[i] === dt) {
                        dstLanguage = this.uLanguageCode[i];
                        break;
                    }
                }
            }
            else {
                let sL = lanStr.split(/[-——]{1}/);
                if (sL.length <= 2) {
                    if (sL.length > 1) {
                        for (var i = 0; i < this.uLanguageNames.length; i++) {
                            if (this.uLanguageNames[i] === sL[0]) {
                                if (this.uRegionNames[i] === sL[1]) {
                                    dstLanguage = this.uLanguageCode[i];
                                    break;
                                }
                            }
                        }
                    }
                    else {
                        let bFoundIt: boolean = false;
                        for (var i = 0; i < this.uLanguageNames.length; i++) {
                            if (this.uLanguageNames[i] === sL[0]) {
                                dstLanguage = this.uLanguageCode[i];
                                bFoundIt = true;
                                break;
                            }
                        }
                        if (!bFoundIt) {
                            for (var i = 0; i < this.uRegionNames.length; i++) {
                                if (this.uRegionNames[i] === sL[0]) {
                                    dstLanguage = this.uLanguageCode[i];
                                    bFoundIt = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        catch (e) {
            console.log("解析目标语言时发生错误:" + e);
        }
        return dstLanguage;
    }

    protected ReadText(lang:string, txt:string) {
        let nz = lang.split("-");
        for (let n = 0; n < responsiveVoice.responsivevoices.length; n++) {
            //console.log(this.responsiveVoice.responsivevoices[n]);
            if (responsiveVoice.responsivevoices[n].flag === nz[1]) {
                responsiveVoice.speak(txt, responsiveVoice.responsivevoices[n].name);
                //console.log("found the sound name:"+responsiveVoice.responsivevoices[n].name);
                return;
            }
        }
    }

// return token for the new API
    async googleTK(text:string) {
        // view-source:https://translate.google.com/translate/releases/twsfe_w_20151214_RC03/r/js/desktop_module_main.js && TKK from HTML
        let uM = this.tK;
        if (uM == 'undefined' || uM == null) {
            await this.init_google_value_tk();
            this.tK= uM = this.storage.getItem('google_value_tk', null);
            if (uM == null) return null;
        }
        ;
        let cb = "&";
        let k = "";
        let Gf = "=";
        let Vb = "+-a^+6";
        let t = "a";
        let Yb = "+";
        let Zb = "+-3^+b+-f";
        let jd = ".";
        let sM = function (a) {
            return function () {
                return a;
            };
        };
        let tM = function (a, b) {
            for (let c = 0; c < b.length - 2; c += 3) {
                var d = b.charAt(c + 2), d = d >= t ? d.charCodeAt(0) - 87 : Number(d), d = b.charAt(c + 1) == Yb ? a >>> d : a << d;
                a = b.charAt(c) == Yb ? a + d & 4294967295 : a ^ d;
            }
            return a;
        };
        let vM = function (a) {
            let b;
            if (null !== uM) {
                b = uM;
            } else {
                b = sM(String.fromCharCode(84));
                let c = sM(String.fromCharCode(75));
                b = [b(), b()];
                b[1] = c();
                b = (uM = window[b.join(c())] || k) || k;
            }
            let d = sM(String.fromCharCode(116)), c = sM(String.fromCharCode(107)), d = [d(), d()];
            d[1] = c();
            c = cb + d.join(k) + Gf;
            d = b.split(jd);
            b = Number(d[0]) || 0;

            for (let e = [], f = 0, g = 0; g < a.length; g++) {
                var m = a.charCodeAt(g);
                128 > m ? e[f++] = m : (2048 > m ? e[f++] = m >> 6 | 192 : (55296 == (m & 64512) && g + 1 < a.length && 56320 == (a.charCodeAt(g + 1) & 64512) ? (m = 65536 + ((m & 1023) << 10) + (a.charCodeAt(++g) & 1023), e[f++] = m >> 18 | 240, e[f++] = m >> 12 & 63 | 128) : e[f++] = m >> 12 | 224, e[f++] = m >> 6 & 63 | 128), e[f++] = m & 63 | 128);
            }
            a = b || 0;
            for (f = 0; f < e.length; f++) {
                a += e[f], a = tM(a, Vb)
            }
            a = tM(a, Zb);
            a ^= Number(d[1]) || 0;
            0 > a && (a = (a & 2147483647) + 2147483648);
            a %= 1E6;
            return a.toString() + jd + (a ^ b);
        };
        return vM(text);
    }

// Google Translate Request
    async RequestTranslate(txt:string, sl:string, tl:string, parse:Function) {
        let tk = await this.googleTK(txt);
        //console.log("RequestTranslate tk=",tk);
        let Url = this.dictURL +
            "&hl=auto" +
            "&sl=" + sl + "&tl=" + tl +
            "&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8&otf=2&trs=1&inputm=1&ssel=0&tsel=0&source=btn&kc=3" +
            "&tk=" + tk +
            "&q=" + encodeURI(txt);
        let Q = Url.split('&q=');
        let requestData= '&q=' + Q[1];
        stableFetcher(Q[0], {
                method: "POST",
                headers: {
                    "User-Agent": this.UA,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*\/*;q=0.8",
                    "Accept-Encoding": "gzip, deflate",
                    "Content-Length": requestData.length + '',
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                data: requestData
            },15,(res:any)=>{
                parse(res, tl);
            }
        );
    }

    protected  searchInTranslateCache(lan:string, str:string) {
        //console.log(`begin search! lan=${lan},str=${str}`);
        for (let n = 0; n < this.transCache.length; n++) {
            if (this.transLanguageCache[n] === lan) {
                let sps = eval(this.transCache[n]);
                if (sps[0][0][1] === str) return sps;
            }
        }
        //console.log("end search!");
        return null;
    }
}


function init_google_value_tk_parse(responseText :string){
    // TKK=eval('((function(){var a\x3d4264492758;var b\x3d-1857761911;return 406375+\x27.\x27+(a+b)})())');
    let res = /;TKK=(.*?\'\));/i.exec(responseText);
    if (res !== null) {
        let res2 = /var a=(.*?);.*?var b=(.*?);.*?return (\d+)/i.exec(res[1].replace(/\\x3d/g, '='));
        if (res2 !== null) {
            let tkk = Number(res2[3]) + '.' + (Number(res2[1]) + Number(res2[2]));
            g_storage.setItem('google_value_tk', tkk);
        }
    }
}