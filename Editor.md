# 富文本上传控件迁移

> 上传控件已完成升级的情况下，再改动富文本的上传功能

## 方案一
> 插件式改动，彻底移除原富文本的上传功能（包括批量上传），自定义kindeditor上传插件，内部通过upload.js的fileUpload方法初始化上传按钮  
优点：不改动富文本源码，插件代码独立一个模块，便于后期维护  
缺点：改动点过多，IE8、9不支持多选批量上传

### 步骤：
1. 引入kindeditor-all-o.js原版文件（目前的kindeditor-all.js源码已被人修改）
2. 引入kindeditor.upload.js插件
3. upload按钮的样式需要自定义
  ```css
  .ke-icon-upload {
	background-image: url(http://center.jzx.com/static/dep/kindeditor/themes/default/default.png);
	background-position: 0px -496px;
	width: 16px;
	height: 16px;
  }
  ```
4. editor_upload.js，在initEditor中直接初始化富文本，添加参数`items`，加入'upload', 移除'image', 'multiimage'
  ```js
  K.create(param.el,{
      items : ['...','upload', '...']
  });
  ```
5. 在initEditor中不需要获取token了，token在fileUpload方法中获取。（不改也可以正常运行）
6. 上传token过期时间3小时（潜在bug风险，原先也存在，可以先忽略）

## 方案二
> 继续修改源码，将uploadify改为fine-uploader，交互及批量上传功能不改动。  
优点：所有项目的改动非常小，利于前期的快速上线需求  
缺点：继续改源码，不利于长期的维护！批量上传还是依赖flash

### 步骤：
1. 引入kindeditor-all-new.js
2. editor_upload.js不变，initEditor中获取的token给批量上传使用，在fileUpload方法中获取的token给单独的上传使用（由于每次都初始化上传按钮，所以单独上传的token不会过期）

## 方案三
> 使用百度富文本编辑器UEditor/UMEditor，webuploader判断支持H5上传就使用H5版，不支持就使用Flash上传