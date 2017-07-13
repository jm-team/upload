# upload
> 上传控件由 uploadify 迁移至 fine-uploader

## 迁移说明：

### 文件引用 

1. 从附件获取以下js文件
 - fine-uploader.core.js
 - upload.js

2. 替换原来的uploadify
```html
<!-- uploadify start -->
<link rel="stylesheet" href="http://image5.jm.com/dsw/js/uploadify/css/uploadify.css"/>
<link rel="stylesheet" href="http://image5.jm.com/dsw/js/uploadify/css/upload-custom.css"/>
<script src="http://image5.jm.com/dsw/js/uploadify/scripts/swfobject.js"></script>
<script src="http://image5.jm.com/dsw/js/uploadify/scripts/jquery.uploadify.v2.1.0.js"></script>
<script src="http://image5.jm.com/dsw/js/upload.js"></script>
<!-- uploadify end -->
```
3. Core版不包含上传功能以外的样式、交互，交互及按钮样式等都由各平台根据设计自行实现。


### API变动  

| Option | Type | Description |
|-------:|:----:|:------------|
|defaultWatermark| 新增 | 默认为“false”, `"defaultWatermark":true`上传后默认水印将出现在图片的中央 |
|watermarkText   | 新增 | 提供水印文字（watermarkText）。上传后水印文字将出现在图片的正中 |
|watermarkImage  | 新增 | 提供水印图片的URL（watermarkImage）。上传后水印图片将出现在图片的中央。 |
|fileInputTitle  | 新增 | 按钮title, 默认为“请选择” 。 |
|endpoint        | 新增 | 自定义上传路径 |
|uploadId        | 修改 | Id或HTMLElement，如果是input自动使用其父元素，不能为行内元素。 |
|fileExt         | 修改 | 替换`fileTypeExts`，格式为`.gif,.jpg,.png` |
|webFilePath     | 修改 | 默认读取全局常量 WEB_FILE_PATH，用于统一配置上传服务器地址，不需要每次都传了，也可继续传参覆盖。 |
|webViewPath     | 修改 | 默认读取全局常量 WEB_VIEW_PATH，用于统一配置查看图片服务器地址。 |
|onComplete(responseJSON, id, name, uploader, xhr)       | 新增 | 上传成功后的回调，注意**设置此回调`return false;`后，将不执行后续默认的处理逻辑**，包括`callback`回调 |
|onError(errorReason, id, name, uploader, xhr)       | 新增 | errorReason为错误信息的字符串 |
|onSelect(fileObj, id, name, uploader)      | 修改 | fileObj为包含文件名称和大小的file对象，注意**设置此回调`return false;`后，将不执行后续默认的处理逻辑** |
|callback(resp, id, name, uploader)      | 修改 | resp包含上传成功返回的JSON和file对象, 注意resp对象不需要再次parse了~~var resp = $.parseJSON(resp);~~ |
|buttonImg       | 弃用 | 按钮样式由用户定义 |
|fileQueue       | 弃用 | 文件上传队列容器，没有交互需求 |
|queueSizeLimit  | 弃用 | 文件上传队列限制 |
|simUploadLimit  | 弃用 | 接口一次只提交一个文件 |


### 注意细节

 - fileUpload(options)调用方式不变, 但`uploadId`改为包装上传按钮的**父容器（块元素）**，不能为input等自闭合标签（行内元素）。（考虑到老控件一直以input作为uploadId，已添加判断：如果uploadId是input元素就使用他的父容器作为上传按钮）
 - `uploadId`为行内元素（span，em，a）时，overflow会失效，导致按钮超出容器，遮罩住其他元素。请务必设置元素样式`display: block`或者`display: inline-block`。
 - 统一了所有回调参数的格式:`callback(data, fileId, fileName, uploadInstance)`, 第一个参数data根据回调的类型不同而有所差异，后面三个参数一样。
 - 回调参数`fileObj`对象在ie8、9下无法获取文件大小，`fileObj.size = -1`，将导致前端校验失效。
 - 实例包含大量方法提供用户调用，如：取消上传、 获取其他属性。详细文档[https://docs.fineuploader.com](https://docs.fineuploader.com/branch/master/api/methods.html)
 - 查看api时请注意，目前使用fine-uploader的CORE版，未包含UI功能模块。
 - 请勿使用官方的min版，因为该插件的压缩版在IE8下报错（uglify-js 2.7+ 默认不兼容IE8），如有需求可使用其他工具自行压缩。
 - 目前上传文件服务器不支持`.txt`格式
 
