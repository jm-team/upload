/**
 * 初始化uploadify上传
 * @param imgId 上传成功后 显示上传图片的 img标签的ID
 * @param filePathId 上传成功后 文件存储路径
 * @param webFilePath 文件服务主域名
 * @param fileType 文件类型 可选 ("file","image","doc") 多个可使用 "," 分隔
 */
function fileUpload(param) {
    var timestamp = (new Date()).valueOf();
    var token = "";
    var language = "cn";
    var domain = "";
    var uploadId,imgId,filePathId,webFilePath,webViewPath,fileType,callback,onSelect,fileQueue="fileQueue",fileSize = 3,
        ifyWidth=50,ifyHeight=31,buttonImg=null,fileQueueAuto=true,queueSizeLimit=6,fileMulti=false,simUploadLimit=1,fileExt = null;
    if(param){
        uploadId = param.uploadId;
        if(param.imgId){imgId = param.imgId};
        if(param.filePathId){filePathId = param.filePathId};
        if(param.webFilePath){webFilePath = param.webFilePath};
        if(param.webViewPath){webViewPath = param.webViewPath}; // 文件查看
        if(param.fileType){fileType =param.fileType};
        if(param.fileQueue){fileQueue =param.fileQueue};
        if(param.callback){callback = param.callback};
        if(param.onSelect){onSelect = param.onSelect};
        if(param.fileSize){fileSize = param.fileSize};
        if(param.ifyHeight){ifyHeight = param.ifyHeight};
        if(param.ifyWidth){ifyWidth = param.ifyWidth};
        if(param.buttonImg){buttonImg = param.buttonImg};
        if(param.fileQueueAuto == "false"){fileQueueAuto = false};
        if(param.queueSizeLimit){queueSizeLimit = param.queueSizeLimit};
        if(param.fileMulti){fileMulti = param.fileMulti};
        if(param.simUploadLimit){simUploadLimit = param.simUploadLimit};
        if(param.fileExt){fileExt = param.fileExt};
    }

    $.getJSON('/UploadApiServlet?t='+timestamp,
        function(data){
            if (data.uploadToken) {
                token = data.uploadToken;
                language = data.language;
                domain = data.domain;
                $("#"+uploadId).uploadify({
                    'uploader': '/uploadify/scripts/uploadify.swf',
                    'script': webFilePath+'/upload.do?action=upload',//后台处理的请求
                    'scriptData':{moduleFlag:"report","token":token,"domain":domain,"language":language,"fileType":fileType,"fileSize":fileSize},//后台参数 json格式
                    'cancelImg': webFilePath+'/dsw/js/uploadify/images/cancel.png',
                    'queueID': fileQueue,//与下面的id对应
                    'queueSizeLimit': queueSizeLimit,
                    'fileExt': '*.*', //控制可上传文件的扩展名，启用本项时需同时声明fileDesc
                    'fileDesc': '只能上传图片',
                    'auto': fileQueueAuto,
                    'multi': fileMulti,
                    'width': ifyWidth,
                    'height': ifyHeight,
                    'simUploadLimit': simUploadLimit,
                    'sizeLimt': fileSize*1024*1024,//文件上传大小限制
                    'buttonImg': buttonImg,
                    'onError': function (event, queueID, fileObj, errorObj) {
                        alert(errorObj.type + "Error:" + errorObj.info);
                    },
                    'onSelect': function(event,queueID,fileObj){
                        if(isFunction(onSelect)){
                            var s = onSelect(event,queueID,fileObj);
                            if(s == false)
                                return false;
                        } else{
                            if ($(".file-item").find("p").length >= 5) {
                                //layer.alert("Maximum allowed upload 5 attached", {icon: 2});
                                layer.alert("上传的文件个数不得超过5个", {icon: 2});
                                $("#"+uploadId).uploadifyCancel(queueID);
                                return false;
                            }

                            if (fileObj.size > fileSize*1024*1024){
                                layer.alert("上传文件不允许大于"+fileSize+"M", {icon: 2});
                                $("#"+uploadId).uploadifyCancel(queueID);
                                return false;
                            }
                            fileObj.type = fileObj.type.toLowerCase();
                            if(fileExt){
                                var ret = false;
                                fileExt = fileExt.toLowerCase();
                                var extArr = fileExt.split(",");
                                for(var i=0;extArr && i<extArr.length;i++){
                                    if(fileObj.type == extArr[i]) ret = true;
                                }
                                if(!ret){
                                    layer.alert("文件类型不正确", {icon: 2});
                                    $("#"+uploadId).uploadifyCancel(queueID);
                                    return false;
                                }
                                return ret;
                            }else{
                                if(fileObj.type=='.jpg'||fileObj.type=='.jpeg'||fileObj.type=='.bmp'||fileObj.type=='.gif'||fileObj.type=='.png'||fileObj.type=='.tif'||fileObj.type=='.rgb'||fileObj.type=='.dib'||fileObj.type=='.eps'||fileObj.type=='.jpe'||fileObj.type=='.pcx'||fileObj.type=='.bmp'||fileObj.type=='.gif'||fileObj.type=='.pdf'){
                                }else{
                                    layer.alert("文件类型不正确", {icon: 2});
                                    $("#"+uploadId).uploadifyCancel(queueID);
                                    return false;
                                }
                            }
                        }
                        return true;
                    },
                    'onComplete': function (event, queueId, fileObj, _path, data) {
                        $.cookie('JSESSIONID',token);//跨域传输之后必须设置cookie 否则会丢失此次的session
                        var obj=eval('(' + _path + ')');
                        $.getJSON('/getFile?uuid='+obj.fileUUIDs[0],function(data){
                            //获取到真实路径
                            var obj1=eval('(' + data + ')');
                            obj.filePaths = obj1.filePaths;
                            //执行回调函数 判断是否有回调函数,如果没有就默认执行
                            if(callback && callback != undefined && typeof callback === 'string'){
                                callback = window[callback];
                                if(typeof callback === 'function'){
                                    callback.apply([],[obj]);
                                }
                            }else if(isFunction(callback)){
                                //判断是否是function
                                callback(obj);
                            }else{
                                //判断是否是图片格式
                                if(fileObj.type=='.jpg'||fileObj.type=='.jpeg'||fileObj.type=='.bmp'||fileObj.type=='.gig'||fileObj.type=='.png'||fileObj.type=='.tif'||fileObj.type=='.rgb'||fileObj.type=='.dib'||fileObj.type=='.eps'||fileObj.type=='.jpe'||fileObj.type=='.pcx'||fileObj.type=='.bmp'||fileObj.type=='.gif'||fileObj.type=='.pdf'){
                                    if(obj && obj.resultCode == 4){
                                        $("#"+imgId).attr("src",webViewPath + '/' + obj.filePaths[0]);
                                        $("#"+filePathId).val(obj.filePaths[0]);
                                    }else{
                                        alert(url.resultMsg);
                                    }
                                }
                            }

                        });
                    }
                });
            }
        }
    );
}

function isFunction(fn){
    return Object.prototype.toString.call(fn) === '[object Function]';
}


/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', {expires: 7, path: '/', domain: 'jquery.com', secure: true});
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 * If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 * If set to null or omitted, the cookie will be a session cookie and will not be retained
 * when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 * require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        var path = options.path ? '; path=' + options.path : '';
        var domain = options.domain ? '; domain=' + options.domain : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};