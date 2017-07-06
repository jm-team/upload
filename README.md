# upload
> 上传控件由 uploadify 迁移至 fine-uploader

## 迁移说明：

### 文件引用 

1. 附件获取以下js
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
3. 不包含上传功能以外的交互，交互及按钮样式等都由各平台根据设计自行实现。


### API变动  

| Option | Type | Description |
|----:|:-------:|:-------|
|fileInputTitle| 新增 | 按钮title |
|uploadId      | 修改 | Id或HTMLElement |
|webFilePath   | 修改 | 默认读取全局常量 WEB_FILE_PATH，用于统一配置上传服务器地址，不需要每次都传了，也可继续传参覆盖。 |
|webViewPath   | 修改 | 默认读取全局常量 WEB_VIEW_PATH，用于统一配置查看图片服务器地址。 |
|onSelect()    | 修改 | fine-uploader所有回调参数不带event对象，如原先的`onSelect(event, queueID, fileObj)`，将获取不到`event`对象，该参数改为控件的实例。 |
|buttonImg     | 弃用 | 按钮样式由用户定义 |
|fileQueue     | 弃用 | 文件上传队列容器，没有交互需求 |
|queueSizeLimit| 弃用 | 文件上传队列限制 |
|simUploadLimit| 弃用 | 接口一次只提交一个文件 |


### 注意细节

 - fileUpload()初始化控件方式不变, 但`uploadId`改为包装上传按钮的**父容器（块级元素）**，不能为input等自闭合标签。 （考虑到老控件一直以input作为uploadId，已添加判断：如果uploadId是input元素就使用他的父容器作为上传按钮）
 - `uploadId`为行内元素（span，em，a）时，overflow会失效，导致按钮超出容器，遮罩住其他元素。务必设置元素样式`display: block`或者`display: inline-block`。
 - 选择文件回调`onSelect(this, queueID, fileObj)` 第一个参数改为返回当前上传控件实例。
 - 回调参数fileObj对象在ie8、9下无法获取文件大小，`fileObj.size = -1`，导致前端校验失效。
 - 实例包含大量方法提供用户调用，如取消上传, 获取其他属性。详细文档[https://docs.fineuploader.com](https://docs.fineuploader.com/branch/master/api/methods.html)
 - 查看api时请注意，目前只使用了fine-uploader的CORE版，未包含UI功能模块。
