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
}
/**
 * 初始化uploadify上传
 * @param imgId 上传成功后 显示上传图片的 img标签的ID
 * @param filePathId 上传成功后 文件存储路径
 * @param webFilePath 文件服务主域名
 * @param fileType 文件类型 可选 ("file","image","doc") 多个可使用 "," 分隔
 */
function fileUpload(param) {
    var language = 'cn';
    var token = '';
    var domain = '';
    var _fileObj = {};

    var defaults = {
        uploadId: '',
        imgId: '',
        filePathId: '',
        webFilePath: fileUploadAddress,
        fileType: 'image',
        fileQueue: 'fileQueue',
        fileSize: 5,
        ifyWidth: 50,
        ifyHeight: 31,
        buttonImg: staticUrl + '/static/img/upload-bg.png',
        fileQueueAuto: true,
        queueSizeLimit: 6,
        fileMulti: false,
        simUploadLimit: 1,
        maxImageSize: 200,
        fileExt: null,
        callback: function() {},
        onSelect: function() {},
        // 新插件参数
        fileInputTitle: '请选择'
    };

    var option = $.extend({}, defaults, param);

    $.getJSON('/getUploadToken?t=' + (+new Date()), function(data) {
        var obj = eval('(' + data + ')');

        if (obj.uploadToken) {
            language = obj.language;
            token = obj.uploadToken;
            domain = obj.domain;

            var button = typeof option.uploadId === 'string' ? document.getElementById(option.uploadId) : option.uploadId;

            var uploader = new qq.FineUploaderBasic({
                request: {
                    endpoint: option.webFilePath + '/upload.do?action=upload',
                    // endpoint: '/upload.do?action=upload',
					params: {
						'moduleFlag': 'report',
						'token': token,
						'domain': domain,
						'language': language,
						'fileType': option.fileType,
						'fileSize': option.fileSize,
						'maxImageSize': option.maxImageSize,
                        'addScript': (button.style.transition === undefined ? 'true' : '')
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
                    mode: "custom"
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
						console.log('=============onError', arguments)
                    },
                    onSubmitted: function(id, name) {
						console.log('=============onSubmitted', arguments)
                        var queueID = id;
                        var fileObj = this.getFile(id) || {
                                name: this.getName(id),
                                size: this.getSize(id)
                            };
                        console.log(fileObj)


                        if (isFunction(option.onSelect)) {
                            var s = option.onSelect(event, queueID, fileObj);
                            if (s == false)
                                return false;
                        }
                        _fileObj.size = fileObj.size;
                        _fileObj.type = '.' + fileObj.name.split('.').pop();
                        if ($('.file-item').find('p').length >= 5) {
                            layer.alert('Maximum allowed upload 5 attached',
                                { icon: 2 });
                            layer.alert("上传的文件个数不得超过5个", {icon: 2});
                            // $('#' + option.uploadId).uploadifyCancel(queueID);
                            this.cancel(id);
                            return false;
                        }

                        if (fileObj.size > option.fileSize * 1024 * 1024) {
                            layer.alert('上传文件不允许大于' + option.fileSize + 'M', { icon: 2 });
                            // $('#' + option.uploadId).uploadifyCancel(queueID);
                            this.cancel(id);
                            return false;
                        }

                        if (!validateFileType(fileObj, param)) {
                            // $('#' + option.uploadId).uploadifyCancel(queueID);
                            this.cancel(id);
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
                        console.log('=============onComplete', arguments)
                        var obj = responseJSON;



                        $.cookie('JSESSIONID', token);//跨域传输之后必须设置cookie 否则会丢失此次的session
                        // var obj = eval('(' + _path + ')');
                        $.getJSON('/getFile?uuid=' + obj.fileUUIDs[0],
                            function(data) {
                                var callback = option.callback;


                                $(button).
                                    // parent().
                                    siblings('.poptip').
                                    remove();
                                $(button).
                                    // parent().
                                    removeClass('red-border');
                                var obj = eval('(' + data + ')');
                                obj.size = _fileObj.size;
                                obj.type = _fileObj.type;
                                obj.imgId = option.imgId;
                                obj.filePathId = option.filePathId;
                                //执行回调函数 判断是否有回调函数,如果没有就默认执行
                                if (callback && callback != undefined &&
                                    typeof callback === 'string') {
                                    callback = window[callback];
                                    if (typeof callback === 'function') {
                                        callback.apply([], [obj]);
                                    }
                                } else if (isFunction(callback)) {//判断是否是function
                                    callback(obj);
                                } else {
                                    //判断是否是图片格式
                                    if (!$.inArray(obj.type,
                                            UPLOAD_FILE_TYPE_INFO['image']) >= 0) {
                                        if (obj && obj.resultCode == 4) {
                                            var filePaths = obj.filePaths;//文件查看路径
                                            var originalFileNames = obj.originalFileNames;//原文件名
//    					        			var savePaths = obj.savePaths;//文件存储路径
                                            for (var i = 0; i <
                                            filePaths.length; i++) {
                                                $('#' + option.imgId).
                                                    attr('src', option.webFilePath + '/' +
                                                        filePaths[i]);
                                                $('#' + option.filePathId).
                                                    val(filePaths[i]);
                                            }
                                        } else {
                                            alert(url.resultMsg);
                                        }
                                    }
                                }
                            });
                    },
                    onUpload: function() {
                        console.log('=============onUpload', arguments)
                    }
				}
			});

        }
    });
}

function validateFileType(fileObj, settings) {
	var objType = '.'+ fileObj.name.toLowerCase().split('.').pop();
	var fileExt = settings.fileExt || '';
	var fileType = settings.fileType || 'image';
	if(fileExt){
        var ret = false;
        fileExt = fileExt.toLowerCase();
        var extArr = fileExt.split(",");
        for(var i=0;extArr && i<extArr.length;i++){
            if(objType == extArr[i]) ret = true;
        }
        if(!ret){
            layer.alert("请上传文件类型为 "+fileExt+" 的文件", {icon: 2});
            return false;
        }
        return ret;
    } else if(fileType) {
    	var fileTypes = fileType.split(',');
    	for(var i = 0; i < fileTypes.length; i++) {
    		var accepts = UPLOAD_FILE_TYPE_INFO[$.trim(fileTypes[i])];
    		if($.inArray(objType, accepts) >= 0) {
    			return true;
    		}
    	}
    	layer.alert("文件类型不正确", {icon: 2});
    	return false;
    } else {
    	// 默认只允许图片
        if(!$.inArray(objType, UPLOAD_FILE_TYPE_INFO['image']) >= 0){
            layer.alert("文件类型不正确", {icon: 2});
            return false;
        }
    }
    return true;
}

function isFunction(fn){
    return Object.prototype.toString.call(fn) === '[object Function]';
}

//显示图片
var IMAGE_DEFAULTS = {
		fileViewAddress: fileViewAddress, // 一般不需要传，默认就是文件查看的服务器地址
		showDel: false, // 图片是否可删除
		showView: true, // 图片是否可查看大图
		showEdit: true, // 图片是否可编辑
		showClear: false, // 图片是否可清除，注意showClear和showDel同时存在时，showDel是无效的
		editable: true, // 是否有修改的权限，如果为false，会自动把showEdit、showDel设为false，并且max设为1
		inputHidden: undefined, // 隐藏的input框，用于存放图片地址
		max: 1, // 上传图片张数，设置大于1时需要在外层用image-upload-group包住
		callback: null
};
/**
 * 显示图片
 *
 * @param id file控件的id
 * @param data 图片信息，{filePaths: ["xxx.jpg"], originalFileNames: ["文件名"]}
 * @param 参数，参考IMAGE_DEFAULTS
 */
function showImage(id, data, params){
	var options = $.extend({}, IMAGE_DEFAULTS, params);
	var fileViewAddress = options.fileViewAddress,
	showDel = options.showDel,
	showView = options.showView,
	showEdit = options.showEdit,
	showClear = options.showClear,
	editable = options.editable,
	inputHidden = options.inputHidden || $('#'+id).siblings("input[name='"+id+"']"),
	max = options.max,
	callback = options.callback,
	btns = options.btns;

	// 当前没有图片，直接初始化图片上传组件
	if(!data || !data.filePaths || data.filePaths.length==0 || !data.filePaths[0] || data.filePaths[0].indexOf('no_available_url') > 0) {
		if(editable) {
			fileUpload({
				uploadId : id + '_head',//上传组件id
                fileMulti: options.fileMulti,
				callback : function(data){
					if(callback) {
						callback(data, params);
					}
					showImage(id, data, params);
				}
			});
		}
		return;
	}

	if(!editable) {
		showDel = options.showDel = false;
		showEdit = options.showEdit = false;
		max = options.max = 1;
	}

	$(this).remove();
	var imagePath = data.filePaths[0];
	var realName = data.originalFileNames ? data.originalFileNames[0] : '';
	if (imagePath){
		var url = getFileViewUrl(imagePath);
		var showImageHead = $("#"+id+"_head");
		$("#"+id+"_img").remove();
		//===========
		showImageHead.find('.change-pic').remove();
		//===========
		showImageHead.append("<img src='" + url + "' id='"+id+"_img'  _filePath='" + imagePath + "' _realFileName='" + realName + "'>");
		// 查看按钮
	    if(showView) {
    		showImageBtn(showImageHead, {
    			name: '查看',
    			classes: 'show-pic'
    		});
    	}
	    // 编辑按钮
	    if(showEdit) {
	    	showImageEditBtn(id, showImageHead, params);
	    }
	    // 其它按钮
	    if(btns) {
	    	for(var i = 0; i < btns.length; i++) {
	    		var btn = btns[i];
	    		showImageBtn(showImageHead, btn);
	    	}
	    }
	    var parent = $('#' + id).parents('.image-upload-group');
	    var length = parent.find('.image-upload-wrap').length;
	    if(showClear && $("#"+id+"_head").siblings('.clear-pic').length==0) {
    		$("#"+id+"_head").before('<i class="clear-pic"></i>');
    		$("#"+id+"_head").prev('.clear-pic').on('click', function(e){
    			e.stopPropagation();
    			$("#"+id).siblings('.change-pic').remove();
    			$("#"+id).siblings('img').remove();
    			inputHidden.val('');
    			$(this).remove();
    			if($("#"+id).siblings('object').length == 0) {
    				// 清除后上传组件未初始化的情况
    				showImage(id, null, params);
    			}
    		});
	    } else if(showDel){
	    	$("#"+id+"_head").before('<i class="del-pic"></i>');
		    $("#"+id+"_head").prev('.del-pic').on('click', function(){
		    	$("#"+id+"_head").parent().remove();
		    	 if(length == max){
	    			showImage2(parent, max, inputHidden.attr('name'), fileMulti);
		    	 }
		    });
	    }
	    parent.attr('data-max', max);
	    if(max > 1 && parent.find('.image-upload-wrap').length < max) {
	    	showImage2(parent, max, inputHidden.attr('name'));
	    }

	    inputHidden.val(imagePath)
	}else{
		fileUpload({
	        uploadId : id + '_head',//上传组件id
            fileMulti: options.fileMulti,
	        callback : function(data){
				showImage(id, data, params);
	        }
	    });
	}
}

function showImageBtn(showImageHead, btn) {
	var changePic = showImageHead.find('.change-pic');
	if(changePic.length == 0) {
		showImageHead.append('<i class="change-pic"></i>');
		changePic = showImageHead.find('.change-pic');
	}
	var name = btn.name,
		classes = btn.classes;
		callback = btn.callback;
	var btnHtml = $('<em class="' + classes + '">' + name + '</em>');
	changePic.append(btnHtml);
	if(callback) {
		btnHtml.on('click', function() {
			callback(this);
		});
	}
}

function showImageEditBtn(id, showImageHead, params) {
	var changePic = showImageHead.find('.change-pic');
	if(changePic.length == 0) {
		showImageHead.append('<i class="change-pic"></i>');
		changePic = showImageHead.find('.change-pic');
	}
    var randomId = new Date().getTime() + "_update"; // 随机id，因为id不能重复
    var btnHtml= $('<em id="'+randomId+'_head"><input type="file" class="file-btn" id="'+randomId+'"/>编辑</em>');
    changePic.append(btnHtml);
    fileUpload({
        uploadId : randomId + '_head',
        fileMulti: params.fileMulti,
        callback : function(data){
            var editParams = $.extend({}, params, {max: 1});
            showImage(id, data, editParams);
            if(callback){
                callback(data, editParams);
            }
        }
    });
}

//max当前最多可上传的数
function showImage2(appendComponent, max, name, fileMulti) {
	//最多可上传图片张数
	var imageLength = appendComponent.find('.image-upload-wrap').length;
	var hiddenClass = imageLength == max ? 'hide' : '';
	var id = new Date().getTime() + "_" + imageLength;
	var html = $('<span class="image-upload-wrap '+hiddenClass+'">'+
					'<a class="image-upload" id="'+id+'_head">'+
				'<input type="file" class="file-btn" id="'+id+'"/>'+
				'<input type="hidden" name="'+name+'"/>'+
			'</a>'+
		'</span>');
	appendComponent.append(html);

	fileUpload({
		uploadId : id + '_head',//上传组件id
        fileMulti: fileMulti,
	    callback : function(data){
	    	showImage(id, data, {
	    		max: max,
	    		showDel: true,
	    		inputHidden: html.find('[name='+name+']')
	    	});
	    }
	});
}

/**
 * 获取图片的完整路径
 *
 * @param url 可以是完整路径也可以是图片服务器的相对路径
 * @param reduce true表示需要压缩，false表示不需要压缩
 * <font color="red"><p>注意只有上传时设置了maxImageSize的图片才可以压缩</p></font>
 */
function getFileViewUrl(url, reduce) {
	if(!url) {
		return '';
	}
	if(!/^http:/.test(url)) {
		url = fileViewAddress + url;
	}
	if(reduce === true && url.indexOf('_reduce') === -1) {
		var index = url.lastIndexOf('.');
		url = url.substring(0, index) + '_reduce' + url.substring(index);
	} else if(reduce === false && url.indexOf('_reduce') !== -1) {
		url = url.replace('_reduce', '');
	}
	return url;
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