/*通过fileExt可以直接指定允许的后缀，通过fileType则可以批量指定允许的后缀，但需要注意指定fileType的时候不会提示允许上传的文件类型，请在placeholder中说明下*/
var UPLOAD_FILE_TYPE_INFO = {
    // 图片
    'image': ['.jpeg','.jpg','.bmp','.gif','.png','.tif','.rgb','.dib','.eps','.jpe','.pcx','.bmp','.gif','.pdf'],
    // 只允许图片（有此属性时不会再判断其它属性，哪怕逗号分隔定义了多个也不行）
    'only-image': ['.jpeg','.jpg','.bmp','.gif','.png','.tif','.rgb','.dib','.eps','.jpe','.pcx','.bmp','.gif','.pdf'],
    // 文档
    'doc': ['.doc', '.docx', '.pdf'],
    // 只允许文档（有此属性时不会再判断其它属性，哪怕逗号分隔定义了多个也不行）
    'only-doc': ['.doc', '.docx', '.pdf'],
    // excel
    'excel': ['.xls', '.xlsx', '.pdf']
};

// IE8/9下使用表单提交，需要设置特殊字段为true。后端将在返回的json后插入script，实现跨越
var ADD_SCRIPT = document.documentMode && document.documentMode < 10
    ? 'true'
    : '';

/**
 * 初始化upload上传
 * @param param {object}
 * uploadId     ID/HTMLElement
 * imgId        上传成功后 显示上传图片的 img标签的ID
 * filePathId   上传成功后 文件存储路径
 * webFilePath  上传服务主域名
 * webViewPath  文件服务主域名
 * fileType     文件类型 可选 ("file","image","doc") 多个可使用 "," 分隔
 * @returns {boolean}
 */
