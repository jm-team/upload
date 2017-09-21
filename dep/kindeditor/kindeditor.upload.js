KindEditor.plugin('upload', function(K) {
    var self = this, name = 'upload',
        formatUploadUrl = K.undef(self.formatUploadUrl, true),
        imageFileBasePath = K.undef(self.baseFilePath, ''),
        imageFileTypes = K.undef(self.imageFileTypes, '.jpeg,.jpg,.gif,.png'),
        uploadJson = K.undef(self.uploadJson,
            self.basePath + 'php/upload_json.php'),
        extraParams = K.undef(self.extraFileUploadParams, {}),
        fillDescAfterUploadImage = K.undef(self.fillDescAfterUploadImage,
            false);

    var fn = self.plugin.upload = {
        init: function(){
            fileUpload({
                'endpoint': uploadJson,
                'formData': extraParams,
                'uploadId': K('.ke-icon-upload', K(self.toolbar.div[0]))[0],
                'fileType': 'image',
                'fileExt': imageFileTypes,
                'fileQueueAuto': true,
                'fileMulti': true,
                'callback': function(rData) {

                    //var rData = JSON.parse(data);
                    if (rData && rData.resultCode == 4) {
                        var url = rData.filePaths.pop() || '';
                        if (imageFileBasePath) url = imageFileBasePath + url;
                        if (formatUploadUrl) {
                            url = K.formatUrl(url, 'absolute');
                        }

                        if (!fillDescAfterUploadImage) {
                            clickFn.call(self, url,
                                rData.originalFileNames.pop() || '',
                                rData.width, rData.height, rData.border,
                                rData.align);
                        } else {
                            K('.ke-dialog-row #remoteUrl', div).val(url);
                            K('.ke-tabs-li', div)[0].click();
                            K('.ke-refresh-btn', div).click();
                        }
                    } else {
                        alert(rData.returnMsg);
                    }
                }
            });
        },
        click: function(url, title, width, height, border, align) {
            self.exec('insertimage', url, title, width, height,
                border, align);
        }
    };
    K.lang({
        upload : '上传'
    });
    self.afterCreate(function(){
        fn.init();
    });
});

