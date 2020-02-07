var errorCode = 
{
    0:"Done",


    400:"Error",
    401:"Invalid Length",
    402:"Regex Fail",
}

module.exports = class ResponseBuilder{
    constructor(res){
        this.res = res;
        this.json = {};
    }
    
    end(){
        this.res.json(this.json);
    }
    status(statusCode){
        this.res = this.res.status(statusCode);
    }
    success(){
        this.res = this.res.status(200);
        this.json['code'] = 0;
        this.json['message'] = errorCode[0];
    }
    default(code){
        if(code >= 400)
            this.res = this.res.status(400);
        else
            this.res = this.res.status(200);
    
        this.json['code'] = code;
        this.json['message'] = errorCode[code];
    }
    explicit(res,code,statusCode){
        this.res = this.res.status(statusCode);
    
        this.json['code'] = code;
        this.json['message'] = errorCode[code];
    }
    static send(responseBuilder){
        responseBuilder.res.json(responseBiulder.json);
    }
}