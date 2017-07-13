onComplete: function(id, name, responseJSON, xhr) {
                        qq.log('=============onComplete', arguments);
                        if (isFunction(option.onComplete)) {
                            option.onComplete(responseJSON, id, name, this, xhr);
                        }else{
                            var obj = responseJSON;
                            var self = this;

                            $.cookie('JSESSIONID', token);//跨域传输之后必须设置cookie 否则会丢失此次的session

                            $.getJSON('/getFile?uuid=' + obj.fileUUIDs[0], function(data) {
                                var callback = option.callback;
                                var obj = typeof data === 'string' ? JSON.parse(data) : data;

                                obj.size = _fileObj.size;
                                obj.type = _fileObj.type;
                                obj.imgId = option.imgId;
                                obj.filePathId = option.filePathId;
                                //执行回调函数 判断是否有回调函数,如果没有就默认执行
                                if (callback && callback != undefined && typeof callback === 'string') {
                                    callback = window[callback];
                                    if (typeof callback === 'function') {
                                        callback.apply([], [obj, id, name, self]);
                                    }
                                } else if (isFunction(callback)) {
                                    //判断是否是function
                                    callback(obj, id, name, self);
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
                        }
                    },
