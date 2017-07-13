
function initEditor(param) {
	var timestamp = (new Date()).valueOf();
	var token = "";
	var language = "cn";
	var domain = "";
	KindEditor.ready(function(K) {
		var webFilePath = $("input[name='h_webFilePath']").val();
		var webFileUploadPath = $("input[name='h_webFileUploadPath']").val();
		var webRootPath = $("input[name='h_webRootPath']").val();
		$.getJSON('/getUploadToken?t='+timestamp,
			function(msg){
			data = (msg instanceof Object) ? msg : eval("("+msg+")");
				if(data.uploadToken) {
					token = data.uploadToken;
					language = data.language;
					domain = data.domain;
				    window.editor = K.create(param.el,{
				    	swf: webRootPath+"/static/lib/uploadify/uploadify.swf",
				        resizeType: 1,
				        //pasteType: 1, //粘贴无格式
				        urlType: 'domain',
				        uploadJson: webFileUploadPath+"/upload.do?action=upload",
				        //uploadJson: webFileUploadPath+"/kindEditorUpload.do?imageViewPath="+webFilePath.replace("http://", "")+"&editor=kindeditor",
				        baseFilePath: webFilePath,
				        imageSizeLimit: "5MB",
				        extraFileUploadParams: {moduleFlag:"report","token":token,"domain":domain,"language":language,"fileType":"image"},
				        allowFlashUpload: false,
				        allowMediaUpload: false,
				        allowFileUpload: false,
                        // filterMode: false,
				        afterUpload: function(){
							$.cookie('JSESSIONID',token);
                        },
                        afterCreate: function () {
                            this.sync();
                        },
                        afterBlur: function () {
                            this.sync();
                        }
                    });

				}
		 	}
		);		
	});	
}


