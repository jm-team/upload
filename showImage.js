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
                uploadId : id,//上传组件id
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
                // todo: 重复生成上传组件bug
                if($("#"+id).siblings('input[qq-button-id]').length == 0) {
                    // 清除后上传组件未初始化的情况
                    showImage(id, null, params);
                }
            });
        } else if(showDel){
            $("#"+id+"_head").before('<i class="del-pic"></i>');
            $("#"+id+"_head").prev('.del-pic').on('click', function(){
                $("#"+id+"_head").parent().remove();
                if(length == max){
                    showImage2(parent, max, inputHidden.attr('name'));
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
            uploadId : id,//上传组件id
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
        classes = btn.classes,
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
    var btnHtml= $('<em><input type="file" class="file-btn" id="'+randomId+'"/>编辑</em>');
    changePic.append(btnHtml);
    fileUpload({
        uploadId : randomId,
        callback : function(data){
            var editParams = $.extend({}, params, {max: 1});
            var callback = editParams.callback;
            showImage(id, data, editParams);
            if(callback){
                callback(data, editParams);
            }
        }
    });
}

//max当前最多可上传的数
function showImage2(appendComponent, max, name) {
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
        uploadId : id,//上传组件id
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