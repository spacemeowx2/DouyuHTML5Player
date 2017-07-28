import {LocalStorage, stableFetcher} from "./utils";

export class TulingRobot{
    //存储图灵机器人的用户ID
    uTulingUserId:string = null;
    tulingApiKey:string=null;
    tulingCityInfo:string = null;
    storage=new LocalStorage('h5plr');
    constructor(){
        this.uTulingUserId= this.storage.getItem("tuling_user_id", null);
        if (this.uTulingUserId==null){
            this.uTulingUserId = "dyUser" + (Math.random()).toString().substr(2);
            this.storage.setItem("tuling_user_id",this.uTulingUserId);
        }
        this.tulingApiKey=this.storage.getItem("tuling_api_key", null);
        if (this.tulingApiKey==null){
            this.tulingApiKey = "be2d2522d3db4d7ea0d6dba06c0bea9e";
            this.storage.setItem("tuling_api_key", this.tulingApiKey);
        }
        this.tulingCityInfo=this.storage.getItem("tuling_city_info",null);
        /*
        //addCORsScript("http://int.dpool.sina.com.cn/iplookup/iplookup.php?format=js"); //因为涉及到mixedContent，所以无法直接加载
        stableFetcher("http://int.dpool.sina.com.cn/iplookup/iplookup.php?format=js", {
            method: "GET",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
            }
        }, 10, (responseText: any) => {
            if (responseText != null && responseText != 'undefined') {
                console.log("get city info api", responseText);
                remote_ip_info = eval(responseText.substr(responseText.indexOf("{\"ret\":")));
                console.log("set city info", remote_ip_info);
            }
        });*/
    }

    public SetCityInfo(city:string){
        if (city!=null&&city!='undefined'){
            city = city.trim();
            if (city.length>2){
                this.storage.setItem("tuling_city_info",city);
                this.tulingCityInfo=city;
                return true;
            }
        }
        return false;
    }

    public SetTulingApiKey(key:string){
        if (key!=null&&key!='undefined'){
            key = key.trim();
            if (key ==="default"||key ==="默认"){
                this.tulingApiKey = "be2d2522d3db4d7ea0d6dba06c0bea9e";
                this.storage.setItem("tuling_api_key", this.tulingApiKey);
                return true;
            }
            if (key.length==32) {
                if (/[a-z0-9]{32}/.test(key)) {
                    this.tulingApiKey=key;
                    this.storage.setItem("tuling_api_key", this.tulingApiKey);
                    return true;
                }
            }
        }
        return false;
    }

    async GetTulingRobotAnswer(queryStr:string,callbackFunc:Function){
        let res:any=await this.TulingRobotRequest(queryStr);
        let ans:string = null;
        let showingTime:number=10;
        if(res){
            switch (res.code) {
                case 100000:
                    ans=res.text;
                    showingTime=5;
                    break;
                case 200000:
                    ans = `<a target='_blank' href='${res.url}'>${res.text}$（点击打开）</a>`;
                    showingTime =5;
                    break;
                case 302000:
                    ans = "<p>" + res.text + "</p><ul>";
                    for (var n = 0; n < res.list.length; n++) {
                        ans += "<li><a target='_blank' href='" + res.list[n].detailurl + "'>" + res.list[n].article + "（" + res.list[n].source + "，点击打开）</a></li>";
                    }
                    ans += "</ul>";
                    showingTime =10;
                    break;
                case 308000:
                    ans = "<p>" + res.text + "</p><ul>";
                    for (var n = 0; n < res.list.length; n++) {
                        ans += "<li><a tooltip='" + res.list[n].info + "' target='_blank' href='" + res.list[n].detailurl + "'>" + res.list[n].name + "（点击打开）</a></li>";
                    }
                    ans += "</ul>";
                    showingTime =10;
                    break;
                case 40001:
                case 40002:
                case 40004:
                case 40007:
                    ans="出错啦！错误信息为：" + res.text;
                    showingTime =5;
                    break;
                default:
                    ans = "返回代码为：" + res.code + "返回结果为：" + res.text;
                    showingTime =5;
                    break;
            }
            callbackFunc(null,ans,showingTime);
        }
    }

    async TulingRobotRequest(queryStr:string){
        const res=await fetch("http://www.tuling123.com/openapi/api",{
           method:"POST",
            headers:{
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            },
            body: this.tulingCityInfo ? `{"key":"${this.tulingApiKey}","info":"${queryStr}","loc":"${this.tulingCityInfo}",userid:"${this.uTulingUserId}"}`: `{"key":"${this.tulingApiKey}","info":"${queryStr}",userid:"${this.uTulingUserId}"}`
        });
        if (res)return await res.json();
        return null;
    }
}