function fileUpload(param) {
    var token = '';
    var language = 'cn';
    var domain = '';
    var _fileObj = {};

    var defaults = {
        uploadId: '',
        imgId: '',
        filePathId: '',
        webFilePath: window.WEB_FILE_PATH || '',
        webViewPath: window.WEB_VIEW_PATH || '',
        fileType: 'image',
        fileSize: 5,
        ifyWidth: 50,
        ifyHeight: 31,
        fileQueueAuto: true,
        fileMulti: false,
        maxImageSize: 200,
        fileExt: null,
        callback: null,
        onSelect: null,
        // 弃用api
        buttonImg: '',
        fileQueue: 'fileQueue',
        queueSizeLimit: 6,
        simUploadLimit: 1,
        // 新插件参数
        defaultWatermark: false, // 默认水印开关（"defaultWatermark":true）。上传后默认水印将出现在图片的中央
        watermarkText: '', // 提供水印文字（watermarkText）。上传后水印文字将出现在图片的正中
        watermarkImage: '', // 提供水印图片的URL（watermarkImage）。上传后水印图片将出现在图片的中央。
        fileInputTitle: '请选择'
    };

    var option = $.extend({}, defaults, param);

    var button = typeof option.uploadId === 'string'
        ? document.getElementById(option.uploadId)
        : option.uploadId;

    if (!$(button).length) {
        return false;
    }
    qq.log($(button)[0].nodeName, option.uploadId);
    button = $(button)[0].nodeName.toLowerCase() === 'input'
        ? button.parentNode
        : button;

    $.getJSON('/getUploadToken?t=' + (+new Date()), function(data) {
        data = JSON.parse(data);

        if (data.uploadToken) {
            token = data.uploadToken;
            language = data.language;
            domain = data.domain;

            new qq.FineUploaderBasic({
                request: {
                    endpoint: option.webFilePath + '/upload.do?action=upload',
                    params: {
                        moduleFlag: 'report',
                        token: token,
                        domain: domain,
                        language: language,
                        fileType: option.fileType,
                        fileSize: option.fileSize,
                        defaultWatermark: option.defaultWatermark,
                        maxImageSize: option.maxImageSize,
                        watermarkText: option.watermarkText,
                        watermarkImage: option.watermarkImage,
                        addScript: ADD_SCRIPT
                    },//后台参数 json格式
                    uuidName: 'uuid'
                },
                autoUpload: option.fileQueueAuto,
                button: button,
                // element: document.getElementById(option.uploadId),
                multiple: option.fileMulti,
                text: {
                    fileInputTitle: option.fileInputTitle
                },
                display: {
                    prependFiles: true
                },
                failedUploadTextDisplay: {
                    mode: 'custom'
                },
                retry: {
                    enableAuto: false
                },
                chunking: {
                    enabled: false
                },
                cors: {
                    allowXdr: true,
                    expected: true
                    // sendCredentials: true
                },
                resume: {
                    enabled: false
                },
                callbacks: {
                    onError: function() {
                        qq.log('=============onError', arguments);
                    },
                    // return false 不触发 onSubmitted 回调
                    onSubmit: function(id, name) {
                        qq.log('=============onSubmit', arguments);
                        var queueID = id;
                        var fileObj = this.getFile(id) || {
                                name: this.getName(id),
                                size: this.getSize(id)
                            };
                        qq.log(fileObj);

                        _fileObj.size = fileObj.size;
                        _fileObj.type = '.' + fileObj.name.split('.').pop();

                        if (isFunction(option.onSelect)) {
                            var s = option.onSelect(this, queueID, fileObj);

                            if (s == false) {
                                return false;
                            }
                        }

                        if ($('.file-item').find('p').length >= 5) {
                            // layer.alert('Maximum allowed upload 5 attached', { icon: 2 });
                            layer.alert('上传的文件个数不得超过5个', { icon: 2 });
                            return false;
                        }

                        if (fileObj.size > option.fileSize * 1024 * 1024) {
                            layer.alert('上传文件不允许大于' + option.fileSize + 'M', { icon: 2 });
                            return false;
                        }

                        if (!validateFileType(fileObj, option)) {
                            return false;
                        }

                        return true;
                    },
                    /**
                     * https://docs.fineuploader.com/branch/master/api/events.html#complete
                     * Integer id
                     * The current file's id.
                     *
                     * String name
                     * The current file's name.
                     *
                     * Object responseJSON
                     * The raw response from the server.
                     *
                     * XMLHttpRequest or XDomainRequest xhr
                     * The object used to make the request.
                     */
                    onComplete: function(id, name, responseJSON, xhr) {
                        qq.log('=============onComplete', arguments);
                        var obj = responseJSON;

                        $.cookie('JSESSIONID', token);//跨域传输之后必须设置cookie 否则会丢失此次的session

                        $.getJSON('/getFile?uuid=' + obj.fileUUIDs[0], function(data) {
                            var callback = option.callback;
                            var obj = JSON.parse(data);

                            obj.size = _fileObj.size;
                            obj.type = _fileObj.type;
                            obj.imgId = option.imgId;
                            obj.filePathId = option.filePathId;
                            //执行回调函数 判断是否有回调函数,如果没有就默认执行
                            if (callback && callback != undefined && typeof callback === 'string') {
                                callback = window[callback];
                                if (typeof callback === 'function') {
                                    callback.apply([], [obj]);
                                }
                            } else if (isFunction(callback)) {
                                //判断是否是function
                                callback(obj);
                            } else {
                                //判断是否是图片格式
                                if (!$.inArray(obj.type, UPLOAD_FILE_TYPE_INFO['image']) >= 0) {
                                    if (obj && obj.resultCode == 4) {
                                        var filePaths = obj.filePaths;//文件查看路径

                                        for (var i = 0; i < filePaths.length; i++) {
                                            $('#' + option.imgId).attr('src', option.webViewPath + '/' + filePaths[i]);
                                            $('#' + option.filePathId).val(filePaths[i]);
                                        }
                                    } else {
                                        layer.alert(obj.resultMsg, { icon: 2 });
                                    }
                                }
                            }
                        });
                    },
                    onUpload: function() {
                        qq.log('=============onUpload', arguments);
                    }
                }
            });
        }
    });
}

function validateFileType(fileObj, settings) {
    var objType = '.' + fileObj.name.toLowerCase().split('.').pop();
    var fileExt = settings.fileExt || '';
    var fileType = settings.fileType || 'image';
    if (fileExt) {
        var ret = false;
        fileExt = fileExt.toLowerCase();
        var extArr = fileExt.split(',');
        for (var i = 0; extArr && i < extArr.length; i++) {
            if (objType == extArr[i]) ret = true;
        }
        if (!ret) {
            layer.alert('请上传文件类型为 ' + fileExt + ' 的文件', { icon: 2 });
            return false;
        }
        return ret;
    } else if (fileType) {
        var fileTypes = fileType.split(',');
        for (var i = 0; i < fileTypes.length; i++) {
            var accepts = UPLOAD_FILE_TYPE_INFO[$.trim(fileTypes[i])];
            if ($.inArray(objType, accepts) >= 0) {
                return true;
            }
        }
        layer.alert('文件类型不正确', { icon: 2 });
        return false;
    } else {
        // 默认只允许图片
        if (!$.inArray(objType, UPLOAD_FILE_TYPE_INFO['image']) >= 0) {
            layer.alert('文件类型不正确', { icon: 2 });
            return false;
        }
    }
    return true;
}

function isFunction(fn) {
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